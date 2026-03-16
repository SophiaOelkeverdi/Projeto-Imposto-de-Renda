-- Run this script in the Supabase SQL Editor to create the necessary tables

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
  observations TEXT,
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
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (declaration_id) REFERENCES declarations(id)
);

-- Insert default admin user (password is 'admin123' hashed with bcrypt)
INSERT INTO professionals (name, email, password, role) 
VALUES ('Administrador', 'admin@exemplo.com', '$2b$12$djQjt.2LgncLNetPVvFag.SkZ73pW.EY6ABo.HBU/PTYFabFvL7Gu', 'Administrador')
ON CONFLICT (email) DO NOTHING;
