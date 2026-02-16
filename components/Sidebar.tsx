import React from 'react';
import { LayoutDashboard, KanbanSquare, BarChart3, Users, Settings, LogOut, Briefcase, PieChart, Shield } from 'lucide-react';
import { ViewState, UserRole } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userRole: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, onLogout }) => {
  
  // Define colors based on role
  const getActiveStyles = () => {
      if (userRole === 'CLIENT') return 'bg-amber-50 text-amber-700 border-amber-200';
      if (userRole === 'ADMIN') return 'bg-slate-800 text-white shadow-md shadow-slate-300';
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'; // Team default
  };

  const getHoverStyles = () => {
      if (userRole === 'CLIENT') return 'hover:text-amber-600 hover:bg-amber-50/50';
      if (userRole === 'ADMIN') return 'hover:text-slate-800 hover:bg-slate-100';
      return 'hover:text-emerald-600 hover:bg-emerald-50/50';
  };

  const getIconColor = (isActive: boolean) => {
      if (!isActive) return 'text-slate-400';
      if (userRole === 'CLIENT') return 'text-amber-600';
      if (userRole === 'ADMIN') return 'text-white'; // White because bg is dark
      return 'text-emerald-600';
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => onChangeView(view)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group border border-transparent
          ${isActive 
            ? getActiveStyles()
            : `text-slate-500 ${getHoverStyles()}`
          }`}
      >
        <Icon size={20} className={`${getIconColor(isActive)} transition-colors`} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="w-64 h-screen fixed left-0 top-0 p-4 flex flex-col z-50">
      <div className="h-full bg-white/60 backdrop-blur-2xl border border-white/60 rounded-2xl flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {/* Logo Area */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg ${
                userRole === 'CLIENT' ? 'from-amber-400 to-amber-600' : 
                userRole === 'ADMIN' ? 'from-slate-700 to-slate-900' :
                'from-emerald-500 to-emerald-700'
            }`}>
              <span className="font-bold text-white text-xl">$</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">Marketing<br/><span className={userRole === 'CLIENT' ? 'text-amber-500' : userRole === 'ADMIN' ? 'text-slate-700' : 'text-emerald-600'}>Money</span></h1>
            </div>
          </div>
          <div className={`mt-3 text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full w-fit ${
              userRole === 'ADMIN' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
              userRole === 'TEAM' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
              'bg-amber-50 text-amber-700 border border-amber-100'
          }`}>
            {userRole === 'ADMIN' ? 'Admin Access' : userRole === 'CLIENT' ? 'Client VIP' : 'Team Access'}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          
          {(userRole === 'ADMIN' || userRole === 'TEAM') && (
            <>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">Operacional</div>
              <NavItem view={ViewState.DASHBOARD} icon={LayoutDashboard} label="Visão Geral" />
              <NavItem view={ViewState.KANBAN} icon={KanbanSquare} label="Projetos & Tarefas" />
              <NavItem view={ViewState.CAMPAIGNS} icon={BarChart3} label="Campanhas Meta" />
            </>
          )}

          {userRole === 'ADMIN' && (
             <>
                <div className="mt-8 text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">Administração</div>
                <NavItem view={ViewState.ADMIN_USERS} icon={Shield} label="Criar Usuários" />
                <NavItem view={ViewState.CLIENT_AREA} icon={Users} label="Simular Cliente" />
             </>
          )}

          {userRole === 'TEAM' && (
             <>
                <div className="mt-8 text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">Relacionamento</div>
                <NavItem view={ViewState.CLIENT_AREA} icon={Users} label="Visão do Cliente" />
             </>
          )}

          {userRole === 'CLIENT' && (
            <>
               <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">Seu Painel</div>
               <NavItem view={ViewState.CLIENT_AREA} icon={PieChart} label="Resultados" />
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          {userRole === 'ADMIN' && (
            <button 
              onClick={() => onChangeView(ViewState.SETTINGS)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                currentView === ViewState.SETTINGS 
                ? 'bg-slate-800 text-white' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
                <Settings size={20} className={currentView === ViewState.SETTINGS ? 'text-white' : 'text-slate-400'} />
                <span className="font-medium">Configurações</span>
            </button>
          )}
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;