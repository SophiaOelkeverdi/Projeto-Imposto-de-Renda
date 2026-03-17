import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  PhoneCall, 
  Upload, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download,
  ChevronRight,
  MoreVertical,
  Calendar,
  User,
  Building2,
  FileUp,
  X,
  BarChart3,
  PieChart,
  Trash2,
  Mail,
  Edit,
  CheckSquare,
  Square,
  XSquare,
  HelpCircle,
  UserX,
  Lock,
  LogOut,
  Key,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';

// Types
type ClientType = 'PF' | 'SOCIO';
type DeclarationStatus = 'Aguardando Documentos' | 'Contato Realizado' | 'Recebido' | 'Em processamento' | 'Aguardando cliente' | 'Aguardando pagamento' | 'Concluído' | 'Transmitido';

interface Client {
  id: number;
  code?: string;
  name: string;
  cpf: string;
  type: ClientType;
  company?: string;
  phone?: string;
  email?: string;
  observations?: string;
  needs_declaration: number | null;
}

interface Professional {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface Declaration {
  id: number;
  client_id: number;
  client_name: string;
  client_cpf: string;
  client_type: ClientType;
  client_company?: string;
  client_code?: string;
  professional_id?: number;
  professional_name?: string;
  received_date?: string;
  completion_date?: string;
  transmission_date?: string;
  status: DeclarationStatus;
  has_tax_to_pay: number;
  tax_amount: number;
  observations?: string;
}

interface Call {
  id: number;
  declaration_id: number;
  professional_id: number;
  professional_name: string;
  call_date: string;
  summary: string;
  status_after_call: string;
}

interface Attachment {
  id: number;
  declaration_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  upload_date: string;
}

// Components
const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatusBadge = ({ status }: { status: DeclarationStatus }) => {
  const colors: Record<DeclarationStatus, string> = {
    'Aguardando Documentos': 'bg-slate-100 text-slate-600 border-slate-200',
    'Contato Realizado': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Recebido': 'bg-blue-100 text-blue-700 border-blue-200',
    'Em processamento': 'bg-amber-100 text-amber-700 border-amber-200',
    'Aguardando cliente': 'bg-purple-100 text-purple-700 border-purple-200',
    'Aguardando pagamento': 'bg-rose-100 text-rose-700 border-rose-200',
    'Concluído': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Transmitido': 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status]}`}>
      {status}
    </span>
  );
};

const Login = ({ onLogin }: { onLogin: (user: Professional, token: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const contentType = res.headers.get("content-type");
      if (res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          onLogin(data.user, data.token);
        } else {
          setError('Resposta do servidor inválida (esperado JSON)');
        }
      } else {
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          setError(err.error || 'Erro ao fazer login');
        } else {
          setError(`Erro no servidor: ${res.status} ${res.statusText}`);
        }
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 bg-indigo-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Sistema Seguro</h1>
          <p className="text-indigo-100 text-sm mt-1">Gestão de Declarações IRPF</p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Lock size={10} /> <span>Dados Criptografados</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2 border border-rose-100">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black tracking-wide hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            <span>{loading ? 'ENTRANDO...' : 'ENTRAR NO SISTEMA'}</span>
          </button>
          
          <p className="text-center text-xs text-slate-400 font-medium">
            Esqueceu sua senha? Entre em contato com o administrador.
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'declarations' | 'professionals' | 'reports'>('dashboard');
  const [clientSubTab, setClientSubTab] = useState<'to_declare' | 'not_to_declare' | 'pending'>('pending');
  const [declarationSubTab, setDeclarationSubTab] = useState<'all' | 'with_tax' | 'without_tax'>('all');
  const [stats, setStats] = useState({ total: 0, inProgress: 0, completed: 0, transmitted: 0, taxToPay: 0 });
  const [clients, setClients] = useState<Client[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Modals
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientType, setNewClientType] = useState<ClientType>('PF');
  const [showNewDeclaration, setShowNewDeclaration] = useState(false);
  const [showNewProfessional, setShowNewProfessional] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<Declaration | null>(null);
  const [selectedDeclarationAttachments, setSelectedDeclarationAttachments] = useState<Attachment[]>([]);
  const [selectedDeclarationCalls, setSelectedDeclarationCalls] = useState<Call[]>([]);
  const [isReassigning, setIsReassigning] = useState(false);
  const [showNewCall, setShowNewCall] = useState(false);
  const [newCallSummary, setNewCallSummary] = useState('');

  // Confirmation Modal State
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Client Specific Filters
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientCodeFilter, setClientCodeFilter] = useState('');
  const [clientCpfFilter, setClientCpfFilter] = useState('');
  const [clientCategoryFilter, setClientCategoryFilter] = useState('');
  const [updatingClientId, setUpdatingClientId] = useState<number | null>(null);
  const [editingStatusClientId, setEditingStatusClientId] = useState<number | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingDeclaration, setEditingDeclaration] = useState<Declaration | null>(null);
  const [currentUser, setCurrentUser] = useState<Professional | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken');
  });
  const [showChangePassword, setShowChangePassword] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 12) return "A senha deve ter pelo menos 12 caracteres.";
    if (!/[A-Z]/.test(password)) return "A senha deve conter pelo menos uma letra maiúscula.";
    if (!/[a-z]/.test(password)) return "A senha deve conter pelo menos uma letra minúscula.";
    if (!/[0-9]/.test(password)) return "A senha deve conter pelo menos um número.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "A senha deve conter pelo menos um caractere especial.";
    return null;
  };

  const parseErrorResponse = async (res: Response, defaultMsg: string) => {
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const err = await res.json();
        return err.error || defaultMsg;
      }
      return `${defaultMsg} (${res.status})`;
    } catch (e) {
      return `${defaultMsg} (${res.status})`;
    }
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${authToken || ''}`
    };
    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        setCurrentUser(null);
        setAuthToken(null);
        setInitialLoad(true);
      }
      return res;
    } catch (error) {
      // Network error (e.g., server down)
      throw error;
    }
  };

  useEffect(() => {
    if (currentUser && authToken) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      localStorage.setItem('authToken', authToken);
      fetchData();
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    }
  }, [currentUser, authToken]);

  useEffect(() => {
    if (selectedDeclaration) {
      fetchAttachments(selectedDeclaration.id);
      fetchCalls(selectedDeclaration.id);
      setIsReassigning(false);
      setShowNewCall(false);
      setNewCallSummary('');
    }
  }, [selectedDeclaration]);

  const professionalStats = useMemo(() => {
    if (!Array.isArray(professionals)) return [];
    return professionals.map(prof => {
      const profDeclarations = Array.isArray(declarations) ? declarations.filter(d => d.professional_id === prof.id) : [];
      const total = profDeclarations.length;
      const completed = profDeclarations.filter(d => d.status === 'Concluído' || d.status === 'Transmitido').length;
      const remaining = total - completed;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        name: prof.name,
        total,
        completed,
        remaining,
        percentage
      };
    });
  }, [professionals, declarations]);

  const fetchAttachments = async (declarationId: number) => {
    try {
      const res = await authFetch(`/api/declarations/${declarationId}/attachments`);
      if (res.ok) {
        setSelectedDeclarationAttachments(await res.json());
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const fetchCalls = async (declarationId: number) => {
    try {
      const res = await authFetch(`/api/declarations/${declarationId}/calls`);
      if (res.ok) {
        setSelectedDeclarationCalls(await res.json());
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
    }
  };

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setDataError(null);
    try {
      const [statsRes, clientsRes, declsRes, profsRes] = await Promise.all([
        authFetch('/api/dashboard/stats'),
        authFetch('/api/clients'),
        authFetch('/api/declarations'),
        authFetch('/api/professionals')
      ]);
      
      if (statsRes.status === 401 || clientsRes.status === 401 || declsRes.status === 401 || profsRes.status === 401) {
        setCurrentUser(null);
        setAuthToken(null);
        setInitialLoad(true);
        return;
      }

      const parseRes = async (res: Response) => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        
        // Handle non-JSON responses gracefully (e.g., Nginx error pages)
        if (res.status === 403) {
          throw new Error("Acesso negado (403)");
        } else if (res.status === 404) {
          throw new Error("Recurso não encontrado (404)");
        } else if (res.status >= 500) {
          throw new Error(`Erro no servidor (${res.status})`);
        }
        
        const text = await res.text();
        console.error(`Resposta não é JSON: ${res.status} ${res.statusText}`, text);
        throw new Error(`Erro inesperado: ${res.status} ${res.statusText}`);
      };

      const [statsData, clientsData, declsData, profsData] = await Promise.all([
        parseRes(statsRes),
        parseRes(clientsRes),
        parseRes(declsRes),
        parseRes(profsRes)
      ]);

      setStats(statsData);
      setClients(clientsData);
      setDeclarations(declsData);
      setProfessionals(profsData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setDataError(error.message || 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const filteredDeclarations = useMemo(() => {
    if (!Array.isArray(declarations)) return [];
    return declarations.filter(d => {
      const matchesSearch = d.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           d.client_cpf?.includes(searchQuery) ||
                           (d.client_code && d.client_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           (d.client_company && d.client_company.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesType = typeFilter === 'all' || d.client_type === typeFilter;
      
      const matchesSubTab = declarationSubTab === 'all' ? true :
                           declarationSubTab === 'with_tax' ? d.has_tax_to_pay === 1 :
                           d.has_tax_to_pay === 0;
      
      return matchesSearch && matchesStatus && matchesType && matchesSubTab;
    });
  }, [declarations, searchQuery, statusFilter, typeFilter, declarationSubTab]);

  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    return clients.filter(c => {
      const matchesSearch = !clientSearchQuery || c.name?.toLowerCase().includes(clientSearchQuery.toLowerCase());
      const matchesCode = !clientCodeFilter || (c.code && c.code.toLowerCase().includes(clientCodeFilter.toLowerCase()));
      const matchesCpf = !clientCpfFilter || c.cpf?.includes(clientCpfFilter);
      const matchesCategory = !clientCategoryFilter || (c.company && c.company.toLowerCase().includes(clientCategoryFilter.toLowerCase()));
      
      const status = c.needs_declaration;
      const matchesSubTab = clientSubTab === 'to_declare' ? status === 1 : 
                           clientSubTab === 'not_to_declare' ? status === 0 :
                           status === null || status === undefined;
      
      return matchesSearch && matchesCode && matchesCpf && matchesCategory && matchesSubTab;
    });
  }, [clients, clientSearchQuery, clientCodeFilter, clientCpfFilter, clientCategoryFilter, clientSubTab]);

  const handleStatusUpdate = async (id: number, newStatus: DeclarationStatus) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'Concluído') updates.completion_date = new Date().toISOString().split('T')[0];
    if (newStatus === 'Transmitido') updates.transmission_date = new Date().toISOString().split('T')[0];

    await authFetch(`/api/declarations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (selectedDeclaration && selectedDeclaration.id === id) {
      setSelectedDeclaration({ ...selectedDeclaration, ...updates });
    }
    fetchData();
  };

  const handleDeleteProfessional = async (id: number) => {
    setConfirmConfig({
      title: 'Excluir Profissional',
      message: 'Tem certeza que deseja excluir este profissional? As declarações atribuídas a ele ficarão sem responsável.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/professionals/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            fetchData();
          } else {
            const errMsg = await parseErrorResponse(res, 'Erro desconhecido');
            alert(`Erro ao excluir: ${errMsg}`);
          }
        } catch (error) {
          console.error('Error deleting professional:', error);
          alert('Erro de conexão ao excluir profissional.');
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteDeclaration = async (id: number) => {
    setConfirmConfig({
      title: 'Excluir Declaração',
      message: 'Tem certeza que deseja excluir esta declaração? Todos os anexos e registros de chamadas vinculados também serão excluídos.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/declarations/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            fetchData();
          } else {
            const errMsg = await parseErrorResponse(res, 'Erro desconhecido');
            alert(`Erro ao excluir: ${errMsg}`);
          }
        } catch (error) {
          console.error('Error deleting declaration:', error);
          alert('Erro de conexão ao excluir declaração.');
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteClient = async (id: number) => {
    if (!id || isNaN(id)) {
      console.error('Invalid client ID for deletion:', id);
      return;
    }

    console.log('Attempting to delete client:', id);
    setConfirmConfig({
      title: 'Excluir Cliente',
      message: 'Tem certeza que deseja excluir este cliente? Todas as declarações vinculadas também serão excluídas.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/clients/${id}`, {
            method: 'DELETE'
          });
          
          if (res.ok) {
            console.log('Client deleted successfully:', id);
            fetchData();
          } else {
            let errorMsg = 'Erro desconhecido';
            try {
              const errMsg = await parseErrorResponse(res, errorMsg);
              errorMsg = errMsg;
              console.error('Server error deleting client:', errMsg);
            } catch (e) {
              console.error('Could not parse error response:', e);
            }
            alert(`Erro ao excluir: ${errorMsg}`);
          }
        } catch (error) {
          console.error('Network error deleting client:', error);
          alert('Erro de conexão ao excluir cliente. Verifique se o servidor está ativo.');
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteAllClients = async () => {
    setConfirmConfig({
      title: 'Excluir Todos os Clientes',
      message: 'ALERTA: Tem certeza que deseja excluir TODOS os clientes? Esta ação é irreversível e excluirá também todas as declarações, chamadas e arquivos anexos vinculados a eles.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/clients`, {
            method: 'DELETE'
          });
          
          if (res.ok) {
            console.log('All clients deleted successfully');
            fetchData();
          } else {
            let errorMsg = 'Erro desconhecido';
            try {
              const errMsg = await parseErrorResponse(res, errorMsg);
              errorMsg = errMsg;
              console.error('Server error deleting all clients:', errMsg);
            } catch (e) {
              console.error('Could not parse error response:', e);
            }
            alert(`Erro ao excluir todos: ${errorMsg}`);
          }
        } catch (error) {
          console.error('Network error deleting all clients:', error);
          alert('Erro de conexão ao excluir todos os clientes. Verifique se o servidor está ativo.');
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleUpdateDeclaration = async (id: number, updates: Partial<Declaration>) => {
    try {
      const res = await authFetch(`/api/declarations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchData();
        setEditingDeclaration(null);
      }
    } catch (error) {
      console.error('Error updating declaration:', error);
    }
  };
  const handleUpdateClient = async (id: number, updates: Partial<Client>) => {
    try {
      const res = await authFetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchData();
        setEditingClient(null);
      } else {
        const errMsg = await parseErrorResponse(res, 'Erro desconhecido');
        alert(`Erro ao atualizar cliente: ${errMsg}`);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Erro de conexão ao atualizar cliente.');
    }
  };

  const handleUpdateClientStatus = async (clientId: number, newStatus: number | null) => {
    if (updatingClientId === clientId) return;
    setUpdatingClientId(clientId);
    
    // Optimistic update
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, needs_declaration: newStatus } : c));
    setEditingStatusClientId(null);
    
    try {
      const res = await authFetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needs_declaration: newStatus })
      });
      if (res.ok) {
        fetchData(); // Refresh to get the new declaration if created
      } else {
        fetchData(); // Rollback on failure
        const errMsg = await parseErrorResponse(res, 'Erro ao atualizar status');
        alert(errMsg);
      }
    } catch (error) {
      console.error('Error updating client status:', error);
      alert('Erro de conexão ao atualizar status.');
      fetchData(); // Rollback
    } finally {
      setUpdatingClientId(null);
    }
  };

  const handleExportProductivity = () => {
    const data = professionalStats.map(prof => ({
      'Profissional': prof.name,
      'Total Atribuído': prof.total,
      'Concluídas': prof.completed,
      'Faltam': prof.remaining,
      'Progresso (%)': `${prof.percentage}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtividade");
    
    const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(workbook, `Relatorio_Produtividade_${date}.xlsx`);
  };

  const handleDeleteAttachment = async (id: number) => {
    setConfirmConfig({
      title: 'Excluir Anexo',
      message: 'Tem certeza que deseja excluir este anexo permanentemente?',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/attachments/${id}`, {
            method: 'DELETE'
          });
          if (res.ok && selectedDeclaration) {
            fetchAttachments(selectedDeclaration.id);
          }
        } catch (error) {
          console.error('Error deleting attachment:', error);
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteCall = async (id: number) => {
    setConfirmConfig({
      title: 'Excluir Registro',
      message: 'Tem certeza que deseja excluir este registro de ligação?',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/calls/${id}`, {
            method: 'DELETE'
          });
          if (res.ok && selectedDeclaration) {
            fetchCalls(selectedDeclaration.id);
          }
        } catch (error) {
          console.error('Error deleting call:', error);
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleAddCall = async () => {
    if (!selectedDeclaration || !newCallSummary.trim()) return;
    
    try {
      const res = await authFetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          declaration_id: selectedDeclaration.id,
          professional_id: currentUser.id, // Use current user ID
          call_date: new Date().toLocaleString('pt-BR'),
          summary: newCallSummary,
          status_after_call: selectedDeclaration.status
        })
      });
      
      if (res.ok) {
        fetchCalls(selectedDeclaration.id);
        setShowNewCall(false);
        setNewCallSummary('');
      }
    } catch (error) {
      console.error('Error adding call:', error);
    }
  };

  const handleReassign = async (declarationId: number, professionalId: number) => {
    await authFetch(`/api/declarations/${declarationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professional_id: professionalId })
    });
    
    const prof = professionals.find(p => p.id === professionalId);
    if (selectedDeclaration && selectedDeclaration.id === declarationId) {
      setSelectedDeclaration({ 
        ...selectedDeclaration, 
        professional_id: professionalId,
        professional_name: prof?.name 
      });
    }
    setIsReassigning(false);
    fetchData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDeclaration || !e.target.files?.[0]) return;
    
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await authFetch(`/api/declarations/${selectedDeclaration.id}/attachments`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        fetchAttachments(selectedDeclaration.id);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Use header: 1 to get an array of arrays, ensuring we don't miss the first row
      // if it contains data instead of headers.
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      // Skip the first row (headers)
      const dataRows = jsonData.slice(1);

      const mappedData = dataRows.filter(row => row && row.length > 0).map((row, index) => {
        // Fixed column order as requested:
        // 1. Code (Column A)
        // 2. Company/Category (Column B)
        // 3. Name (Column C)
        // 4. CPF/CNPJ (Column D)
        
        const clientCode = row[0]?.toString().trim() || '';
        const company = row[1]?.toString().trim() || '';
        const name = row[2]?.toString().trim() || '';
        const cpf = row[3]?.toString().trim() || '';
        
        // Determine Type
        const digits = cpf.replace(/\D/g, '');
        const isCNPJ = digits.length === 14;
        const isPFLabel = company.toLowerCase().includes('pf') || 
                          company.toLowerCase().includes('pessoa fisica') || 
                          company.toLowerCase().includes('pessoa física');
        
        const type = (isCNPJ || (company && !isPFLabel)) ? 'SOCIO' : 'PF';

        return {
          code: clientCode,
          name: name || `Cliente ${clientCode || index + 1}`,
          cpf: cpf,
          type: type,
          company: company,
          phone: '', // Reset phone/email as they are not in the specified columns
          email: '',
          observations: `Importado via Excel.`
        };
      }).filter(item => item.name || item.code);

      try {
        const res = await authFetch('/api/import/clients', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ data: mappedData })
        });
        if (res.ok) {
          const result = await res.json();
          alert(`${result.inserted} clientes novos inseridos e ${result.updated} atualizados com sucesso!`);
          fetchData();
        } else {
          const errMsg = await parseErrorResponse(res, 'Erro desconhecido');
          alert(`Erro na importação: ${errMsg}`);
        }
      } catch (error) {
        console.error('Error importing clients:', error);
        alert('Erro de conexão ao importar clientes.');
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleCSVImport = handleFileImport; // Keep for compatibility if needed elsewhere

  if (!currentUser || !authToken) {
    return <Login onLogin={(user, token) => {
      setCurrentUser(user);
      setAuthToken(token);
    }} />;
  }

  if (dataError) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-6 p-4 text-center font-sans">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-2">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Erro de Conexão</h2>
        <p className="text-slate-600 max-w-md">{dataError}</p>
        <p className="text-sm text-slate-500 max-w-md">
          O servidor pode estar reiniciando ou indisponível no momento. Por favor, tente novamente em alguns instantes.
        </p>
        <button 
          onClick={() => {
            setInitialLoad(true);
            fetchData();
          }} 
          className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (initialLoad) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && confirmConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  confirmConfig.type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmConfig.title}</h3>
                <p className="text-slate-600 leading-relaxed">{confirmConfig.message}</p>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3 justify-end">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmConfig.onConfirm}
                  className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-lg ${
                    confirmConfig.type === 'danger' 
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' 
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                  }`}
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <FileText size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">IR Master</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Users} 
            label="Clientes" 
            active={activeTab === 'clients'} 
            onClick={() => setActiveTab('clients')} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Declarações" 
            active={activeTab === 'declarations'} 
            onClick={() => setActiveTab('declarations')} 
          />
          <SidebarItem 
            icon={User} 
            label="Profissionais" 
            active={activeTab === 'professionals'} 
            onClick={() => setActiveTab('professionals')} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Relatórios" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{currentUser.role}</p>
                <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                <span className="text-[9px] font-bold text-emerald-600 uppercase">Seguro</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 px-2">
            <button 
              onClick={() => setShowChangePassword(true)}
              className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-all"
              title="Alterar Senha"
            >
              <Key size={12} />
              SENHA
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('authToken');
                setCurrentUser(null);
                setAuthToken(null);
                setInitialLoad(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all"
              title="Sair"
            >
              <LogOut size={12} />
              SAIR
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'clients' && 'Gestão de Clientes'}
              {activeTab === 'declarations' && 'Controle de Declarações'}
              {activeTab === 'professionals' && 'Equipe'}
              {activeTab === 'reports' && 'Relatórios de Produtividade'}
            </h2>
            <p className="text-slate-500 text-sm">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex gap-3">
            {activeTab === 'clients' && currentUser.role === 'Administrador' && (
              <button 
                onClick={handleDeleteAllClients}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors shadow-sm"
              >
                <Trash2 size={18} />
                <span className="text-sm font-medium">Excluir Todos</span>
              </button>
            )}
            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
              <Upload size={18} />
              <span className="text-sm font-medium">Importar Lista</span>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileImport} />
            </label>
            <button 
              onClick={() => {
                if (activeTab === 'clients') {
                  setNewClientType('PF');
                  setShowNewClient(true);
                } else if (activeTab === 'professionals') {
                  if (currentUser.role !== 'Administrador') {
                    alert('Somente administradores podem cadastrar profissionais.');
                    return;
                  }
                  setShowNewProfessional(true);
                } else if (activeTab === 'reports') {
                  // No action for reports
                } else {
                  setShowNewDeclaration(true);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 ${activeTab === 'reports' ? 'hidden' : ''}`}
            >
              <Plus size={18} />
              <span className="text-sm font-medium">
                {activeTab === 'clients' && <span>Novo Cliente</span>}
                {activeTab === 'professionals' && <span>Novo Profissional</span>}
                {(activeTab === 'declarations' || activeTab === 'dashboard') && <span>Nova Declaração</span>}
              </span>
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { label: 'Total', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Em Aberto', value: stats.inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Concluídas', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Transmitidas', value: stats.transmitted, icon: ChevronRight, color: 'text-slate-600', bg: 'bg-slate-50' },
                { label: 'Com Imposto', value: stats.taxToPay, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((stat, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={stat.label} 
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                </motion.div>
              ))}
            </div>

            {/* Recent Activity / Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Declarações Recentes</h3>
                <div className="space-y-4">
                  {Array.isArray(declarations) && declarations.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                          {d.client_type === 'SOCIO' ? <Building2 size={20} /> : <User size={20} />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{d.client_name}</p>
                          <p className="text-xs text-slate-400">
                            <span>Recebido em: </span>
                            <span>{d.received_date || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Equipe - Performance</h3>
                <div className="space-y-6">
                  {professionals.map(p => {
                    const count = declarations.filter(d => d.professional_id === p.id).length;
                    const completed = declarations.filter(d => d.professional_id === p.id && d.status === 'Concluído').length;
                    const progress = count > 0 ? (completed / count) * 100 : 0;
                    
                    return (
                      <div key={p.id}>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold text-slate-700">{p.name}</p>
                          <p className="text-xs text-slate-400">
                            <span>{completed}</span>
                            <span>/</span>
                            <span>{count}</span>
                            <span> concluídas</span>
                          </p>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'declarations' && (
          <div className="space-y-6">
            {/* Sub-tabs for Declarations */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
              <button 
                onClick={() => setDeclarationSubTab('all')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  declarationSubTab === 'all' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Todas
              </button>
              <button 
                onClick={() => setDeclarationSubTab('with_tax')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  declarationSubTab === 'with_tax' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Com Imposto
              </button>
              <button 
                onClick={() => setDeclarationSubTab('without_tax')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  declarationSubTab === 'without_tax' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sem Imposto
              </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por cliente ou CPF..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <select 
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                <option value="Aguardando Documentos">Aguardando Documentos</option>
                <option value="Contato Realizado">Contato Realizado</option>
                <option value="Recebido">Recebido</option>
                <option value="Em processamento">Em processamento</option>
                <option value="Aguardando cliente">Aguardando cliente</option>
                <option value="Aguardando pagamento">Aguardando pagamento</option>
                <option value="Concluído">Concluído</option>
                <option value="Transmitido">Transmitido</option>
              </select>

              <select 
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Todos os Tipos</option>
                <option value="PF">Pessoa Física</option>
                <option value="SOCIO">Sócio de Empresa</option>
              </select>

              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                <Filter size={20} />
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-bottom border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cód.</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Responsável</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Recebimento</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Imposto</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Observações</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeclarations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-400">
                          <span>#</span>
                          <span>{d.client_code || '---'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                            {d.client_type === 'SOCIO' ? <Building2 size={16} /> : <User size={16} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800">{d.client_name}</p>
                              {d.client_code && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                  <span>#</span>
                                  <span>{d.client_code}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{d.client_cpf}</p>
                            {d.client_company && (
                              <p className="text-[10px] text-indigo-500 font-medium mt-0.5 uppercase">{d.client_company}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={d.status}
                          onChange={(e) => handleStatusUpdate(d.id, e.target.value as DeclarationStatus)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border-none outline-none cursor-pointer transition-all ${
                            d.status === 'Transmitido' ? 'bg-emerald-100 text-emerald-700' :
                            d.status === 'Concluído' ? 'bg-blue-100 text-blue-700' :
                            d.status === 'Aguardando pagamento' ? 'bg-amber-100 text-amber-700' :
                            d.status === 'Aguardando cliente' ? 'bg-rose-100 text-rose-700' :
                            d.status === 'Em processamento' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <option value="Aguardando Documentos">Aguardando Documentos</option>
                          <option value="Contato Realizado">Contato Realizado</option>
                          <option value="Recebido">Recebido</option>
                          <option value="Em processamento">Em processamento</option>
                          <option value="Aguardando cliente">Aguardando cliente</option>
                          <option value="Aguardando pagamento">Aguardando pagamento</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Transmitido">Transmitido</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{d.professional_name || 'Não atribuído'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{d.received_date || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {d.has_tax_to_pay ? (
                          <div className="flex items-center gap-1.5 text-rose-600">
                            <AlertCircle size={14} />
                            <span className="text-sm font-medium">
                              <span>R$ </span>
                              <span>{d.tax_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          defaultValue={d.observations || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (d.observations || '')) {
                              handleUpdateDeclaration(d.id, { observations: e.target.value });
                            }
                          }}
                          placeholder="Adicionar observação..."
                          className="w-full text-sm text-slate-600 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setSelectedDeclaration(d)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Detalhes"
                          >
                            <ChevronRight size={18} />
                          </button>
                          <button 
                            onClick={() => setEditingDeclaration(d)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar Declaração"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteDeclaration(d.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir Declaração"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredDeclarations.length === 0 && (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Search size={32} />
                  </div>
                  <p className="text-slate-500 font-medium">Nenhuma declaração encontrada</p>
                  <p className="text-slate-400 text-sm">Tente ajustar seus filtros ou pesquisar por outro termo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="space-y-6">
            {/* Sub-tabs for Clients */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
              <button 
                onClick={() => setClientSubTab('to_declare')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  clientSubTab === 'to_declare' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Declaração Confirmada
              </button>
              <button 
                onClick={() => setClientSubTab('not_to_declare')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  clientSubTab === 'not_to_declare' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Declaração Dispensada
              </button>
              <button 
                onClick={() => setClientSubTab('pending')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  clientSubTab === 'pending' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Não Selecionado
              </button>
            </div>

            {/* Client Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                />
              </div>

              <div className="w-32">
                <input 
                  type="text" 
                  placeholder="Código"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={clientCodeFilter}
                  onChange={(e) => setClientCodeFilter(e.target.value)}
                />
              </div>

              <div className="w-48">
                <input 
                  type="text" 
                  placeholder="CPF/CNPJ"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={clientCpfFilter}
                  onChange={(e) => setClientCpfFilter(e.target.value)}
                />
              </div>

              <div className="w-48">
                <input 
                  type="text" 
                  placeholder="Empresa / Categoria"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={clientCategoryFilter}
                  onChange={(e) => setClientCategoryFilter(e.target.value)}
                />
              </div>
              
              {(clientSearchQuery || clientCodeFilter || clientCpfFilter || clientCategoryFilter) && (
                <button 
                  onClick={() => {
                    setClientSearchQuery('');
                    setClientCodeFilter('');
                    setClientCpfFilter('');
                    setClientCategoryFilter('');
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cód.</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Declaração</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map(client => {
                      const isPF = !client.company || 
                                  client.company.toLowerCase().includes('pessoa fisica') || 
                                  client.company.toLowerCase().includes('pf') ||
                                  client.company.toLowerCase().includes('pesso fisica');

                      return (
                        <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-400">
                              <span>#</span>
                              <span>{client.code || '---'}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!isPF ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {!isPF ? <Building2 size={16} /> : <User size={16} />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{client.name}</p>
                                <p className="text-xs text-slate-400">{client.cpf}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {client.phone && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <PhoneCall size={12} className="text-slate-400" />
                                  <span>{client.phone}</span>
                                </div>
                              )}
                              {client.email && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <Mail size={12} className="text-slate-400" />
                                  <span className="truncate max-w-[150px]">{client.email}</span>
                                </div>
                              )}
                              {!client.phone && !client.email && (
                                <span className="text-xs text-slate-400 italic">Não informado</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {client.company ? (
                              <span className="text-xs font-medium text-slate-600">
                                {client.company.replace(/pesso fisica/gi, 'Pessoa física')}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-slate-400 italic">Não informada</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingStatusClientId === client.id ? (
                              <select
                                autoFocus
                                defaultValue={client.needs_declaration === null ? "null" : client.needs_declaration.toString()}
                                onBlur={() => setEditingStatusClientId(null)}
                                onChange={(e) => {
                                  const val = e.target.value === "null" ? null : parseInt(e.target.value);
                                  handleUpdateClientStatus(client.id, val);
                                }}
                                className="text-[10px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                              >
                                <option value="null">PENDENTE</option>
                                <option value="1">SIM</option>
                                <option value="0">NÃO</option>
                              </select>
                            ) : (
                              <button 
                                onClick={() => setEditingStatusClientId(client.id)}
                                disabled={updatingClientId === client.id}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  updatingClientId === client.id ? 'opacity-50 cursor-not-allowed' : ''
                                } ${
                                  client.needs_declaration === 1 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' 
                                    : client.needs_declaration === 0
                                    ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'
                                    : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                                }`}
                              >
                                {updatingClientId === client.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : client.needs_declaration === 1 ? (
                                  <CheckSquare size={14} />
                                ) : client.needs_declaration === 0 ? (
                                  <XSquare size={14} />
                                ) : (
                                  <HelpCircle size={14} />
                                )}
                                <span>
                                  {client.needs_declaration === 1 ? 'SIM' : 
                                   client.needs_declaration === 0 ? 'NÃO' : 
                                   'PENDENTE'}
                                </span>
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClient(client);
                                }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Editar Cliente"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClient(client.id);
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Excluir Cliente"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredClients.length === 0 && (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Search size={32} />
                  </div>
                  <p className="text-slate-500 font-medium">Nenhum cliente encontrado</p>
                  <p className="text-slate-400 text-sm">Tente ajustar sua pesquisa.</p>
                </div>
              )}
            </div>
        </div>
      )}

      {activeTab === 'reports' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Relatórios de Desempenho</h2>
              <button 
                onClick={handleExportProductivity}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <Download size={18} />
                Exportar Produtividade
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Productivity Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Produtividade por Profissional</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={professionalStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="completed" name="Concluídas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="remaining" name="Pendentes" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Completion Percentage */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Porcentagem de Conclusão</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={professionalStats}
                        dataKey="percentage"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {professionalStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-bottom border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Profissional</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Atribuído</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Concluídas</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Faltam</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Progresso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {professionalStats.map((prof, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-800">{prof.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{prof.total}</td>
                      <td className="px-6 py-4 text-sm text-emerald-600 font-medium">{prof.completed}</td>
                      <td className="px-6 py-4 text-sm text-rose-600 font-medium">{prof.remaining}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 transition-all duration-500" 
                              style={{ width: `${prof.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            <span>{prof.percentage}</span>
                            <span>%</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'professionals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map(prof => (
              <div key={prof.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group relative">
                <button 
                  onClick={() => handleDeleteProfessional(prof.id)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Excluir Profissional"
                >
                  <Trash2 size={18} />
                </button>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl">
                    {prof.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">{prof.name}</h4>
                    <p className="text-sm text-slate-500">{prof.email}</p>
                    {prof.role && <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1">{prof.role}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <p className="text-xs text-slate-400 font-medium uppercase mb-1">Atribuídas</p>
                    <p className="text-xl font-bold text-slate-800">
                      {declarations.filter(d => d.professional_id === prof.id).length}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-center">
                    <p className="text-xs text-emerald-600/60 font-medium uppercase mb-1">Concluídas</p>
                    <p className="text-xl font-bold text-emerald-700">
                      {declarations.filter(d => d.professional_id === prof.id && d.status === 'Concluído').length}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedDeclaration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDeclaration(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Detalhes da Declaração</h3>
                    <p className="text-sm text-slate-500">
                      {selectedDeclaration.client_code && (
                        <span className="font-black text-slate-900 mr-2">
                          <span>#</span>
                          <span>{selectedDeclaration.client_code}</span>
                        </span>
                      )}
                      <span>{selectedDeclaration.client_name}</span>
                      <span> • CPF: </span>
                      <span>{selectedDeclaration.client_cpf}</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDeclaration(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Timeline */}
                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Status do Processo</h4>
                    <div className="relative flex justify-between">
                      <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 -z-10" />
                      {[
                        { label: 'Recebido', icon: Download },
                        { label: 'Processando', icon: Clock },
                        { label: 'Concluído', icon: CheckCircle2 },
                        { label: 'Transmitido', icon: ChevronRight },
                      ].map((step, i) => {
                        const statusOrder = ['Recebido', 'Em processamento', 'Aguardando cliente', 'Aguardando pagamento', 'Concluído', 'Transmitido'];
                        const currentStatusIndex = statusOrder.indexOf(selectedDeclaration.status);
                        
                        // Map status index to timeline step index
                        const getStepIndex = (sIdx: number) => {
                          if (sIdx === 0) return 0; // Recebido
                          if (sIdx >= 1 && sIdx <= 3) return 1; // Processando/Aguardando
                          if (sIdx === 4) return 2; // Concluído
                          if (sIdx === 5) return 3; // Transmitido
                          return -1;
                        };

                        const currentStepIndex = getStepIndex(currentStatusIndex);
                        const isDone = i < currentStepIndex;
                        const isActive = i === currentStepIndex;
                        const isCompleted = i <= currentStepIndex;
                        
                        return (
                          <div key={step.label} className="flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-300'
                            } ${isActive ? 'ring-4 ring-indigo-100' : ''}`}>
                              <step.icon size={18} />
                            </div>
                            <span className={`text-xs font-bold ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Info Grid */}
                  <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Status Atual</p>
                      <select 
                        value={selectedDeclaration.status}
                        onChange={(e) => handleStatusUpdate(selectedDeclaration.id, e.target.value as DeclarationStatus)}
                        className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="Aguardando Documentos">Aguardando Documentos</option>
                        <option value="Contato Realizado">Contato Realizado</option>
                        <option value="Recebido">Recebido</option>
                        <option value="Em processamento">Em processamento</option>
                        <option value="Aguardando cliente">Aguardando cliente</option>
                        <option value="Aguardando pagamento">Aguardando pagamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Transmitido">Transmitido</option>
                      </select>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Responsável</p>
                      {isReassigning ? (
                        <select 
                          autoFocus
                          onBlur={() => setIsReassigning(false)}
                          onChange={(e) => handleReassign(selectedDeclaration.id, parseInt(e.target.value))}
                          className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                        >
                          <option value="">Selecione...</option>
                          {professionals.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-slate-700 truncate">{selectedDeclaration.professional_name || 'Não atribuído'}</p>
                          <button onClick={() => setIsReassigning(true)} className="text-[10px] text-indigo-600 font-bold hover:underline ml-1">Alterar</button>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Recebimento</p>
                      <p className="text-sm font-semibold text-slate-700">{selectedDeclaration.received_date || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Conclusão</p>
                      <p className="text-sm font-semibold text-slate-700">{selectedDeclaration.completion_date || 'Em aberto'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Transmissão</p>
                      <p className="text-sm font-semibold text-slate-700">{selectedDeclaration.transmission_date || 'Pendente'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Imposto</p>
                      <p className={`text-sm font-bold ${selectedDeclaration.has_tax_to_pay ? 'text-rose-600' : 'text-emerald-600'}`}>
                        <span>
                          {selectedDeclaration.has_tax_to_pay ? (
                            <>
                              <span>R$ </span>
                              <span>{selectedDeclaration.tax_amount.toLocaleString('pt-BR')}</span>
                            </>
                          ) : (
                            <span>Não</span>
                          )}
                        </span>
                      </p>
                    </div>
                  </section>

                  {/* Attachments */}
                  <section>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Anexos e Recibos</h4>
                      <label className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer">
                        <Plus size={14} /> Adicionar
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDeclarationAttachments.map(att => (
                        <div key={att.id} className="group relative">
                          <a 
                            href={`/api/attachments/${att.id}/download?token=${currentUser?.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 border border-slate-200 rounded-xl flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${att.mime_type?.includes('pdf') ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{att.original_name}</p>
                              <p className="text-xs text-slate-400">
                                <span>{(att.file_size / 1024).toFixed(1)}</span>
                                <span> KB</span>
                              </p>
                            </div>
                            <Download size={16} className="text-slate-400" />
                          </a>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteAttachment(att.id);
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {selectedDeclarationAttachments.length === 0 && (
                        <div className="col-span-2 py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                          <p className="text-sm text-slate-400">Nenhum anexo encontrado</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <div className="space-y-8 border-l border-slate-100 pl-8">
                  {/* Call Logs */}
                  <section>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Registro de Ligações</h4>
                      <button 
                        onClick={() => setShowNewCall(true)}
                        className="text-indigo-600 text-xs font-bold hover:underline"
                      >
                        Novo
                      </button>
                    </div>
                    
                    {showNewCall && (
                      <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <textarea 
                          autoFocus
                          placeholder="Resumo da ligação..."
                          className="w-full bg-white border border-indigo-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mb-3"
                          rows={3}
                          value={newCallSummary}
                          onChange={(e) => setNewCallSummary(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setShowNewCall(false)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={handleAddCall}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-100"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {selectedDeclarationCalls.map(call => (
                        <div key={call.id} className="relative pl-6 pb-4 border-l-2 border-slate-100 group">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-500" />
                          <div className="flex justify-between items-start">
                            <p className="text-xs text-slate-400 font-bold mb-1">{call.call_date}</p>
                            <button 
                              onClick={() => handleDeleteCall(call.id)}
                              className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <p className="text-sm text-slate-700 font-medium">{call.summary}</p>
                          <p className="text-xs text-indigo-600 mt-1">Por: {call.professional_name}</p>
                        </div>
                      ))}
                      {selectedDeclarationCalls.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">Nenhum registro de ligação</p>
                      )}
                    </div>
                  </section>

                  {/* Actions */}
                  <section className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Ações Rápidas</h4>
                    <button 
                      onClick={() => handleStatusUpdate(selectedDeclaration.id, 'Transmitido')}
                      className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Marcar como Transmitido
                    </button>
                    <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
                      Reatribuir Profissional
                    </button>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Client Modal */}
      <AnimatePresence>
        {editingDeclaration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingDeclaration(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Editar Declaração</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                await handleUpdateDeclaration(editingDeclaration.id, {
                  professional_id: data.professional_id === "" ? null : data.professional_id,
                  status: data.status,
                  received_date: data.received_date || null,
                  has_tax_to_pay: data.has_tax_to_pay === 'on' ? 1 : 0,
                  tax_amount: parseFloat(data.tax_amount as string) || 0,
                  observations: data.observations || null
                } as any);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cliente</label>
                  <input disabled value={editingDeclaration.client_name} className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Responsável</label>
                  <select name="professional_id" defaultValue={editingDeclaration.professional_id || ""} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none">
                    <option value="">Não atribuído</option>
                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data de Recebimento</label>
                    <input type="date" name="received_date" defaultValue={editingDeclaration.received_date} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select name="status" defaultValue={editingDeclaration.status} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none">
                      <option value="Aguardando Documentos">Aguardando Documentos</option>
                      <option value="Contato Realizado">Contato Realizado</option>
                      <option value="Recebido">Recebido</option>
                      <option value="Em processamento">Em processamento</option>
                      <option value="Aguardando cliente">Aguardando cliente</option>
                      <option value="Aguardando pagamento">Aguardando pagamento</option>
                      <option value="Concluído">Concluído</option>
                      <option value="Transmitido">Transmitido</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" name="has_tax_to_pay" id="edit_has_tax" defaultChecked={editingDeclaration.has_tax_to_pay} className="w-4 h-4 text-indigo-600 rounded" />
                  <label htmlFor="edit_has_tax" className="text-sm font-medium text-slate-700">Imposto a Pagar?</label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor do Imposto (R$)</label>
                  <input type="number" step="0.01" name="tax_amount" defaultValue={editingDeclaration.tax_amount} placeholder="0.00" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Observações</label>
                  <textarea name="observations" defaultValue={editingDeclaration.observations} placeholder="Adicionar observação..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none" rows={3}></textarea>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setEditingDeclaration(null)} className="flex-1 py-2 text-slate-500 font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-100">Salvar Alterações</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingClient(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Editar Cliente</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                await handleUpdateClient(editingClient.id, {
                  ...data,
                  needs_declaration: data.needs_declaration === "null" ? null : parseInt(data.needs_declaration as string)
                } as any);
              }} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Código</label>
                    <input name="code" defaultValue={editingClient.code} placeholder="000" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                    <input name="name" defaultValue={editingClient.name} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">CPF</label>
                  <input name="cpf" defaultValue={editingClient.cpf} required placeholder="000.000.000-00" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                  <select 
                    name="type" 
                    defaultValue={editingClient.type}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="PF">Pessoa Física</option>
                    <option value="SOCIO">Sócio de Empresa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Empresa / Categoria</label>
                  <input name="company" defaultValue={editingClient.company} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone</label>
                    <input name="phone" defaultValue={editingClient.phone} placeholder="(00) 00000-0000" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">E-mail</label>
                    <input name="email" defaultValue={editingClient.email} type="email" placeholder="cliente@email.com" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status da Declaração</label>
                  <select 
                    name="needs_declaration" 
                    defaultValue={editingClient.needs_declaration === null ? "null" : editingClient.needs_declaration.toString()}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="null">Não Selecionado</option>
                    <option value="1">Sim</option>
                    <option value="0">Não</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setEditingClient(null)} className="flex-1 py-2 text-slate-500 font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-100">Salvar Alterações</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Client Modal */}
      <AnimatePresence>
        {showNewClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewClient(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Novo Cliente</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                await authFetch('/api/clients', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...data,
                    needs_declaration: data.needs_declaration === "null" ? null : parseInt(data.needs_declaration as string)
                  })
                });
                setShowNewClient(false);
                fetchData();
              }} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Código</label>
                    <input name="code" placeholder="000" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                    <input name="name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">CPF</label>
                  <input name="cpf" required placeholder="000.000.000-00" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                  <select 
                    name="type" 
                    value={newClientType}
                    onChange={(e) => setNewClientType(e.target.value as ClientType)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="PF">Pessoa Física</option>
                    <option value="SOCIO">Sócio de Empresa</option>
                  </select>
                </div>
                {newClientType === 'SOCIO' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Empresa</label>
                    <input name="company" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                  </motion.div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone</label>
                    <input name="phone" placeholder="(00) 00000-0000" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">E-mail</label>
                    <input name="email" type="email" placeholder="cliente@email.com" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status da Declaração</label>
                  <select 
                    name="needs_declaration" 
                    defaultValue="null"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="null">Não Selecionado</option>
                    <option value="1">Sim</option>
                    <option value="0">Não</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowNewClient(false)} className="flex-1 py-2 text-slate-500 font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-100">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Declaration Modal */}
      <AnimatePresence>
        {showNewDeclaration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewDeclaration(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Nova Declaração</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                await authFetch('/api/declarations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...data,
                    received_date: data.received_date || null,
                    has_tax_to_pay: data.has_tax_to_pay === 'on',
                    tax_amount: parseFloat(data.tax_amount as string || '0'),
                    observations: data.observations || null
                  })
                });
                setShowNewDeclaration(false);
                fetchData();
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cliente</label>
                  <select name="client_id" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                    <option value="">Selecione um cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {`${c.code ? `[${c.code}] ` : ''}${c.name} (${c.cpf})${c.company ? ` - ${c.company}` : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Responsável</label>
                  <select name="professional_id" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Não atribuído</option>
                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status Inicial</label>
                  <select name="status" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="Aguardando Documentos">Aguardando Documentos</option>
                    <option value="Contato Realizado">Contato Realizado</option>
                    <option value="Recebido">Recebido</option>
                    <option value="Em processamento">Em processamento</option>
                    <option value="Aguardando cliente">Aguardando cliente</option>
                    <option value="Aguardando pagamento">Aguardando pagamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Transmitido">Transmitido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data de Recebimento</label>
                  <input type="date" name="received_date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="has_tax_to_pay" id="has_tax" className="w-4 h-4 text-indigo-600 rounded" />
                  <label htmlFor="has_tax" className="text-sm font-medium text-slate-700">Tem imposto a pagar?</label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor do Imposto (R$)</label>
                  <input type="number" step="0.01" name="tax_amount" placeholder="0,00" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Observações</label>
                  <textarea name="observations" placeholder="Adicionar observação..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none resize-none" rows={3}></textarea>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowNewDeclaration(false)} className="flex-1 py-2 text-slate-500 font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-100">Criar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* New Professional Modal */}
      <AnimatePresence>
        {showNewProfessional && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewProfessional(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Novo Profissional</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                
                const passwordError = validatePassword(data.password as string);
                if (passwordError) {
                  alert(passwordError);
                  return;
                }

                try {
                  const res = await authFetch('/api/professionals', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                  });
                  if (!res.ok) {
                    const errMsg = await parseErrorResponse(res, 'Erro desconhecido');
                    alert(`Erro ao cadastrar: ${errMsg}`);
                    return;
                  }
                  setShowNewProfessional(false);
                  fetchData();
                } catch (error) {
                  console.error('Error creating professional:', error);
                  alert('Erro de conexão ao cadastrar profissional.');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                  <input name="name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">E-mail</label>
                  <input name="email" type="email" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Senha</label>
                  <input name="password" type="password" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Função</label>
                  <select name="role" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="Contador">Contador</option>
                    <option value="Assistente">Assistente</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowNewProfessional(false)} className="flex-1 py-2 text-slate-500 font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-100">Cadastrar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowChangePassword(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Alterar Minha Senha</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                
                const passwordError = validatePassword(data.newPassword as string);
                if (passwordError) {
                  alert(passwordError);
                  return;
                }

                if (data.newPassword !== data.confirmPassword) {
                  alert('As novas senhas não coincidem.');
                  return;
                }

                try {
                  const res = await authFetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      currentPassword: data.currentPassword,
                      newPassword: data.newPassword
                    })
                  });
                  
                  if (res.ok) {
                    alert('Senha alterada com sucesso!');
                    setShowChangePassword(false);
                  } else {
                    const errMsg = await parseErrorResponse(res, 'Erro desconhecido');
                    alert(`Erro: ${errMsg}`);
                  }
                } catch (error) {
                  alert('Erro de conexão ao alterar senha.');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Senha Atual</label>
                  <input name="currentPassword" type="password" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nova Senha</label>
                  <input name="newPassword" type="password" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Confirmar Nova Senha</label>
                  <input name="confirmPassword" type="password" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowChangePassword(false)} className="flex-1 py-2 text-slate-500 font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-100">Atualizar Senha</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
