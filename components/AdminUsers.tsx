import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Briefcase, Shield, Loader2, Trash2, Lock, Building, Hash, Pencil, X, Save } from 'lucide-react';
import GlassCard from './GlassCard';
import { UserProfile, UserRole } from '../types';
import { registerNewUser, getUsers, updateUserProfile } from '../services/firebaseService';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null); // Se tiver ID, está editando
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('TEAM');
  const [newCompany, setNewCompany] = useState('');
  const [newAdAccountId, setNewAdAccountId] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleEditClick = (user: UserProfile) => {
      setEditingId(user.id || null);
      setNewName(user.name);
      setNewEmail(user.email);
      setNewRole(user.role);
      setNewCompany(user.companyName || '');
      setNewAdAccountId(user.adAccountId || '');
      setNewPassword(''); // Não preenche senha na edição
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('TEAM');
      setNewCompany('');
      setNewAdAccountId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!newName || !newEmail) return;
    if (!editingId && !newPassword) return; // Senha obrigatória apenas ao criar

    setProcessing(true);

    try {
        if (editingId) {
            // MODO EDIÇÃO
            const updateData: Partial<UserProfile> = {
                name: newName,
                role: newRole,
                companyName: newRole === 'CLIENT' ? newCompany : undefined,
                adAccountId: newRole === 'CLIENT' ? newAdAccountId : undefined,
            };
            
            await updateUserProfile(editingId, updateData);
            alert(`Usuário ${newName} atualizado com sucesso!`);
        } else {
            // MODO CRIAÇÃO
            const newUserProfile: UserProfile = {
                name: newName,
                email: newEmail,
                role: newRole,
                companyName: newRole === 'CLIENT' ? newCompany : undefined,
                adAccountId: newRole === 'CLIENT' ? newAdAccountId : undefined,
                createdAt: new Date().toISOString()
            };
            await registerNewUser(newEmail, newPassword, newUserProfile);
            alert(`Usuário ${newEmail} criado com sucesso!`);
        }
        
        handleCancelEdit(); // Reseta form
        await fetchUsers(); 

    } catch (err: any) {
        alert("Erro: " + err.message);
    } finally {
        setProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Gestão de Acessos</h2>
          <p className="text-slate-500 text-sm mt-1">
             {editingId ? 'Editando usuário existente.' : 'Crie contas para sua equipe ou libere acesso para clientes.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Criação/Edição */}
        <div className="lg:col-span-1">
          <GlassCard 
            title={editingId ? "Editar Usuário" : "Cadastrar Novo Acesso"} 
            className={`h-full border-t-4 transition-colors ${editingId ? 'border-t-amber-500 bg-amber-50/30' : 'border-t-emerald-500'}`}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Seletor de Tipo */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Conta</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            type="button"
                            onClick={() => setNewRole('TEAM')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${newRole === 'TEAM' 
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        >
                            <Briefcase size={20} className="mb-1" />
                            <span className="text-xs font-bold">Equipe</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setNewRole('CLIENT')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${newRole === 'CLIENT' 
                                ? 'bg-amber-50 border-amber-500 text-amber-700' 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        >
                            <Users size={20} className="mb-1" />
                            <span className="text-xs font-bold">Cliente</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome Completo</label>
                        <input 
                            type="text" 
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-800 transition-all text-sm"
                            placeholder="Ex: Ana Souza"
                            required
                        />
                    </div>
                    
                    {newRole === 'CLIENT' && (
                        <div className="animate-in fade-in slide-in-from-top-2 space-y-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                            <div>
                                <label className="block text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Building size={12} /> Empresa do Cliente
                                </label>
                                <input 
                                    type="text" 
                                    value={newCompany}
                                    onChange={e => setNewCompany(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-amber-200 focus:outline-none focus:border-amber-500 text-slate-800 transition-all text-sm"
                                    placeholder="Ex: Mercado Livre Ltda"
                                    required
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Hash size={12} /> ID da Conta de Anúncios
                                </label>
                                <input 
                                    type="text" 
                                    value={newAdAccountId}
                                    onChange={e => setNewAdAccountId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-amber-200 focus:outline-none focus:border-amber-500 text-slate-600 font-mono text-xs transition-all"
                                    placeholder="Ex: act_123456789"
                                />
                                <p className="text-[9px] text-amber-700/60 mt-1">Necessário para importar dados do Meta Ads.</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Corporativo</label>
                        <input 
                            type="email" 
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none text-slate-800 transition-all text-sm ${editingId ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 focus:border-emerald-500'}`}
                            placeholder="usuario@empresa.com"
                            required
                            readOnly={!!editingId}
                        />
                        {editingId && <p className="text-[10px] text-slate-400 mt-1">O email não pode ser alterado aqui.</p>}
                    </div>
                    
                    {!editingId && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Senha Temporária</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-800 font-mono text-sm transition-all"
                                    placeholder="Mínimo 6 dígitos"
                                    required={!editingId}
                                    minLength={6}
                                />
                                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 ml-1">O usuário poderá alterar depois.</p>
                        </div>
                    )}
                </div>

                <div className="pt-2 flex gap-2">
                    {editingId && (
                        <button 
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={processing}
                            className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                            <X size={18} /> Cancelar
                        </button>
                    )}
                    <button 
                        type="submit"
                        disabled={processing}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                            editingId 
                                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                                : newRole === 'CLIENT' 
                                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                        }`}
                    >
                        {processing ? <Loader2 className="animate-spin" size={18} /> : 
                         editingId ? <><Save size={18} /> Salvar Alterações</> : 
                         <><UserPlus size={18} /> Criar Acesso</>
                        }
                    </button>
                </div>
            </form>
          </GlassCard>
        </div>

        {/* Lista de Usuários */}
        <div className="lg:col-span-2">
            <GlassCard title={`Base de Usuários (${users.length})`} className="h-full overflow-hidden flex flex-col">
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white/95 backdrop-blur z-10">
                            <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100 font-bold">
                                <th className="p-4 pl-6">Usuário</th>
                                <th className="p-4">Permissão</th>
                                <th className="p-4">Empresa / ID Anúncio</th>
                                <th className="p-4 text-right pr-6">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {users.length === 0 ? (
                                <tr><td colSpan={4} className="p-12 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className={`border-b border-slate-50 transition-colors group ${editingId === user.id ? 'bg-amber-50' : 'hover:bg-slate-50/80'}`}>
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ${
                                                    user.role === 'ADMIN' ? 'bg-slate-700' :
                                                    user.role === 'CLIENT' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {user.role === 'ADMIN' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200"><Shield size={12} /> Admin</span>}
                                            {user.role === 'TEAM' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100"><Briefcase size={12} /> Equipe</span>}
                                            {user.role === 'CLIENT' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100"><Users size={12} /> Cliente</span>}
                                        </td>
                                        <td className="p-4 text-slate-600 font-medium">
                                            <div className="flex flex-col">
                                                <span>{user.companyName || <span className="text-slate-300 italic">Interno</span>}</span>
                                                {user.adAccountId ? (
                                                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 rounded w-fit mt-1 border border-emerald-100 flex items-center gap-1">
                                                        <Hash size={8} /> {user.adAccountId}
                                                    </span>
                                                ) : user.role === 'CLIENT' ? (
                                                    <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 rounded w-fit mt-1 border border-amber-100">
                                                        Sem ID de Anúncio
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <button 
                                                onClick={() => handleEditClick(user)}
                                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                                                title="Editar Usuário"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;