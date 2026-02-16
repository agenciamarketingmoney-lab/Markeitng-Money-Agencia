import React, { useState, useEffect } from 'react';
import { Loader2, Briefcase } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Kanban from './components/Kanban';
import Campaigns from './components/Campaigns';
import ClientView from './components/ClientView';
import LoginScreen from './components/LoginScreen';
import AdminUsers from './components/AdminUsers';
import Settings from './components/Settings';
import { ViewState, UserRole, UserProfile } from './types';
import { getClients } from './services/firebaseService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string>(''); // Novo estado para ID do usuário logado
  
  // Estado para o seletor de clientes (Apenas Admin/Equipe)
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [loadingClients, setLoadingClients] = useState(false);

  // Carrega a lista de clientes se for Admin ou Equipe
  useEffect(() => {
    if (userRole === 'ADMIN' || userRole === 'TEAM') {
        const fetchClients = async () => {
            setLoadingClients(true);
            const data = await getClients();
            setClients(data);
            setLoadingClients(false);
        };
        fetchClients();
    }
  }, [userRole]);

  // Atualizado para receber uid
  const handleLoginSuccess = (role: UserRole, name: string, uid: string) => {
      setUserRole(role);
      setUserName(name);
      setUserId(uid);
      
      if (role === 'CLIENT') {
          setCurrentView(ViewState.CLIENT_AREA);
      } else if (role === 'ADMIN') {
          setCurrentView(ViewState.ADMIN_USERS);
      } else {
          setCurrentView(ViewState.DASHBOARD);
      }
  };

  const handleLogout = () => {
      setUserRole(null);
      setUserName('');
      setUserId('');
      setCurrentView(ViewState.DASHBOARD);
      setSelectedClientId('all');
  };

  const renderView = () => {
    // Security check: Clientes só veem sua área
    if (userRole === 'CLIENT' && currentView !== ViewState.CLIENT_AREA) {
        return <ClientView clientId={userId} />;
    }
    
    // Admin check
    if ((currentView === ViewState.ADMIN_USERS || currentView === ViewState.SETTINGS) && userRole !== 'ADMIN') {
        return <Dashboard userRole={userRole} selectedClientId={selectedClientId} />;
    }

    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard userRole={userRole} selectedClientId={selectedClientId} />;
      case ViewState.KANBAN:
        return <Kanban selectedClientId={selectedClientId} clients={clients} />;
      case ViewState.CAMPAIGNS:
        return <Campaigns selectedClientId={selectedClientId} clients={clients} />;
      case ViewState.CLIENT_AREA:
        // Lógica crucial de separação:
        // Se for CLIENTE, passa o ID dele.
        // Se for ADMIN, passa o ID selecionado no dropdown.
        return <ClientView clientId={userRole === 'CLIENT' ? userId : selectedClientId} />;
      case ViewState.ADMIN_USERS:
        return <AdminUsers />;
      case ViewState.SETTINGS:
        return <Settings />;
      default:
        return <Dashboard userRole={userRole} selectedClientId={selectedClientId} />;
    }
  };

  if (!userRole) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Nome do cliente selecionado para exibição (apenas Admin/Equipe)
  const currentClientName = clients.find(c => c.id === selectedClientId)?.companyName || clients.find(c => c.id === selectedClientId)?.name || "Todos os Clientes";

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        userRole={userRole}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-64 p-8 relative">
        {/* Top gradient glow */}
        <div className={`fixed top-0 left-64 right-0 h-32 bg-gradient-to-b ${
            userRole === 'CLIENT' ? 'from-amber-100/50' : 
            userRole === 'ADMIN' ? 'from-slate-200/50' :
            'from-emerald-100/50'
        } to-transparent pointer-events-none z-0`} />
        
        {/* Header com Seletor de Cliente */}
        <div className="relative z-10 max-w-7xl mx-auto mb-8 flex justify-between items-end animate-in fade-in slide-in-from-top-2">
            <div>
                <h1 className="text-xl font-bold text-slate-800">Olá, {userName}</h1>
                <p className="text-xs text-slate-500">
                    {userRole === 'ADMIN' ? 'Administrador do Sistema' : userRole === 'TEAM' ? 'Membro da Equipe' : 'Portal do Cliente'}
                </p>
            </div>

            {/* Client Selector Dropdown (Apenas para ADMIN/TEAM) */}
            {(userRole === 'ADMIN' || userRole === 'TEAM') && (
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contexto de Visualização</p>
                        <p className="text-sm font-bold text-emerald-700">{currentClientName}</p>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase size={16} className="text-slate-400" />
                        </div>
                        <select 
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-emerald-300 transition-all cursor-pointer min-w-[200px]"
                        >
                            <option value="all">Todos os Clientes</option>
                            <optgroup label="Seus Clientes">
                                {clients.map(client => (
                                    <option key={client.id} value={client.id || ''}>
                                        {client.companyName || client.name}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                         <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
            
            {userRole === 'CLIENT' && (
                <div className="text-xs text-slate-400 font-mono bg-white/50 px-3 py-1 rounded-full border border-slate-100">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            )}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;