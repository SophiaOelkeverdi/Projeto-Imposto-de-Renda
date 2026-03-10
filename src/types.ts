export type UserRole = 'Administrador' | 'Contador';

export interface Professional {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type ClientType = 'PF' | 'SOCIO';

export interface Client {
  id: string;
  code: string;
  name: string;
  cpf: string;
  type: 'PF' | 'SOCIO';
  company: string;
  phone: string;
  email: string;
  observations: string;
  needs_declaration: boolean;
}

export type DeclarationStatus = 'Recebido' | 'Em processamento' | 'Aguardando cliente' | 'Aguardando pagamento' | 'Concluído' | 'Transmitido';

export interface Declaration {
  id: string;
  client_id: string;
  client_name: string;
  client_cpf: string;
  client_type: 'PF' | 'SOCIO';
  client_company: string;
  client_code: string;
  professional_id: string | null;
  professional_name: string | null;
  received_date: string;
  completion_date?: string;
  transmission_date?: string;
  status: DeclarationStatus;
  has_tax_to_pay: boolean;
  tax_amount: number;
}

export interface Call {
  id: string;
  declaration_id: string;
  professional_id: string;
  professional_name: string;
  call_date: string;
  summary: string;
  status_after_call: string;
}

export interface Attachment {
  id: string;
  declaration_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  upload_date: string;
  url: string;
}
