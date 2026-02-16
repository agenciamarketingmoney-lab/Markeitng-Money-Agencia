import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Filter, Download, Loader2, Plus, Users, RefreshCw, Facebook, AlertCircle, Link, CheckCircle2, MessageCircle } from 'lucide-react';
import GlassCard from './GlassCard';
import { getCampaigns, addCampaign, syncMetaCampaigns } from '../services/firebaseService';
import { Campaign, UserProfile } from '../types';

interface CampaignsProps {
    selectedClientId?: string;
    clients: UserProfile[];
}

const Campaigns: React.FC<CampaignsProps> = ({ selectedClientId, clients }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, [selectedClientId]);

  const fetchCampaigns = async () => {
      setLoading(true);
      const data = await getCampaigns(selectedClientId);
      setCampaigns(data);
      setLoading(false);
  }

  const handleSyncMeta = async () => {
      if (!selectedClientId || selectedClientId === 'all') {
          alert("Selecione um cliente específico no menu superior (ao lado do seu nome) para sincronizar.");
          return;
      }
      
      setSyncing(true);
      const result = await syncMetaCampaigns(selectedClientId);
      setSyncing(false);
      
      if (result.success) {
          alert(result.message);
          fetchCampaigns(); // Recarrega para mostrar os novos dados
      } else {
          alert("Erro: " + result.message);
      }
  };

  const handleNewCampaign = async () => {
      // Se estiver em "Todos", obriga a escolher
      let targetClientId = selectedClientId;
      
      if (!targetClientId || targetClientId === 'all') {
         if (clients.length === 0) {
             alert("Não há clientes cadastrados para vincular campanhas.");
             return;
         }
         // Prompt simples para MVP (ideal seria um modal)
         const clientNames = clients.map((c, i) => `${i + 1}. ${c.companyName || c.name}`).join('\n');
         const selection = prompt(`Para qual cliente é esta campanha?\nDigite o NÚMERO:\n\n${clientNames}`);
         
         const index = Number(selection) - 1;
         if (isNaN(index) || index < 0 || index >= clients.length) return;
         targetClientId = clients[index].id;
      }

      const name = prompt("Nome da Campanha:");
      if (!name) return;
      
      const spend = Number(prompt("Investimento (R$):", "0"));
      const platform = prompt("Plataforma (Meta/Google/TikTok):", "Meta") as any;

      const newCampaign: Omit<Campaign, 'id'> = {
          name,
          clientId: targetClientId,
          status: 'Active',
          spend: spend || 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          cpc: 0,
          roas: 0,
          conversations: 0, // Inicia zerado no manual
          leads: 0,
          platform: platform || 'Meta'
      };

      try {
        await addCampaign(newCampaign);
        fetchCampaigns();
      } catch (e) {
          alert("Erro ao criar campanha. Verifique as permissões.");
      }
  };

  const getClientName = (id?: string) => {
      if (!id) return 'Geral';
      const c = clients.find(client => client.id === id);
      return c ? (c.companyName || c.name) : 'Desconhecido';
  }

  if (loading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
      )
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Relatórios Meta Ads</h2>
          <p className="text-slate-500 text-sm mt-1">
             {selectedClientId && selectedClientId !== 'all' 
                ? `Visualizando campanhas de: ${getClientName(selectedClientId)}` 
                : 'Visualizando campanhas de todos os clientes'}
          </p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={handleSyncMeta}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                title="Puxar dados usando Token da Agência + ID do Cliente"
            >
                {syncing ? <Loader2 size={18} className="animate-spin" /> : <Facebook size={18} />}
                {syncing ? 'Sincronizando...' : 'Sincronizar Meta Ads'}
            </button>
            <button 
                onClick={handleNewCampaign}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20"
            >
                <Plus size={18} /> Manual
            </button>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden shadow-xl border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Campanha</th>
                <th className="p-4 font-semibold text-right">Investimento</th>
                <th className="p-4 font-semibold text-right">Resultados (Whats/Leads)</th>
                <th className="p-4 font-semibold text-right">Custo / Res.</th>
                <th className="p-4 font-semibold text-right">Clicks (CTR)</th>
                <th className="p-4 font-semibold text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {campaigns.length === 0 ? (
                  <tr>
                      <td colSpan={7} className="p-12">
                          <div className="max-w-2xl mx-auto bg-blue-50 rounded-xl border border-blue-100 p-6">
                            <h3 className="text-blue-900 font-bold text-lg mb-2 flex items-center gap-2">
                                <AlertCircle size={20} />
                                Nenhuma campanha encontrada aqui
                            </h3>
                            <p className="text-blue-800/80 mb-6">
                                Siga o passo a passo para trazer os dados do Facebook para cá:
                            </p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center border border-blue-200 flex-shrink-0">1</div>
                                    <div>
                                        <p className="font-bold text-blue-900">Configure o ID da Conta de Anúncios</p>
                                        <p className="text-sm text-blue-700/80 mt-1">
                                            Acesse o menu <strong>Criar Usuários</strong>, edite o cliente desejado e cole o ID da conta dele (ex: <code>act_123456</code>).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center border border-blue-200 flex-shrink-0">2</div>
                                    <div>
                                        <p className="font-bold text-blue-900">Selecione o Cliente</p>
                                        <p className="text-sm text-blue-700/80 mt-1">
                                            No topo desta página, mude o seletor de "Todos os Clientes" para o cliente específico que você configurou.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center border border-blue-200 flex-shrink-0">3</div>
                                    <div>
                                        <p className="font-bold text-blue-900">Clique em Sincronizar</p>
                                        <p className="text-sm text-blue-700/80 mt-1">
                                            Clique no botão azul <strong>Sincronizar Meta Ads</strong> acima. O sistema vai usar sua Chave Mestra para ler os dados da conta do cliente.
                                        </p>
                                    </div>
                                </div>
                            </div>
                          </div>
                      </td>
                  </tr>
              ) : (
                  campaigns.map((campaign, idx) => {
                    const totalResults = (campaign.conversations || 0) + (campaign.leads || 0);
                    const cpr = totalResults > 0 ? campaign.spend / totalResults : 0;

                    return (
                    <tr key={campaign.id} className={`border-b border-slate-50 hover:bg-emerald-50/30 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="p-4">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                        campaign.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                        campaign.status === 'Paused' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                    </td>
                    <td className="p-4">
                        <p className="font-bold text-slate-700">{campaign.name}</p>
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1">
                            {campaign.platform} • {getClientName(campaign.clientId)}
                         </div>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600 font-medium">
                        R$ {campaign.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 font-bold text-emerald-700">
                             <MessageCircle size={14} className="text-emerald-400" />
                             {totalResults.toLocaleString()}
                        </div>
                    </td>
                     <td className="p-4 text-right">
                        {cpr > 0 ? (
                            <span className={`text-xs font-bold px-2 py-1 rounded border ${
                                cpr < 5 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                cpr < 15 ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                                R$ {cpr.toFixed(2)}
                            </span>
                        ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-4 text-right text-slate-600">
                        {campaign.clicks.toLocaleString('pt-BR')} <span className="text-slate-400 text-xs">({campaign.ctr.toFixed(2)}%)</span>
                    </td>
                    <td className="p-4 text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-md border ${
                        campaign.roas >= 4 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        campaign.roas >= 2 ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        'bg-red-50 border-red-200 text-red-600'
                        }`}>
                        <span className="font-bold">{campaign.roas.toFixed(1)}x</span>
                        </div>
                    </td>
                    </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default Campaigns;