import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import supabase from "./db.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production";

const app = express();
app.set('trust proxy', 1);
app.use(express.json());

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: "Muitas requisições, tente novamente mais tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

const auth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.query.token as string;
  
  if (!token) return res.status(401).json({ error: "Não autorizado" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { data: user, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', decoded.id)
      .single();
    
    if (error || !user) return res.status(401).json({ error: "Usuário não encontrado" });
    
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

const adminOnly = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if ((req as any).user.role !== 'Administrador') {
    return res.status(403).json({ error: "Acesso negado: Somente administradores" });
  }
  next();
};

// Auth
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const { data: user, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error("Supabase login error:", error);
  }
  
  if (user && bcrypt.compareSync(password, user.password)) {
    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ user: userWithoutPassword, token });
  } else {
    res.status(401).json({ error: "E-mail ou senha incorretos" });
  }
});

app.use("/api", auth);

app.post("/api/auth/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = (req as any).user;
  
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ error: "Senha atual incorreta" });
  }
  
  const hashedNewPassword = bcrypt.hashSync(newPassword, 12);
  await supabase.from('professionals').update({ password: hashedNewPassword }).eq('id', user.id);
  res.json({ success: true });
});

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Professionals
app.get("/api/professionals", async (req, res) => {
  const { data, error } = await supabase.from('professionals').select('id, name, email, role');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/professionals", adminOnly, async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password || '123456', 12);
    const { data, error } = await supabase
      .from('professionals')
      .insert([{ name, email, password: hashedPassword, role: role || 'Contador' }])
      .select();
    if (error) throw error;
    res.json({ id: data[0].id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/professionals/:id", adminOnly, async (req, res) => {
  try {
    const profId = parseInt(req.params.id);
    await supabase.from('declarations').update({ professional_id: null }).eq('professional_id', profId);
    const { error } = await supabase.from('professionals').delete().eq('id', profId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clients
app.get("/api/clients", async (req, res) => {
  const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/clients", async (req, res) => {
  const { code, name, cpf, type, company, phone, email, observations, needs_declaration } = req.body;
  const needsDecl = needs_declaration !== undefined ? (needs_declaration ? 1 : 0) : 1;
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([{ 
        code, name, cpf, type, company, phone, email, observations, 
        needs_declaration: needsDecl 
      }])
      .select();
    if (error) throw error;
    
    const clientId = data[0].id;
    
    if (needsDecl === 1) {
      const today = new Date().toISOString().split('T')[0];
      const { error: declError } = await supabase.from('declarations').insert([{
        client_id: clientId,
        professional_id: null,
        received_date: today,
        status: 'Recebido',
        has_tax_to_pay: 0,
        tax_amount: 0
      }]);
      if (declError) {
        console.error("Error creating declaration:", declError);
        throw declError;
      }
    }

    res.json({ id: clientId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/clients/:id", async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.needs_declaration !== undefined) {
    updates.needs_declaration = updates.needs_declaration ? 1 : 0;
  }
  try {
    const { error } = await supabase.from('clients').update(updates).eq('id', parseInt(id));
    if (error) throw error;

    if (updates.needs_declaration === 1) {
      const { data: existingDecls } = await supabase.from('declarations').select('id').eq('client_id', parseInt(id));
      if (!existingDecls || existingDecls.length === 0) {
        const today = new Date().toISOString().split('T')[0];
        const { error: declError } = await supabase.from('declarations').insert([{
          client_id: parseInt(id),
          professional_id: null,
          received_date: today,
          status: 'Recebido',
          has_tax_to_pay: 0,
          tax_amount: 0
        }]);
        if (declError) {
          console.error("Error creating declaration:", declError);
          throw declError;
        }
      }
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
    const { data: declarations } = await supabase.from('declarations').select('id').eq('client_id', clientId);
    const declIds = declarations?.map(d => d.id) || [];
    
    if (declIds.length > 0) {
      const { data: attachments } = await supabase.from('attachments').select('filename').in('declaration_id', declIds);
      await supabase.from('calls').delete().in('declaration_id', declIds);
      await supabase.from('attachments').delete().in('declaration_id', declIds);
      
      if (attachments) {
        for (const att of attachments) {
          const filePath = path.join(uploadDir, att.filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }
      
      await supabase.from('declarations').delete().in('id', declIds);
    }
    
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Declarations
app.get("/api/declarations", async (req, res) => {
  const { data, error } = await supabase
    .from('declarations')
    .select(`
      *,
      clients (name, cpf, type, company, code),
      professionals (name)
    `)
    .order('id', { ascending: false });
    
  if (error) return res.status(500).json({ error: error.message });
  
  const formattedData = data.map((d: any) => ({
    ...d,
    client_name: d.clients?.name,
    client_cpf: d.clients?.cpf,
    client_type: d.clients?.type,
    client_company: d.clients?.company,
    client_code: d.clients?.code,
    professional_name: d.professionals?.name
  }));
  
  res.json(formattedData);
});

app.post("/api/declarations", async (req, res) => {
  const { client_id, professional_id, received_date, status, has_tax_to_pay, tax_amount } = req.body;
  const profId = professional_id === "" || professional_id == null ? null : parseInt(professional_id);
  try {
    const { data, error } = await supabase
      .from('declarations')
      .insert([{ 
        client_id: parseInt(client_id), professional_id: profId, received_date: received_date || null, 
        status: status || 'Recebido', 
        has_tax_to_pay: has_tax_to_pay ? 1 : 0, 
        tax_amount: tax_amount || 0 
      }])
      .select();
    if (error) throw error;
    res.json({ id: data[0].id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/declarations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updates = { ...req.body };
    if (updates.professional_id !== undefined && updates.professional_id !== null) {
      updates.professional_id = parseInt(updates.professional_id);
    }
    const { error } = await supabase.from('declarations').update(updates).eq('id', parseInt(id));
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/declarations/:id", async (req, res) => {
  const declarationId = parseInt(req.params.id);
  if (isNaN(declarationId)) return res.status(400).json({ error: "ID inválido" });

  try {
    const { data: attachments } = await supabase.from('attachments').select('filename').eq('declaration_id', declarationId);
    await supabase.from('calls').delete().eq('declaration_id', declarationId);
    await supabase.from('attachments').delete().eq('declaration_id', declarationId);
    const { error } = await supabase.from('declarations').delete().eq('id', declarationId);
    if (error) throw error;

    if (attachments) {
      for (const att of attachments) {
        const filePath = path.join(uploadDir, att.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Calls
app.get("/api/declarations/:id/calls", async (req, res) => {
  const { data, error } = await supabase
    .from('calls')
    .select(`*, professionals(name)`)
    .eq('declaration_id', parseInt(req.params.id))
    .order('call_date', { ascending: false });
    
  if (error) return res.status(500).json({ error: error.message });
  
  const formattedData = data.map((c: any) => ({
    ...c,
    professional_name: c.professionals?.name
  }));
  
  res.json(formattedData);
});

app.post("/api/calls", async (req, res) => {
  try {
    const { data, error } = await supabase.from('calls').insert([req.body]).select();
    if (error) throw error;
    res.json({ id: data[0].id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/calls/:id", async (req, res) => {
  try {
    const { error } = await supabase.from('calls').delete().eq('id', parseInt(req.params.id));
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Attachments
app.post("/api/declarations/:id/attachments", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");
  try {
    const { data, error } = await supabase
      .from('attachments')
      .insert([{
        declaration_id: parseInt(req.params.id),
        filename: req.file.filename,
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        file_size: req.file.size
      }])
      .select();
    if (error) throw error;
    res.json({ id: data[0].id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/declarations/:id/attachments", async (req, res) => {
  const { data, error } = await supabase.from('attachments').select('*').eq('declaration_id', parseInt(req.params.id));
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/attachments/:id/download", async (req, res) => {
  const { data, error } = await supabase.from('attachments').select('*').eq('id', parseInt(req.params.id)).single();
  if (error || !data) return res.status(404).send("File not found");
  res.download(path.join(uploadDir, data.filename), data.original_name);
});

app.delete("/api/attachments/:id", async (req, res) => {
  try {
    const { data: attachment } = await supabase.from('attachments').select('*').eq('id', parseInt(req.params.id)).single();
    if (attachment) {
      const filePath = path.join(uploadDir, attachment.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await supabase.from('attachments').delete().eq('id', parseInt(req.params.id));
    }
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
      const { data: existing } = await supabase.from('clients').select('id').eq('cpf', row.cpf).single();
      
      if (existing) {
        const updates: any = {
          name: row.name,
          type: row.type || 'PF',
        };
        if (row.code) updates.code = row.code;
        if (row.company) updates.company = row.company;
        
        await supabase.from('clients').update(updates).eq('id', existing.id);
      } else {
        await supabase.from('clients').insert([{
          code: row.code || '',
          name: row.name,
          cpf: row.cpf,
          type: row.type || 'PF',
          company: row.company || '',
          phone: row.phone || '',
          email: row.email || '',
          observations: row.observations || '',
          needs_declaration: 0
        }]);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Stats
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const { count: total } = await supabase.from('declarations').select('*', { count: 'exact', head: true });
    const { count: completed } = await supabase.from('declarations').select('*', { count: 'exact', head: true }).eq('status', 'Concluído');
    const { count: transmitted } = await supabase.from('declarations').select('*', { count: 'exact', head: true }).eq('status', 'Transmitido');
    const { count: taxToPay } = await supabase.from('declarations').select('*', { count: 'exact', head: true }).eq('has_tax_to_pay', 1);
    
    // In progress is total - completed - transmitted
    const inProgress = (total || 0) - (completed || 0) - (transmitted || 0);

    res.json({
      total: total || 0,
      inProgress: inProgress > 0 ? inProgress : 0,
      completed: completed || 0,
      transmitted: transmitted || 0,
      taxToPay: taxToPay || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `Rota API não encontrada: ${req.originalUrl}` });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Internal Server Error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: "Erro interno do servidor" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    
    // Prevent fallback to index.html for missing assets
    app.use("/assets/*", (req, res) => {
      res.status(404).send("Not Found");
    });
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = parseInt(process.env.PORT as string) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
