import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production";
const DATABASE_URL = process.env.DATABASE_URL;

// Database Abstraction
let db_sqlite: any = null;
let db_pg: pg.Pool | null = null;

if (DATABASE_URL) {
  console.log("Using PostgreSQL database...");
  db_pg = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  console.log("Using SQLite database...");
  db_sqlite = new Database("database.sqlite");
  db_sqlite.exec("PRAGMA foreign_keys = ON;");
}

async function query(sql: string, params: any[] = []) {
  if (db_pg) {
    let pCount = 0;
    let pgSql = sql.replace(/\?/g, () => `$${++pCount}`);
    
    // Add RETURNING id for PostgreSQL INSERTs if not present
    if (pgSql.trim().toUpperCase().startsWith("INSERT") && !pgSql.toUpperCase().includes("RETURNING")) {
      pgSql += " RETURNING id";
    }
    
    const result = await db_pg.query(pgSql, params);
    return {
      rows: result.rows,
      lastInsertRowid: result.rows[0]?.id || null,
      changes: result.rowCount
    };
  } else {
    const stmt = db_sqlite.prepare(sql);
    if (sql.trim().toUpperCase().startsWith("SELECT")) {
      return { rows: stmt.all(...params) };
    } else {
      const result = stmt.run(...params);
      return { 
        changes: result.changes, 
        lastInsertRowid: result.lastInsertRowid 
      };
    }
  }
}

async function exec(sql: string) {
  if (db_pg) {
    // Convert SQLite specific syntax to PG
    const pgSql = sql
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, "SERIAL PRIMARY KEY")
      .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
      .replace(/PRAGMA foreign_keys = ON;/gi, "");
    await db_pg.query(pgSql);
  } else {
    db_sqlite.exec(sql);
  }
}

// Initialize Database Schema
async function initDb() {
  await exec(`
    CREATE TABLE IF NOT EXISTS professionals (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      role TEXT DEFAULT 'Contador'
    );

    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      code TEXT,
      name TEXT NOT NULL,
      cpf TEXT UNIQUE NOT NULL,
      type TEXT CHECK(type IN ('PF', 'SOCIO')) NOT NULL,
      company TEXT,
      phone TEXT,
      email TEXT,
      observations TEXT,
      needs_declaration INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS declarations (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      professional_id INTEGER,
      received_date TEXT,
      completion_date TEXT,
      transmission_date TEXT,
      status TEXT DEFAULT 'Recebido',
      has_tax_to_pay INTEGER DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (professional_id) REFERENCES professionals(id)
    );

    CREATE TABLE IF NOT EXISTS calls (
      id SERIAL PRIMARY KEY,
      declaration_id INTEGER NOT NULL,
      professional_id INTEGER NOT NULL,
      call_date TEXT NOT NULL,
      summary TEXT,
      status_after_call TEXT,
      FOREIGN KEY (declaration_id) REFERENCES declarations(id),
      FOREIGN KEY (professional_id) REFERENCES professionals(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id SERIAL PRIMARY KEY,
      declaration_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER,
      upload_date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (declaration_id) REFERENCES declarations(id)
    );
  `);

  // Migration: Ensure columns exist (PG handles this differently, but for simplicity we try/catch)
  try { await exec("ALTER TABLE professionals ADD COLUMN password TEXT"); } catch (e) {}
  try { await exec("ALTER TABLE professionals ADD COLUMN role TEXT DEFAULT 'Contador'"); } catch (e) {}
  try { await exec("ALTER TABLE clients ADD COLUMN code TEXT"); } catch (e) {}
  try { await exec("ALTER TABLE clients ADD COLUMN needs_declaration INTEGER DEFAULT 1"); } catch (e) {}

  // Seed initial professional
  const { rows } = await query("SELECT * FROM professionals WHERE email = ?", ["admin@exemplo.com"]);
  if (rows.length === 0) {
    const hashedPassword = bcrypt.hashSync("admin123", 12);
    await query("INSERT INTO professionals (name, email, password, role) VALUES (?, ?, ?, ?)", ["Administrador", "admin@exemplo.com", hashedPassword, "Administrador"]);
  }
}

initDb().catch(console.error);

const app = express();
app.set('trust proxy', 1); // Trust first proxy
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for Vite dev server compatibility
}));
app.use(cors());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development/preview environment
  message: { error: "Muitas requisições, tente novamente mais tarde." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use("/api", apiLimiter);

// Auth Middleware (JWT)
const auth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.query.token as string;
  
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: "Sessão não iniciada" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { rows } = await query("SELECT * FROM professionals WHERE id = ?", [decoded.id]);
    const user = rows[0];
    
    if (!user) return res.status(401).json({ error: "Usuário não encontrado" });
    
    (req as any).user = user;
    next();
  } catch (err: any) {
    // Use 401 for expired or invalid tokens to trigger logout in frontend
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      console.warn("Auth Warning:", err.name, err.message);
      return res.status(401).json({ error: "Sessão expirada ou inválida. Por favor, faça login novamente." });
    }
    console.error("Auth Error:", err.name, err.message);
    return res.status(500).json({ error: "Erro interno de autenticação" });
  }
};

const adminOnly = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if ((req as any).user.role !== 'Administrador') {
    return res.status(403).json({ error: "Acesso negado: Somente administradores" });
  }
  next();
};

// API Routes

// Auth
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await query("SELECT * FROM professionals WHERE email = ?", [email]);
  const user = rows[0];
  
  if (user && bcrypt.compareSync(password, user.password)) {
    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: userWithoutPassword, token });
  } else {
    res.status(401).json({ error: "E-mail ou senha incorretos" });
  }
});

// All routes below this line require authentication
app.use("/api", auth);

app.post("/api/auth/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = (req as any).user;
  
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ error: "Senha atual incorreta" });
  }
  
  const hashedNewPassword = bcrypt.hashSync(newPassword, 12);
  await query("UPDATE professionals SET password = ? WHERE id = ?", [hashedNewPassword, user.id]);
  res.json({ success: true });
});

// File Upload Setup
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// API Routes

// Professionals
app.get("/api/professionals", async (req, res) => {
  const { rows } = await query("SELECT id, name, email, role FROM professionals");
  res.json(rows);
});

app.post("/api/professionals", adminOnly, async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password || '123456', 12);
    const result = await query(`
      INSERT INTO professionals (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `, [name, email, hashedPassword, role || 'Contador']);
    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/professionals/:id", adminOnly, async (req, res) => {
  try {
    // Unassign declarations first
    await query("UPDATE declarations SET professional_id = NULL WHERE professional_id = ?", [req.params.id]);
    const result = await query("DELETE FROM professionals WHERE id = ?", [req.params.id]);
    res.json({ success: true, changes: result.changes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clients
app.get("/api/clients", async (req, res) => {
  const { rows } = await query("SELECT * FROM clients ORDER BY name ASC");
  res.json(rows);
});

app.post("/api/clients", async (req, res) => {
  const { code, name, cpf, type, company, phone, email, observations, needs_declaration } = req.body;
  try {
    const result = await query(`
      INSERT INTO clients (code, name, cpf, type, company, phone, email, observations, needs_declaration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [code, name, cpf, type, company, phone, email, observations, needs_declaration !== undefined ? (needs_declaration ? 1 : 0) : 1]);
    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/clients/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Handle boolean to integer conversion for needs_declaration
  if (updates.needs_declaration !== undefined) {
    updates.needs_declaration = updates.needs_declaration ? 1 : 0;
  }

  const fields = Object.keys(updates).map(key => `${key} = ?`).join(", ");
  const values = Object.values(updates);
  
  try {
    if (fields) {
      await query(`UPDATE clients SET ${fields} WHERE id = ?`, [...values, id]);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/clients/:id", async (req, res) => {
  const clientId = parseInt(req.params.id);
  if (isNaN(clientId)) return res.status(400).json({ error: "ID inválido" });

  try {
    const { rows: attachments } = await query(`
      SELECT filename FROM attachments 
      WHERE declaration_id IN (SELECT id FROM declarations WHERE client_id = ?)
    `, [clientId]);

    await query("DELETE FROM calls WHERE declaration_id IN (SELECT id FROM declarations WHERE client_id = ?)", [clientId]);
    await query("DELETE FROM attachments WHERE declaration_id IN (SELECT id FROM declarations WHERE client_id = ?)", [clientId]);
    await query("DELETE FROM declarations WHERE client_id = ?", [clientId]);
    const result = await query("DELETE FROM clients WHERE id = ?", [clientId]);

    if (result.changes > 0) {
      for (const att of attachments) {
        const filePath = path.join(uploadDir, att.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
    res.json({ success: true, changes: result.changes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Declarations
app.get("/api/declarations", async (req, res) => {
  const { rows } = await query(`
    SELECT d.*, c.name as client_name, c.cpf as client_cpf, c.type as client_type, 
           c.company as client_company, c.code as client_code, p.name as professional_name
    FROM declarations d
    JOIN clients c ON d.client_id = c.id
    LEFT JOIN professionals p ON d.professional_id = p.id
    ORDER BY d.id DESC
  `);
  res.json(rows);
});

app.post("/api/declarations", async (req, res) => {
  const { client_id, professional_id, received_date, status, has_tax_to_pay, tax_amount } = req.body;
  const profId = professional_id === "" ? null : professional_id;
  const result = await query(`
    INSERT INTO declarations (client_id, professional_id, received_date, status, has_tax_to_pay, tax_amount)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [client_id, profId, received_date, status || 'Recebido', has_tax_to_pay ? 1 : 0, tax_amount || 0]);
  res.json({ id: result.lastInsertRowid });
});

app.patch("/api/declarations/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(", ");
  const values = Object.values(updates);
  
  if (fields) {
    await query(`UPDATE declarations SET ${fields} WHERE id = ?`, [...values, id]);
  }
  res.json({ success: true });
});

app.delete("/api/declarations/:id", async (req, res) => {
  const declarationId = parseInt(req.params.id);
  if (isNaN(declarationId)) return res.status(400).json({ error: "ID inválido" });

  try {
    const { rows: attachments } = await query("SELECT filename FROM attachments WHERE declaration_id = ?", [declarationId]);
    await query("DELETE FROM calls WHERE declaration_id = ?", [declarationId]);
    await query("DELETE FROM attachments WHERE declaration_id = ?", [declarationId]);
    const result = await query("DELETE FROM declarations WHERE id = ?", [declarationId]);

    if (result.changes > 0) {
      for (const att of attachments) {
        const filePath = path.join(uploadDir, att.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
    res.json({ success: true, changes: result.changes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Calls
app.get("/api/declarations/:id/calls", async (req, res) => {
  const { rows } = await query(`
    SELECT c.*, p.name as professional_name
    FROM calls c
    JOIN professionals p ON c.professional_id = p.id
    WHERE c.declaration_id = ?
    ORDER BY c.call_date DESC
  `, [req.params.id]);
  res.json(rows);
});

app.post("/api/calls", async (req, res) => {
  const { declaration_id, professional_id, call_date, summary, status_after_call } = req.body;
  const result = await query(`
    INSERT INTO calls (declaration_id, professional_id, call_date, summary, status_after_call)
    VALUES (?, ?, ?, ?, ?)
  `, [declaration_id, professional_id, call_date, summary, status_after_call]);
  res.json({ id: result.lastInsertRowid });
});

// Attachments
app.post("/api/declarations/:id/attachments", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");
  
  const result = await query(`
    INSERT INTO attachments (declaration_id, filename, original_name, mime_type, file_size)
    VALUES (?, ?, ?, ?, ?)
  `, [req.params.id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size]);
  
  res.json({ id: result.lastInsertRowid });
});

app.get("/api/declarations/:id/attachments", async (req, res) => {
  const { rows } = await query("SELECT * FROM attachments WHERE declaration_id = ?", [req.params.id]);
  res.json(rows);
});

app.get("/api/attachments/:id/download", async (req, res) => {
  const { rows } = await query("SELECT * FROM attachments WHERE id = ?", [req.params.id]);
  const attachment = rows[0];
  if (!attachment) return res.status(404).send("File not found");
  res.download(path.join(uploadDir, attachment.filename), attachment.original_name);
});

app.delete("/api/attachments/:id", async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM attachments WHERE id = ?", [req.params.id]);
    const attachment = rows[0];
    if (attachment) {
      const filePath = path.join(uploadDir, attachment.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await query("DELETE FROM attachments WHERE id = ?", [req.params.id]);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/calls/:id", async (req, res) => {
  try {
    await query("DELETE FROM calls WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk Import
app.post("/api/import/clients", async (req, res) => {
  const { data } = req.body;
  try {
    for (const row of data) {
      await query(`
        INSERT INTO clients (code, name, cpf, type, company, phone, email, observations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (cpf) DO NOTHING
      `, [row.code || '', row.name, row.cpf, row.type || 'PF', row.company || '', row.phone || '', row.email || '', row.observations || '']);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Stats
app.get("/api/dashboard/stats", async (req, res) => {
  const total = await query("SELECT COUNT(*) as count FROM declarations");
  const in_progress = await query("SELECT COUNT(*) as count FROM declarations WHERE status NOT IN ('Transmitido', 'Concluído')");
  const completed = await query("SELECT COUNT(*) as count FROM declarations WHERE status = 'Concluído'");
  const transmitted = await query("SELECT COUNT(*) as count FROM declarations WHERE status = 'Transmitido'");
  const tax_to_pay = await query("SELECT COUNT(*) as count FROM declarations WHERE has_tax_to_pay = 1");

  res.json({
    total: parseInt(total.rows[0].count),
    inProgress: parseInt(in_progress.rows[0].count),
    completed: parseInt(completed.rows[0].count),
    transmitted: parseInt(transmitted.rows[0].count),
    taxToPay: parseInt(tax_to_pay.rows[0].count)
  });
});

// API 404 Handler
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `Rota API não encontrada: ${req.originalUrl}` });
});

// Global Error Handler for API
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Internal Server Error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: "Erro interno do servidor" });
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
