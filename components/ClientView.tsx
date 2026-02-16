import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import { CheckCircle2, Clock, Loader2, ArrowRight, Wallet, TrendingUp, BarChart2, Info } from 'lucide-react';
import { getTasks, getCampaigns } from '../services/firebaseService';
import { Task, Campaign } from '../types';

interface ClientViewProps {
    clientId?: string;
}

const ClientView: React.FC<ClientViewProps> = ({ clientId }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            // Agora filtramos explicitamente pelo ID do cliente
            const [t, c] = await Promise.all([
                getTasks(clientId), 
                getCampaigns(clientId)
            ]);
            setTasks(t);
            setCampaigns(c);
            setLoading(false);
        };
        fetch();
    }, [clientId]);

    const recentActivity = tasks
        .filter(t => t.status === 'Concluído' || t.status === 'Em Progresso')
        .slice(0, 4);

    const totalSpend = campaigns.reduce((acc, curr) => acc + curr.spend, 0);
    const totalClicks = campaigns.reduce((acc, curr) => acc + curr.clicks, 0);
    const avgRoas = campaigns.length > 0 ? campaigns.reduce((acc, curr) => acc + curr.roas, 0) / campaigns.length : 0;

    if (loading) return <div className="p-8 text-amber-600 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const isAggregateView = !clientId || clientId === 'all';

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto">
             <div className="flex justify-between items-end border-b border-amber-200/50 pb-6">
                <div>
                    <h2 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">
                        Portal do Investidor
                    </h2>
                    <p className="text-amber-700/80 font-medium">Acompanhamento de patrimônio digital e resultados.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-200 shadow-sm">
                        Cliente VIP
                    </div>
                    {isAggregateView && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded">
                            <Info size={10} />
                            Visão Agregada (Admin)
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 - Investimento */}
                <div className="relative group overflow-hidden bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-200/50 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4 border border-amber-100">
                            <Wallet size={24} />
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Investimento Acumulado</p>
                        <h3 className="text-3xl font-bold text-slate-800">R$ {totalSpend.toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:0})}</h3>
                    </div>
                </div>

                {/* Card 2 - ROAS */}
                <div className="relative group overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all duration-300">
                     <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
                     <div className="relative z-10">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-400 mb-4 border border-slate-700">
                            <TrendingUp size={24} />
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Retorno (ROAS)</p>
                        <h3 className="text-4xl font-bold text-white">{avgRoas.toFixed(2)}x</h3>
                        <p className="text-emerald-400 text-xs mt-2 font-medium flex items-center gap-1">
                            Performance Excelente <CheckCircle2 size={12} />
                        </p>
                    </div>
                </div>

                {/* Card 3 - Cliques */}
                 <div className="relative group overflow-hidden bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-200/50 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
                            <BarChart2 size={24} />
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Volume de Tráfego</p>
                        <h3 className="text-3xl font-bold text-slate-800">{totalClicks.toLocaleString('pt-BR')}</h3>
                        <p className="text-slate-400 text-xs mt-1">Cliques Totais</p>
                    </div>
                </div>
            </div>

            <GlassCard title="Linha do Tempo de Entregas">
                <div className="space-y-0 mt-4">
                    {recentActivity.length === 0 ? (
                        <p className="text-slate-400 p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            Nenhuma atividade recente registrada para este perfil.
                        </p>
                    ) : (
                        recentActivity.map((task, idx) => (
                            <div key={idx} className="flex gap-4 items-start relative pb-8 last:pb-0 group">
                                {idx !== recentActivity.length - 1 && (
                                    <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-100 group-hover:bg-amber-100 transition-colors"></div>
                                )}
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center z-10 border-4 border-white shadow-md transition-transform group-hover:scale-110 ${task.status === 'Concluído' ? 'bg-emerald-500 text-white' : 'bg-white text-amber-500'}`}>
                                    {task.status === 'Concluído' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                </div>
                                <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-amber-200">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-slate-800 font-bold text-sm">{task.title}</h4>
                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                                            task.status === 'Concluído' ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50'
                                        }`}>{task.status}</span>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        {task.tags.map(tag => (
                                            <span key={tag} className="text-[10px] bg-slate-50 px-2 py-1 rounded text-slate-400 font-medium border border-slate-100">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>
            
            <div className="text-center pt-8 pb-4">
                <p className="text-xs text-slate-400">Marketing Money &copy; Private Dashboard</p>
            </div>
        </div>
    );
};

export default ClientView;