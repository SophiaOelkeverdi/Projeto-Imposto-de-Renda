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

// Firebase Imports
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  where,
  orderBy,
  setDoc,
  getDoc,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { auth, db, storage } from './firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

import { 
  Client, 
  ClientType,
  Professional, 
  Declaration, 
  Call, 
  Attachment, 
  DeclarationStatus 
} from './types';


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

const Login = ({ onLogin }: { onLogin: (user: Professional) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'professionals', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as Professional;
        onLogin({ ...userData, id: userCredential.user.uid });
      } else {
        // If user exists in Auth but not in Firestore, create a default entry or show error
        // For now, let's assume the admin created the user in both places
        setError('Perfil profissional não encontrado no banco de dados.');
        await signOut(auth);
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos');
      } else {
        setError('Erro ao fazer login: ' + err.message);
      }
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
            <Lock size={10} /> Dados Criptografados
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2 border border-rose-100">
              <AlertCircle size={18} />
              {error}
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
            {loading ? 'ENTRANDO...' : 'ENTRAR NO SISTEMA'}
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
  const [sessionExpired, setSessionExpired] = useState(false);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, completed: 0, transmitted: 0, taxToPay: 0 });
  const [clients, setClients] = useState<Client[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  const [clientNeedsDeclarationFilter, setClientNeedsDeclarationFilter] = useState<string>('all');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [currentUser, setCurrentUser] = useState<Professional | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 12) return "A senha deve ter pelo menos 12 caracteres.";
    if (!/[A-Z]/.test(password)) return "A senha deve conter pelo menos uma letra maiúscula.";
    if (!/[a-z]/.test(password)) return "A senha deve conter pelo menos uma letra minúscula.";
    if (!/[0-9]/.test(password)) return "A senha deve conter pelo menos um número.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "A senha deve conter pelo menos um caractere especial.";
    return null;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'professionals', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ ...userDoc.data() as Professional, id: user.uid });
        } else {
          // Fallback if doc doesn't exist yet
          setCurrentUser({ id: user.uid, name: user.displayName || 'Usuário', email: user.email || '', role: 'Contador' });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client)));
    });

    const unsubDeclarations = onSnapshot(collection(db, 'declarations'), (snapshot) => {
      setDeclarations(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Declaration)));
    });

    const unsubProfessionals = onSnapshot(collection(db, 'professionals'), (snapshot) => {
      setProfessionals(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Professional)));
    });

    return () => {
      unsubClients();
      unsubDeclarations();
      unsubProfessionals();
    };
  }, [currentUser]);

  useEffect(() => {
    if (selectedDeclaration) {
      const unsubAttachments = onSnapshot(collection(db, 'declarations', selectedDeclaration.id, 'attachments'), (snapshot) => {
        setSelectedDeclarationAttachments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Attachment)));
      });

      const unsubCalls = onSnapshot(collection(db, 'declarations', selectedDeclaration.id, 'calls'), (snapshot) => {
        setSelectedDeclarationCalls(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Call)));
      });

      return () => {
        unsubAttachments();
        unsubCalls();
      };
    }
  }, [selectedDeclaration]);

  // Update stats based on declarations
  useEffect(() => {
    const total = declarations.length;
    const inProgress = declarations.filter(d => !['Transmitido', 'Concluído'].includes(d.status)).length;
    const completed = declarations.filter(d => d.status === 'Concluído').length;
    const transmitted = declarations.filter(d => d.status === 'Transmitido').length;
    const taxToPay = declarations.filter(d => d.has_tax_to_pay).length;

    setStats({ total, inProgress, completed, transmitted, taxToPay });
  }, [declarations]);

  const filteredDeclarations = useMemo(() => {
    return declarations.filter(d => {
      const matchesSearch = d.client_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           d.client_cpf.includes(searchQuery) ||
                           (d.client_code && d.client_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           (d.client_company && d.client_company.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesType = typeFilter === 'all' || d.client_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [declarations, searchQuery, statusFilter, typeFilter]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = !clientSearchQuery || c.name.toLowerCase().includes(clientSearchQuery.toLowerCase());
      const matchesCode = !clientCodeFilter || (c.code && c.code.toLowerCase().includes(clientCodeFilter.toLowerCase()));
      const matchesCpf = !clientCpfFilter || c.cpf.includes(clientCpfFilter);
      const matchesCategory = !clientCategoryFilter || (c.company && c.company.toLowerCase().includes(clientCategoryFilter.toLowerCase()));
      const matchesNeedsDeclaration = clientNeedsDeclarationFilter === 'all' || 
                                     (clientNeedsDeclarationFilter === 'yes' && c.needs_declaration === true) ||
                                     (clientNeedsDeclarationFilter === 'no' && c.needs_declaration === false);
      
      return matchesSearch && matchesCode && matchesCpf && matchesCategory && matchesNeedsDeclaration;
    });
  }, [clients, clientSearchQuery, clientCodeFilter, clientCpfFilter, clientCategoryFilter, clientNeedsDeclarationFilter]);

  const professionalStats = useMemo(() => {
    return professionals.map(prof => {
      const profDeclarations = declarations.filter(d => d.professional_id === prof.id);
      return {
        name: prof.name,
        total: profDeclarations.length,
        completed: profDeclarations.filter(d => d.status === 'Concluído' || d.status === 'Transmitido').length,
        remaining: profDeclarations.filter(d => d.status !== 'Concluído' && d.status !== 'Transmitido').length
      };
    });
  }, [professionals, declarations]);

  const handleStatusUpdate = async (id: string, newStatus: DeclarationStatus) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'Concluído') updates.completion_date = new Date().toISOString();
    if (newStatus === 'Transmitido') updates.transmission_date = new Date().toISOString();

    await updateDoc(doc(db, 'declarations', id), updates);
  };

  const handleDeleteProfessional = async (id: string) => {
    setConfirmConfig({
      title: 'Excluir Profissional',
      message: 'Tem certeza que deseja excluir este profissional? As declarações atribuídas a ele ficarão sem responsável.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'professionals', id));
          // Note: In Firestore we don't have automatic foreign key updates like in SQL
          // We'd need to manually unassign declarations if needed, but for simplicity:
          const declsToUpdate = declarations.filter(d => d.professional_id === id);
          for (const d of declsToUpdate) {
            await updateDoc(doc(db, 'declarations', d.id), { professional_id: null });
          }
        } catch (error) {
          console.error('Error deleting professional:', error);
          alert('Erro ao excluir profissional.');
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteDeclaration = async (id: string) => {
    setConfirmConfig({
      title: 'Excluir Declaração',
      message: 'Tem certeza que deseja excluir esta declaração? Todos os anexos e registros de chamadas vinculados também serão excluídos.',
      type: 'danger',
      onConfirm: async () => {
        try {
          // 1. Delete calls subcollection
          const callsSnapshot = await getDocs(collection(db, 'declarations', id, 'calls'));
          for (const callDoc of callsSnapshot.docs) {
            await deleteDoc(callDoc.ref);
          }

          // 2. Delete attachments subcollection and files in Storage
          const attachmentsSnapshot = await getDocs(collection(db, 'declarations', id, 'attachments'));
          for (const attDoc of attachmentsSnapshot.docs) {
            const attData = attDoc.data() as Attachment;
            const storageRef = ref(storage, `declarations/${id}/${attData.filename}`);
            await deleteObject(storageRef).catch(err => console.error('Error deleting from storage:', err));
            await deleteDoc(attDoc.ref);
          }

          // 3. Delete the declaration itself
          await deleteDoc(doc(db, 'declarations', id));
        } catch (error) {
          console.error('Error deleting declaration:', error);
          alert('Erro ao excluir declaração.');
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteClient = async (id: string) => {
    setConfirmConfig({
      title: 'Excluir Cliente',
      message: 'Tem certeza que deseja excluir este cliente? Todas as declarações vinculadas também serão excluídas.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'clients', id));
          const declsToDelete = declarations.filter(d => d.client_id === id);
          for (const d of declsToDelete) {
            await deleteDoc(doc(db, 'declarations', d.id));
          }
        } catch (error) {
          console.error('Error deleting client:', error);
          alert('Erro ao excluir cliente.');
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleUpdateClient = async (id: string, updates: Partial<Client>) => {
    try {
      await updateDoc(doc(db, 'clients', id), updates);
      setEditingClient(null);
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleToggleNeedsDeclaration = async (client: Client) => {
    const newStatus = !client.needs_declaration;
    await handleUpdateClient(client.id, { needs_declaration: newStatus });
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

  const handleDeleteAttachment = async (id: string) => {
    if (!selectedDeclaration) return;
    
    setConfirmConfig({
      title: 'Excluir Anexo',
      message: 'Tem certeza que deseja excluir este anexo permanentemente?',
      type: 'danger',
      onConfirm: async () => {
        try {
          const att = selectedDeclarationAttachments.find(a => a.id === id);
          if (att) {
            // Delete from Storage
            const storageRef = ref(storage, `declarations/${selectedDeclaration.id}/${att.filename}`);
            await deleteObject(storageRef).catch(err => console.error('Error deleting from storage:', err));
            
            // Delete from Firestore
            await deleteDoc(doc(db, 'declarations', selectedDeclaration.id, 'attachments', id));
          }
        } catch (error) {
          console.error('Error deleting attachment:', error);
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteCall = async (id: string) => {
    if (!selectedDeclaration) return;

    setConfirmConfig({
      title: 'Excluir Registro',
      message: 'Tem certeza que deseja excluir este registro de ligação?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'declarations', selectedDeclaration.id, 'calls', id));
        } catch (error) {
          console.error('Error deleting call:', error);
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleAddCall = async () => {
    if (!selectedDeclaration || !newCallSummary.trim() || !currentUser) return;
    
    try {
      await addDoc(collection(db, 'declarations', selectedDeclaration.id, 'calls'), {
        declaration_id: selectedDeclaration.id,
        professional_id: currentUser.id,
        professional_name: currentUser.name,
        call_date: new Date().toLocaleString('pt-BR'),
        summary: newCallSummary,
        status_after_call: selectedDeclaration.status
      });
      
      setShowNewCall(false);
      setNewCallSummary('');
    } catch (error) {
      console.error('Error adding call:', error);
    }
  };

  const handleReassign = async (declarationId: string, professionalId: string) => {
    const prof = professionals.find(p => p.id === professionalId);
    if (!prof) return;

    try {
      await updateDoc(doc(db, 'declarations', declarationId), {
        professional_id: professionalId,
        professional_name: prof.name
      });
      
      if (selectedDeclaration && selectedDeclaration.id === declarationId) {
        setSelectedDeclaration({ 
          ...selectedDeclaration, 
          professional_id: professionalId,
          professional_name: prof.name 
        });
      }
      setIsReassigning(false);
    } catch (error) {
      console.error('Error reassigning:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDeclaration || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    const filename = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `declarations/${selectedDeclaration.id}/${filename}`);

    try {
      // 1. Upload to Storage
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      // 2. Save metadata to Firestore
      await addDoc(collection(db, 'declarations', selectedDeclaration.id, 'attachments'), {
        declaration_id: selectedDeclaration.id,
        filename: filename,
        original_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        upload_date: new Date().toISOString(),
        url: url
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erro ao fazer upload do arquivo.');
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
        // 3. CPF/CNPJ (Column C)
        // 4. Name (Column D)
        
        const clientCode = row[0]?.toString().trim() || '';
        const company = row[1]?.toString().trim() || '';
        const cpf = row[2]?.toString().trim() || '';
        const name = row[3]?.toString().trim() || '';
        
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
        const batch = writeBatch(db);
        mappedData.forEach(clientData => {
          const newDocRef = doc(collection(db, 'clients'));
          batch.set(newDocRef, {
            ...clientData,
            needs_declaration: true // Default for imported clients
          });
        });
        
        await batch.commit();
        alert(`${mappedData.length} clientes importados com sucesso!`);
      } catch (error: any) {
        console.error('Error importing clients:', error);
        alert(`Erro ao importar clientes: ${error.message}`);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleCSVImport = handleFileImport; // Keep for compatibility if needed elsewhere

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Carregando sistema seguro...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login 
      onLogin={(user) => {
        setCurrentUser(user);
      }} 
    />;
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
              onClick={handleLogout}
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
                {activeTab === 'clients' && 'Novo Cliente'}
                {activeTab === 'professionals' && 'Novo Profissional'}
                {activeTab === 'declarations' && 'Nova Declaração'}
                {activeTab === 'dashboard' && 'Nova Declaração'}
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
                  {declarations.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                          {d.client_type === 'SOCIO' ? <Building2 size={20} /> : <User size={20} />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{d.client_name}</p>
                          <p className="text-xs text-slate-400">Recebido em: {d.received_date}</p>
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
                          <p className="text-xs text-slate-400">{completed}/{count} concluídas</p>
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
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeclarations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-400">#{d.client_code || '---'}</span>
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
                                  #{d.client_code}
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
                        <p className="text-sm text-slate-600">{d.received_date}</p>
                      </td>
                      <td className="px-6 py-4">
                        {d.has_tax_to_pay ? (
                          <div className="flex items-center gap-1.5 text-rose-600">
                            <AlertCircle size={14} />
                            <span className="text-sm font-medium">R$ {d.tax_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
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

              <select 
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={clientNeedsDeclarationFilter}
                onChange={(e) => setClientNeedsDeclarationFilter(e.target.value)}
              >
                <option value="all">Fazer Declaração: Todos</option>
                <option value="yes">Sim</option>
                <option value="no">Não</option>
              </select>
              
              {(clientSearchQuery || clientCodeFilter || clientCpfFilter || clientCategoryFilter || clientNeedsDeclarationFilter !== 'all') && (
                <button 
                  onClick={() => {
                    setClientSearchQuery('');
                    setClientCodeFilter('');
                    setClientCpfFilter('');
                    setClientCategoryFilter('');
                    setClientNeedsDeclarationFilter('all');
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => {
              const isPF = !client.company || 
                          client.company.toLowerCase().includes('pessoa fisica') || 
                          client.company.toLowerCase().includes('pf') ||
                          client.company.toLowerCase().includes('pesso fisica');

              return (
              <motion.div 
                layout
                key={client.id} 
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${!isPF ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {!isPF ? <Building2 size={24} /> : <User size={24} />}
                    </div>
                    <div className="flex flex-col gap-1">
                      {client.code && (
                        <div className="w-fit bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-wider">
                          Cód. {client.code}
                        </div>
                      )}
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${!isPF ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {!isPF ? 'Sócio / Empresa' : 'Pessoa Física'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingClient(client);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Editar Cliente"
                    >
                      <Edit size={18} />
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
                      <Trash2 size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-bold text-slate-800">{client.name}</h4>
                  <button 
                    onClick={() => handleToggleNeedsDeclaration(client)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      client.needs_declaration === 1 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}
                  >
                    {client.needs_declaration === 1 ? <CheckSquare size={14} /> : <Square size={14} />}
                    {client.needs_declaration === 1 ? 'DECLARAÇÃO: SIM' : 'DECLARAÇÃO: NÃO'}
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">{client.cpf}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <PhoneCall size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Telefone</p>
                      <p className="font-medium">{client.phone || 'Não informado'}</p>
                    </div>
                  </div>
                  {client.company && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!isPF ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                        {!isPF ? <Building2 size={14} /> : <User size={14} />}
                      </div>
                      <div>
                        <p className={`text-[10px] font-bold uppercase leading-none mb-1 ${!isPF ? 'text-indigo-400' : 'text-blue-400'}`}>
                          {!isPF ? 'Empresa / Categoria' : 'Categoria'}
                        </p>
                        <p className="font-medium text-slate-700">
                          {client.company.replace(/pesso fisica/gi, 'Pessoa fisica')}
                        </p>
                      </div>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Mail size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">E-mail</p>
                        <p className="font-medium truncate max-w-[180px]">{client.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <button className="w-full py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors">
                  Ver Histórico
                </button>
              </motion.div>
            )})}
            {filteredClients.length === 0 && (
              <div className="col-span-full py-20 text-center">
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
                          <span className="text-xs font-bold text-slate-700">{prof.percentage}%</span>
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
                      {selectedDeclaration.client_code && <span className="font-black text-slate-900 mr-2">#{selectedDeclaration.client_code}</span>}
                      {selectedDeclaration.client_name} • CPF: {selectedDeclaration.client_cpf}
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
                          onChange={(e) => handleReassign(selectedDeclaration.id, e.target.value)}
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
                        {selectedDeclaration.has_tax_to_pay ? `R$ ${selectedDeclaration.tax_amount.toLocaleString('pt-BR')}` : 'Não'}
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
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 border border-slate-200 rounded-xl flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${att.mime_type?.includes('pdf') ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{att.original_name}</p>
                              <p className="text-xs text-slate-400">{(att.file_size / 1024).toFixed(1)} KB</p>
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
                  needs_declaration: data.needs_declaration === 'on' ? 1 : 0
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
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="needs_declaration" id="edit_needs_decl" defaultChecked={editingClient.needs_declaration === 1} className="w-4 h-4 text-indigo-600 rounded" />
                  <label htmlFor="edit_needs_decl" className="text-sm font-medium text-slate-700">Necessário fazer declaração?</label>
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
                try {
                  await addDoc(collection(db, 'clients'), {
                    ...data,
                    needs_declaration: data.needs_declaration === 'on'
                  });
                  setShowNewClient(false);
                } catch (error) {
                  console.error('Error adding client:', error);
                  alert('Erro ao adicionar cliente.');
                }
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
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="needs_declaration" id="new_needs_decl" defaultChecked={true} className="w-4 h-4 text-indigo-600 rounded" />
                  <label htmlFor="new_needs_decl" className="text-sm font-medium text-slate-700">Necessário fazer declaração?</label>
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
                
                const client = clients.find(c => c.id === data.client_id);
                if (!client) return;

                try {
                  await addDoc(collection(db, 'declarations'), {
                    ...data,
                    client_name: client.name,
                    client_cpf: client.cpf,
                    client_code: client.code,
                    client_type: client.type,
                    client_company: client.company,
                    has_tax_to_pay: data.has_tax_to_pay === 'on',
                    tax_amount: parseFloat(data.tax_amount as string || '0')
                  });
                  setShowNewDeclaration(false);
                } catch (error) {
                  console.error('Error adding declaration:', error);
                  alert('Erro ao criar declaração.');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cliente</label>
                  <select name="client_id" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                    <option value="">Selecione um cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `[${c.code}] ` : ''}{c.name} ({c.cpf}){c.company ? ` - ${c.company}` : ''}
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
                  <input type="date" name="received_date" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="has_tax_to_pay" id="has_tax" className="w-4 h-4 text-indigo-600 rounded" />
                  <label htmlFor="has_tax" className="text-sm font-medium text-slate-700">Tem imposto a pagar?</label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor do Imposto (R$)</label>
                  <input type="number" step="0.01" name="tax_amount" placeholder="0,00" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
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
                  // Note: Creating a professional involves creating an Auth user.
                  // This usually requires a backend or admin SDK.
                  // For this applet, we'll assume the admin creates the user manually in Firebase Console
                  // and we just add the doc to Firestore.
                  // Alternatively, we could use a Cloud Function.
                  // Since we are in a simplified environment, let's just add the doc.
                  // In a real app, you'd use createUserWithEmailAndPassword if the admin is logged in,
                  // but that would log out the admin.
                  
                  await addDoc(collection(db, 'professionals'), {
                    name: data.name,
                    email: data.email,
                    role: data.role
                  });
                  
                  setShowNewProfessional(false);
                  alert('Profissional cadastrado no banco de dados. Certifique-se de criar o acesso no Firebase Auth.');
                } catch (error) {
                  console.error('Error creating professional:', error);
                  alert('Erro ao cadastrar profissional.');
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
                  const user = auth.currentUser;
                  if (user && user.email) {
                    const credential = EmailAuthProvider.credential(user.email, data.currentPassword as string);
                    await reauthenticateWithCredential(user, credential);
                    await updatePassword(user, data.newPassword as string);
                    alert('Senha alterada com sucesso!');
                    setShowChangePassword(false);
                  }
                } catch (error: any) {
                  console.error('Error changing password:', error);
                  alert(`Erro: ${error.message || 'Erro desconhecido'}`);
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
