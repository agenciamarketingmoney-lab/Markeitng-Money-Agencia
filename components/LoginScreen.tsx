import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, TrendingUp, Loader2, AlertCircle, Database, Check } from 'lucide-react';
import { UserRole } from '../types';
import { loginUser, seedSystemUsers } from '../services/firebaseService';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole, userName: string, userId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
        const { user, role, profile } = await loginUser(email, password);
        // Agora passamos user.uid para o App principal
        onLoginSuccess(role, profile?.name || email.split('@')[0], user.uid);
    } catch (err: any) {
        console.error("Login Error:", err);
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setError("Usuário ou senha inválidos. Se é seu primeiro acesso, clique em 'Inicializar Banco de Dados' abaixo.");
        } else if (err.code === 'auth/too-many-requests') {
            setError("Muitas tentativas falhas. Tente novamente mais tarde.");
        } else {
            setError("Erro ao conectar: " + (err.message || "Erro desconhecido"));
        }
    } finally {
        setLoading(false);
    }
  };

  const handleSeedUsers = async () => {
      setSeeding(true);
      setError(null);
      setSuccessMsg(null);
      try {
          const res = await seedSystemUsers();
          if (res.failed === 0) {
              setSuccessMsg("Sistema inicializado com sucesso! Agora clique em um dos atalhos acima para entrar.");
          } else {
              setSuccessMsg("Inicialização concluída (com avisos). Tente fazer login.");
          }
      } catch (e: any) {
          setError("Erro na inicialização: " + e.message);
      } finally {
          setSeeding(false);
      }
  }

  const fillCredentials = (role: 'ADMIN' | 'TEAM' | 'CLIENT') => {
      if (role === 'ADMIN') {
          setEmail('admin@marketingmoney.com');
          setPassword('admin123');
      } else if (role === 'TEAM') {
          setEmail('equipe@marketingmoney.com');
          setPassword('equipe123');
      } else {
          setEmail('cliente@marketingmoney.com');
          setPassword('cliente123');
      }
      setError(null);
      setSuccessMsg(null);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 text-slate-800 p-4">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-100/40 blur-[100px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-100/40 blur-[100px] rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-8 duration-700">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <TrendingUp size={14} className="text-emerald-600" />
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Growth OS v2.0</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            Marketing<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">Money</span>
          </h1>
          <p className="text-slate-500 text-sm">Acesse sua central de inteligência.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-400"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-medium">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            
            {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-700 text-xs font-medium animate-in fade-in">
                    <Check size={16} className="flex-shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">Email Corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">Senha de Acesso</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || seeding}
              className="w-full group relative flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-white bg-slate-900 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span className="font-semibold">Entrar no Sistema</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
              )}
            </button>
          </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-3">Preencher Atalhos (Demo)</p>
                <div className="flex justify-center gap-3 text-xs font-medium text-slate-500">
                    <button onClick={() => fillCredentials('ADMIN')} className="hover:text-emerald-600 hover:underline px-2 py-1 rounded hover:bg-emerald-50 transition-colors">Admin</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => fillCredentials('TEAM')} className="hover:text-emerald-600 hover:underline px-2 py-1 rounded hover:bg-emerald-50 transition-colors">Equipe</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => fillCredentials('CLIENT')} className="hover:text-emerald-600 hover:underline px-2 py-1 rounded hover:bg-emerald-50 transition-colors">Cliente</button>
                </div>

                <div className="mt-8">
                    <button 
                        onClick={handleSeedUsers}
                        disabled={seeding || loading}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                        {seeding ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
                        <span>Inicializar Banco de Dados (Primeiro Acesso)</span>
                    </button>
                    <p className="text-[9px] text-slate-400 mt-2">Clique aqui se estiver vendo erro de credenciais.</p>
                </div>
            </div>

        </div>
        
        <p className="text-center mt-8 text-xs text-slate-400">
          &copy; 2024 Marketing Money Agency. Secure Connection.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;