import React, { useState, useEffect, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, Cell, BarChart, Bar, Legend, PieChart, Pie
} from 'recharts';
import { 
  DollarSign, TrendingUp, Target, Users, Sparkles, Database, Loader2, 
  Link2, BrainCircuit, ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, Trophy,
  Filter, ChevronDown, Check, X, Megaphone, MousePointerClick, ShoppingBag, Eye, MessageCircle, CalendarDays, RefreshCw, Smartphone, Monitor
} from 'lucide-react';
import GlassCard from './GlassCard';
import { analyzeCampaignPerformance } from '../services/geminiService';
import { getCampaigns, getClients, syncMetaCampaigns } from '../services/firebaseService';
import { Campaign, KPIData, UserRole, UserProfile } from '../types';

interface DashboardProps {
    userRole: UserRole;
    selectedClientId?: string;
}

type AnalysisMode = 'PERFORMANCE' | 'TRAFFIC' | 'BRANDING' | 'WHATSAPP';

// Presets do Facebook API
const DATE_PRESETS = [
    { label: 'Vitalício', value: 'maximum' },
    { label: 'Hoje', value: 'today' },
    { label: 'Ontem', value: 'yesterday' },
    { label: 'Últimos 7 dias', value: 'last_7d' },
    { label: 'Últimos 30 dias', value: 'last_30d' },
    { label: 'Este Mês', value: 'this_month' },
];

const COLORS_AGE = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
const COLORS_GENDER = ['#ec4899', '#3b82f6', '#cbd5e1'];
const COLORS_PLATFORM = ['#1877F2', '#DB4437', '#000000']; // Facebook Blue, Google Red, TikTok Black

const Dashboard: React.FC<DashboardProps> = ({ userRole, selectedClientId }) => {
  // Data States
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [currentClientData, setCurrentClientData] = useState<UserProfile | null>(null);
  
  // Date & Sync States
  const [datePreset, setDatePreset] = useState('maximum');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Analytics States
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('PERFORMANCE');
  const [topCampaign, setTopCampaign] = useState<Campaign | null>(null);
  const [alertCampaign, setAlertCampaign] = useState<Campaign | null>(null);
  const [funnelData, setFunnelData] = useState<any[]>([]);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE'>('ACTIVE');
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load Filters
  useEffect(() => {
      const savedFilters = localStorage.getItem(`dashboard_filters_${selectedClientId || 'all'}`);
      if (savedFilters) {
          try {
              const parsed = JSON.parse(savedFilters);
              setStatusFilter(parsed.status || 'ACTIVE');
              setSelectedCampaignIds(parsed.ids || []);
          } catch (e) {
              console.error("Erro ao carregar filtros salvos", e);
          }
      } else {
          setStatusFilter('ACTIVE');
          setSelectedCampaignIds([]);
      }
  }, [selectedClientId]);

  // Save Filters
  useEffect(() => {
      const settings = { status: statusFilter, ids: selectedCampaignIds };
      localStorage.setItem(`dashboard_filters_${selectedClientId || 'all'}`, JSON.stringify(settings));
  }, [statusFilter, selectedCampaignIds, selectedClientId]);

  // Close dropdown logic
  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setIsFilterDropdownOpen(false);
          }
          if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
              setIsDateDropdownOpen(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef, dateDropdownRef]);

  // 1. Fetch Data
  const fetchData = async () => {
    setLoadingData(true);
    if (selectedClientId && selectedClientId !== 'all') {
        const allClients = await getClients();
        const found = allClients.find(c => c.id === selectedClientId);
        setCurrentClientData(found || null);
    } else {
        setCurrentClientData(null);
    }

    const campaignData = await getCampaigns(selectedClientId);
    setAllCampaigns(campaignData);
    setLoadingData(false);
    setAiInsight('');
  };

  useEffect(() => {
    fetchData();
  }, [selectedClientId]);

  // 2. Apply Filters & Recalculate
  useEffect(() => {
      let result = allCampaigns;

      if (statusFilter === 'ACTIVE') {
          result = result.filter(c => c.status === 'Active');
      }

      if (selectedCampaignIds.length > 0) {
          result = result.filter(c => selectedCampaignIds.includes(c.id));
      }

      setFilteredCampaigns(result);
      calculateAnalytics(result, analysisMode);

  }, [allCampaigns, statusFilter, selectedCampaignIds, analysisMode]);

  const handleDatePresetChange = async (preset: string) => {
      setDatePreset(preset);
      setIsDateDropdownOpen(false);
      
      if (!selectedClientId || selectedClientId === 'all') {
          alert("Selecione um cliente específico para usar o filtro de data (exige sincronização em tempo real).");
          setDatePreset('maximum');
          return;
      }

      // Trigger Sync
      setIsSyncing(true);
      const res = await syncMetaCampaigns(selectedClientId, preset);
      if (res.success) {
          await fetchData();
      } else {
          alert("Erro ao atualizar período: " + res.message);
      }
      setIsSyncing(false);
  }

  const calculateAnalytics = (data: Campaign[], mode: AnalysisMode) => {
    if (data.length === 0) {
        setKpis([]);
        setTopCampaign(null);
        setAlertCampaign(null);
        setFunnelData([]);
        return;
    }

    const totalSpend = data.reduce((acc, curr) => acc + curr.spend, 0);
    const totalRevenue = data.reduce((acc, curr) => acc + (curr.spend * curr.roas), 0);
    const totalClicks = data.reduce((acc, curr) => acc + curr.clicks, 0);
    const totalImpressions = data.reduce((acc, curr) => acc + curr.impressions, 0);
    
    // Novas Métricas de WhatsApp/Lead
    const totalConversations = data.reduce((acc, curr) => acc + (curr.conversations || 0), 0);
    const totalLeads = data.reduce((acc, curr) => acc + (curr.leads || 0), 0);
    const totalResults = totalConversations + totalLeads;
    
    // Médias
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    
    // Custo por Resultado (Conversa ou Lead)
    const avgCostPerResult = totalResults > 0 ? totalSpend / totalResults : 0;

    let kpiList: KPIData[] = [];
    let bestC: Campaign | null = null;
    let worstC: Campaign | null = null;

    // --- LÓGICA DE NEGÓCIO POR MODO ---
    
    if (mode === 'PERFORMANCE') {
        kpiList = [
            { label: 'Receita Gerada', value: `R$ ${totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`, change: `ROAS ${avgRoas.toFixed(2)}x`, trend: avgRoas > 4 ? 'up' : 'neutral', icon: 'DollarSign' },
            { label: 'Investimento', value: `R$ ${totalSpend.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`, change: 'Total', trend: 'neutral', icon: 'Wallet' },
            { label: 'ROAS Médio', value: `${avgRoas.toFixed(2)}x`, change: avgRoas > 3 ? 'Meta Batida' : 'Abaixo', trend: avgRoas > 3 ? 'up' : 'down', icon: 'TrendingUp' },
            { label: 'CPC Médio', value: `R$ ${avgCpc.toFixed(2)}`, change: 'Custo Tráfego', trend: avgCpc < 2 ? 'up' : 'down', icon: 'Target' },
        ];
        bestC = [...data].sort((a, b) => b.roas - a.roas)[0];
        const bigSpenders = data.filter(c => c.spend > (Math.max(...data.map(x=>x.spend)) * 0.1));
        worstC = bigSpenders.sort((a, b) => a.roas - b.roas)[0];
        if (worstC && worstC.roas >= 3) worstC = null;
    } 
    else if (mode === 'TRAFFIC') {
        kpiList = [
            { label: 'Total de Cliques', value: totalClicks.toLocaleString('pt-BR'), change: 'Volume', trend: 'up', icon: 'MousePointerClick' },
            { label: 'CTR Médio', value: `${avgCtr.toFixed(2)}%`, change: avgCtr > 1.5 ? 'Bom Interesse' : 'Baixo Interesse', trend: avgCtr > 1.5 ? 'up' : 'down', icon: 'Activity' },
            { label: 'Custo por Clique', value: `R$ ${avgCpc.toFixed(2)}`, change: 'Eficiência', trend: avgCpc < 1.0 ? 'up' : 'down', icon: 'Target' },
            { label: 'Investimento', value: `R$ ${totalSpend.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`, change: 'Total', trend: 'neutral', icon: 'Wallet' },
        ];
        const relevantTraffic = data.filter(c => c.clicks > 50);
        bestC = relevantTraffic.length > 0 ? [...relevantTraffic].sort((a, b) => b.ctr - a.ctr)[0] : data[0];
        const trafficSpenders = data.filter(c => c.spend > (Math.max(...data.map(x=>x.spend)) * 0.1));
        worstC = trafficSpenders.sort((a, b) => a.ctr - b.ctr)[0];
        if (worstC && worstC.ctr >= 1.0) worstC = null;
    } 
    else if (mode === 'BRANDING') {
        kpiList = [
            { label: 'Impressões', value: totalImpressions.toLocaleString('pt-BR'), change: 'Alcance Est.', trend: 'up', icon: 'Eye' },
            { label: 'CPM Médio', value: `R$ ${avgCpm.toFixed(2)}`, change: 'Custo p/ Mil', trend: avgCpm < 15 ? 'up' : 'down', icon: 'Megaphone' },
            { label: 'Cliques (Secundário)', value: totalClicks.toLocaleString('pt-BR'), change: `${avgCtr.toFixed(2)}% CTR`, trend: 'neutral', icon: 'MousePointerClick' },
            { label: 'Investimento', value: `R$ ${totalSpend.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`, change: 'Total', trend: 'neutral', icon: 'Wallet' },
        ];
        bestC = [...data].filter(c => c.impressions > 1000).sort((a, b) => ((a.spend/a.impressions) - (b.spend/b.impressions)))[0];
        worstC = data.filter(c => c.spend > 500).sort((a, b) => ((b.spend/b.impressions) - (a.spend/a.impressions)))[0];
        const worstCPM = worstC ? (worstC.spend / worstC.impressions) * 1000 : 0;
        if (worstCPM < 30) worstC = null;
    }
    else if (mode === 'WHATSAPP') {
        // Foco: Conversas, Leads, Custo por Resultado
        kpiList = [
            { label: 'Conversas/Leads', value: totalResults.toLocaleString('pt-BR'), change: `Whats: ${totalConversations}`, trend: 'up', icon: 'MessageCircle' },
            { label: 'Custo por Conversa', value: `R$ ${avgCostPerResult.toFixed(2)}`, change: 'Eficiência', trend: avgCostPerResult < 5 ? 'up' : 'down', icon: 'Target' },
            { label: 'Taxa de Conversão', value: `${(totalClicks > 0 ? (totalResults / totalClicks) * 100 : 0).toFixed(1)}%`, change: 'Clique -> Chat', trend: 'neutral', icon: 'Activity' },
            { label: 'Investimento', value: `R$ ${totalSpend.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`, change: 'Total', trend: 'neutral', icon: 'Wallet' },
        ];

        // Melhor: Menor Custo por Resultado (com volume mínimo)
        bestC = [...data]
            .filter(c => (c.conversations || 0) + (c.leads || 0) > 0)
            .sort((a, b) => {
                const costA = a.spend / ((a.conversations || 0) + (a.leads || 0));
                const costB = b.spend / ((b.conversations || 0) + (b.leads || 0));
                return costA - costB; // Menor custo primeiro
            })[0];
        
        // Alerta: Custo muito alto (> R$ 15 por conversa) ou gasto alto sem conversas
        const activeSpenders = data.filter(c => c.spend > 100);
        worstC = activeSpenders.sort((a, b) => {
            const resultsA = (a.conversations || 0) + (a.leads || 0);
            const resultsB = (b.conversations || 0) + (b.leads || 0);
            const costA = resultsA > 0 ? a.spend / resultsA : 9999;
            const costB = resultsB > 0 ? b.spend / resultsB : 9999;
            return costB - costA; // Maior custo primeiro
        })[0];
        
        // Só alerta se for realmente ruim
        if (worstC) {
            const res = (worstC.conversations || 0) + (worstC.leads || 0);
            const cost = res > 0 ? worstC.spend / res : worstC.spend;
            if (cost < 15 && res > 0) worstC = null;
        }
    }

    setKpis(kpiList);
    setTopCampaign(bestC || null);
    setAlertCampaign(worstC || null);

    // Funnel Data Genérico
    const top5BySpend = [...data].sort((a, b) => b.spend - a.spend).slice(0, 5);
    const processedFunnel = top5BySpend.map(c => ({
        name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
        metric1: c.impressions,
        metric2: mode === 'WHATSAPP' ? ((c.conversations || 0) + (c.leads || 0)) * 100 : c.clicks, // Escala visual para WhatsApp
    }));
    setFunnelData(processedFunnel);
  };

  const handleAskAI = async () => {
    setLoadingAi(true);
    // Passa o modo selecionado para a IA personalizar a resposta
    const insight = await analyzeCampaignPerformance(filteredCampaigns, analysisMode); 
    setAiInsight(insight);
    setLoadingAi(false);
  };

  const toggleCampaignSelection = (id: string) => {
      setSelectedCampaignIds(prev => 
          prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
      );
  };

  const clearFilters = () => {
      setSelectedCampaignIds([]);
      setStatusFilter('ALL');
  }

  // Custom Tooltip for Scatter Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-slate-800 mb-1">{data.name}</p>
          <p className="text-slate-500">
              {analysisMode === 'PERFORMANCE' && <>ROAS: <span className="font-bold text-emerald-600">{data.y.toFixed(2)}x</span></>}
              {analysisMode === 'TRAFFIC' && <>CTR: <span className="font-bold text-blue-600">{data.y.toFixed(2)}%</span></>}
              {analysisMode === 'BRANDING' && <>CPM: <span className="font-bold text-purple-600">R$ {data.y.toFixed(2)}</span></>}
              {analysisMode === 'WHATSAPP' && <>Custo/Conv: <span className="font-bold text-emerald-600">R$ {data.y.toFixed(2)}</span></>}
          </p>
          <p className="text-slate-500">Investimento: <span className="font-bold text-slate-700">R$ {data.x.toLocaleString()}</span></p>
          <p className="text-slate-500 mt-1 italic">{data.z}</p>
        </div>
      );
    }
    return null;
  };

  // --- DADOS PARA OS GRÁFICOS DE PIZZA (PIE CHARTS) ---
  
  // 1. Plataforma (Real)
  const platformData = [
      { name: 'Meta Ads', value: filteredCampaigns.filter(c => c.platform === 'Meta').reduce((acc, curr) => acc + curr.spend, 0) },
      { name: 'Google Ads', value: filteredCampaigns.filter(c => c.platform === 'Google').reduce((acc, curr) => acc + curr.spend, 0) },
      { name: 'TikTok Ads', value: filteredCampaigns.filter(c => c.platform === 'TikTok').reduce((acc, curr) => acc + curr.spend, 0) }
  ].filter(d => d.value > 0);

  // 2. Demografia Estimada (Mockados para visualização pois API não retorna breakdown simples)
  const ageData = [
      { name: '18-24', value: 20 },
      { name: '25-34', value: 45 },
      { name: '35-44', value: 25 },
      { name: '45+', value: 10 },
  ];

  const genderData = [
      { name: 'Mulheres', value: 58 },
      { name: 'Homens', value: 42 },
  ];

  if (loadingData) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-800">
            <Loader2 className="animate-spin mb-4 text-emerald-500" size={48} />
            <p className="text-slate-500 font-medium">Calibrando dashboard...</p>
        </div>
      );
  }

  if (allCampaigns.length === 0 && userRole !== 'TEAM' && !selectedClientId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center space-y-6 animate-in fade-in duration-700">
         <div className="bg-white/80 p-10 rounded-3xl border border-white shadow-xl max-w-lg backdrop-blur-xl relative overflow-hidden">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-100/50 blur-3xl rounded-full pointer-events-none"></div>
           <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Database size={28} className="text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Sem dados de campanha</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                   Selecione um cliente no menu superior ou conecte uma conta de anúncios.
                </p>
           </div>
        </div>
      </div>
    );
  }

  // Prepara dados para o Scatter Chart (Matriz de Eficiência) dinamicamente
  const scatterData = filteredCampaigns.map(c => {
      let yVal = 0;
      if (analysisMode === 'PERFORMANCE') yVal = c.roas;
      if (analysisMode === 'TRAFFIC') yVal = c.ctr;
      if (analysisMode === 'BRANDING') yVal = c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0;
      if (analysisMode === 'WHATSAPP') {
          const res = (c.conversations || 0) + (c.leads || 0);
          yVal = res > 0 ? c.spend / res : 0; // Custo por resultado
      }

      return {
        x: c.spend,
        y: yVal,
        z: c.status === 'Active' ? 'Ativa' : 'Pausada',
        name: c.name,
        status: c.status
      };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h2 className="text-3xl font-bold text-slate-800">Performance Geral</h2>
             <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">Live Data</span>
          </div>
          <p className="text-slate-500 text-sm">
            {selectedClientId && selectedClientId !== 'all' ? `Estratégia: ${currentClientData?.companyName || 'Cliente Selecionado'}` : 'Visão agregada de todos os clientes'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
            
            {/* DATE PRESET FILTER */}
            <div className="relative" ref={dateDropdownRef}>
                <button 
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  disabled={isSyncing || !selectedClientId || selectedClientId === 'all'}
                  className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm transition-all ${
                      isSyncing ? 'opacity-70 cursor-wait' : 'hover:border-slate-300'
                  } ${!selectedClientId || selectedClientId === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!selectedClientId || selectedClientId === 'all' ? "Selecione um cliente para filtrar datas" : "Filtrar Período"}
                >
                    {isSyncing ? <Loader2 size={16} className="animate-spin text-emerald-500" /> : <CalendarDays size={16} className="text-slate-500" />}
                    <span className="text-sm font-bold text-slate-700">
                        {DATE_PRESETS.find(p => p.value === datePreset)?.label || 'Período'}
                    </span>
                    <ChevronDown size={14} className="text-slate-400" />
                </button>

                {isDateDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        {DATE_PRESETS.map(preset => (
                            <button
                                key={preset.value}
                                onClick={() => handleDatePresetChange(preset.value)}
                                className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 flex justify-between items-center ${
                                    datePreset === preset.value ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-600'
                                }`}
                            >
                                {preset.label}
                                {datePreset === preset.value && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {currentClientData?.adAccountId && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-xs font-mono text-blue-700">
                    <Link2 size={12} />
                    <span>ID: {currentClientData.adAccountId}</span>
                </div>
            )}
            <button onClick={handleAskAI} disabled={loadingAi} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-slate-900/10 text-sm font-medium disabled:opacity-70">
                {loadingAi ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                {aiInsight ? 'Atualizar Análise IA' : 'Gerar Análise IA'}
            </button>
        </div>
      </div>

      {/* --- MODE SELECTOR (NOVO) --- */}
      <div className="flex justify-center md:justify-start overflow-x-auto pb-2">
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1 min-w-max">
              <button 
                onClick={() => setAnalysisMode('PERFORMANCE')}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                    analysisMode === 'PERFORMANCE' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                  <ShoppingBag size={14} /> Vendas
              </button>
              <div className="w-px h-4 bg-slate-200"></div>
              <button 
                onClick={() => setAnalysisMode('WHATSAPP')}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                    analysisMode === 'WHATSAPP' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                  <MessageCircle size={14} /> WhatsApp & Leads
              </button>
              <div className="w-px h-4 bg-slate-200"></div>
              <button 
                onClick={() => setAnalysisMode('TRAFFIC')}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                    analysisMode === 'TRAFFIC' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                  <MousePointerClick size={14} /> Tráfego
              </button>
              <div className="w-px h-4 bg-slate-200"></div>
              <button 
                onClick={() => setAnalysisMode('BRANDING')}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                    analysisMode === 'BRANDING' 
                    ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                  <Megaphone size={14} /> Branding
              </button>
          </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white/60 backdrop-blur-md border border-white/50 p-1.5 rounded-2xl flex flex-wrap gap-2 items-center justify-between shadow-sm z-30 relative">
          <div className="flex items-center gap-2 flex-wrap">
              {/* Status Toggle */}
              <div className="flex bg-slate-100/80 p-1 rounded-xl">
                  <button 
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${statusFilter === 'ACTIVE' ? 'bg-white text-emerald-600 shadow' : 'text-slate-400 hover:text-slate-600 shadow-none'}`}
                  >
                      Ativas
                  </button>
                  <button 
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow' : 'text-slate-400 hover:text-slate-600 shadow-none'}`}
                  >
                      Todas
                  </button>
              </div>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

              {/* Campaign Multi-Select */}
              <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedCampaignIds.length > 0 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                      <Filter size={14} />
                      <span className="max-w-[150px] truncate">
                          {selectedCampaignIds.length === 0 
                            ? "Filtrar Campanhas" 
                            : `${selectedCampaignIds.length} selecionada${selectedCampaignIds.length > 1 ? 's' : ''}`}
                      </span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isFilterDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 origin-top-left">
                          <div className="px-3 py-2 mb-1 flex justify-between items-center border-b border-slate-50">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selecionar Específicas</span>
                              {selectedCampaignIds.length > 0 && (
                                  <button onClick={() => setSelectedCampaignIds([])} className="text-[10px] text-rose-500 hover:text-rose-600 font-bold hover:underline">
                                      Limpar Seleção
                                  </button>
                              )}
                          </div>
                          <div className="max-h-80 overflow-y-auto custom-scrollbar p-1 space-y-1">
                              {allCampaigns.length === 0 ? (
                                  <div className="p-4 text-center text-xs text-slate-400">Nenhuma campanha encontrada.</div>
                              ) : (
                                  allCampaigns.map(c => (
                                      <button
                                        key={c.id}
                                        onClick={() => toggleCampaignSelection(c.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg flex items-start gap-3 transition-colors group ${
                                            selectedCampaignIds.includes(c.id) ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                                        }`}
                                      >
                                          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                              selectedCampaignIds.includes(c.id) 
                                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                                              : 'border-slate-300 bg-white group-hover:border-emerald-300'
                                          }`}>
                                              {selectedCampaignIds.includes(c.id) && <Check size={10} strokeWidth={4} />}
                                          </div>
                                          
                                          <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                  {/* Status Dot */}
                                                  <div 
                                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                        c.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 
                                                        c.status === 'Paused' ? 'bg-amber-400' : 'bg-slate-300'
                                                    }`} 
                                                  />
                                                  {/* REMOVIDO TRUNCATE AQUI PARA VER NOME COMPLETO */}
                                                  <p className={`text-xs font-bold leading-tight whitespace-normal ${selectedCampaignIds.includes(c.id) ? 'text-emerald-900' : 'text-slate-700'}`}>
                                                      {c.name}
                                                  </p>
                                              </div>
                                          </div>
                                      </button>
                                  ))
                              )}
                          </div>
                      </div>
                  )}
              </div>
          </div>
          {(selectedCampaignIds.length > 0 || statusFilter !== 'ACTIVE') && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-rose-500 px-3 py-2 transition-colors ml-auto md:ml-0">
                  <X size={12} /> Limpar
              </button>
          )}
      </div>

      {/* KPI Grid - Dinâmico */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <GlassCard key={index} className="p-4 flex items-center justify-between border-b-4 border-b-transparent hover:border-b-emerald-400 transition-all">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-slate-800">{kpi.value}</h3>
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                    kpi.trend === 'up' ? 'text-emerald-600' : kpi.trend === 'down' ? 'text-rose-500' : 'text-slate-400'
                }`}>
                    {kpi.trend === 'up' ? <ArrowUpRight size={12} /> : kpi.trend === 'down' ? <ArrowDownRight size={12} /> : <Activity size={12} />}
                    {kpi.change}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                  {index === 0 && (analysisMode === 'PERFORMANCE' ? <DollarSign size={20} /> : analysisMode === 'WHATSAPP' ? <MessageCircle size={20} /> : analysisMode === 'TRAFFIC' ? <MousePointerClick size={20} /> : <Eye size={20} />)}
                  {index === 1 && (analysisMode === 'PERFORMANCE' ? <TrendingUp size={20} /> : <Activity size={20} />)}
                  {index === 2 && <Target size={20} />}
                  {index === 3 && <Users size={20} />}
              </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Matriz de Eficiência (Scatter) - Dinâmico */}
        <div className="lg:col-span-2">
            <GlassCard title={`Matriz de Eficiência (${filteredCampaigns.length} itens)`} className="h-full min-h-[400px]">
                <div className="absolute top-6 right-6 flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Ótimo</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Regular</span>
                </div>
                
                <div className="h-[320px] w-full mt-4 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" debounce={200}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                            <XAxis type="number" dataKey="x" name="Investimento" unit="R$" tick={{fontSize: 10, fill: '#94a3b8'}} tickFormatter={(val) => `R$${val/1000}k`} />
                            <YAxis 
                                type="number" 
                                dataKey="y" 
                                name={analysisMode === 'PERFORMANCE' ? "ROAS" : analysisMode === 'WHATSAPP' ? "Custo/Result" : analysisMode === 'TRAFFIC' ? "CTR" : "CPM"} 
                                unit={analysisMode === 'PERFORMANCE' ? "x" : analysisMode === 'TRAFFIC' ? "%" : ""} 
                                tick={{fontSize: 10, fill: '#94a3b8'}} 
                            />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                            
                            <Scatter name="Campanhas" data={scatterData} fill="#8884d8">
                                {scatterData.map((entry, index) => {
                                    let color = '#cbd5e1'; // default slate
                                    if (analysisMode === 'PERFORMANCE') color = entry.y >= 3 ? '#10b981' : entry.y < 2 ? '#f43f5e' : '#f59e0b';
                                    if (analysisMode === 'TRAFFIC') color = entry.y >= 1.5 ? '#3b82f6' : '#cbd5e1';
                                    if (analysisMode === 'BRANDING') color = entry.y < 20 ? '#a855f7' : '#cbd5e1'; // CPM baixo é bom
                                    if (analysisMode === 'WHATSAPP') color = (entry.y > 0 && entry.y < 8) ? '#10b981' : (entry.y >= 15) ? '#f43f5e' : '#f59e0b'; // Custo baixo é bom
                                    
                                    return <Cell key={`cell-${index}`} fill={color} />;
                                })}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-slate-400 mt-2">
                    Eixo X: Investimento | Eixo Y: 
                    {analysisMode === 'PERFORMANCE' && <span className="text-emerald-600 font-bold ml-1">ROAS (Maior é melhor)</span>}
                    {analysisMode === 'TRAFFIC' && <span className="text-blue-600 font-bold ml-1">CTR (Maior é melhor)</span>}
                    {analysisMode === 'BRANDING' && <span className="text-purple-600 font-bold ml-1">CPM (Menor é melhor)</span>}
                    {analysisMode === 'WHATSAPP' && <span className="text-emerald-600 font-bold ml-1">Custo por Conversa (Menor é melhor)</span>}
                </p>
            </GlassCard>
        </div>

        {/* Campanhas em Destaque (Dinâmico) */}
        <div className="lg:col-span-1 space-y-6">
            {/* Top Performer */}
            <div className={`rounded-2xl p-6 text-white shadow-lg relative overflow-hidden bg-gradient-to-br ${
                analysisMode === 'PERFORMANCE' ? 'from-emerald-500 to-teal-600 shadow-emerald-500/20' :
                analysisMode === 'TRAFFIC' ? 'from-blue-500 to-indigo-600 shadow-blue-500/20' :
                analysisMode === 'WHATSAPP' ? 'from-emerald-600 to-green-700 shadow-emerald-500/20' :
                'from-purple-500 to-fuchsia-600 shadow-purple-500/20'
            }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Trophy size={12} /> Campeã ({analysisMode === 'PERFORMANCE' ? 'Vendas' : analysisMode === 'TRAFFIC' ? 'Cliques' : analysisMode === 'WHATSAPP' ? 'Leads' : 'Alcance'})
                        </p>
                        <h3 className="text-lg font-bold leading-tight line-clamp-2" title={topCampaign?.name}>
                            {topCampaign ? topCampaign.name : "N/A"}
                        </h3>
                    </div>
                </div>
                <div className="mt-6 flex gap-4 relative z-10">
                    <div>
                        <p className="text-white/70 text-[10px] uppercase">
                            {analysisMode === 'PERFORMANCE' ? 'ROAS' : analysisMode === 'TRAFFIC' ? 'CTR' : analysisMode === 'WHATSAPP' ? 'Custo/Conv' : 'CPM'}
                        </p>
                        <p className="text-2xl font-bold">
                            {analysisMode === 'PERFORMANCE' && `${topCampaign?.roas.toFixed(2)}x`}
                            {analysisMode === 'TRAFFIC' && `${topCampaign?.ctr.toFixed(2)}%`}
                            {analysisMode === 'BRANDING' && topCampaign && `R$ ${((topCampaign.spend / topCampaign.impressions) * 1000).toFixed(2)}`}
                            {analysisMode === 'WHATSAPP' && topCampaign && `R$ ${(topCampaign.spend / ((topCampaign.conversations||0) + (topCampaign.leads||0))).toFixed(2)}`}
                            {!topCampaign && '-'}
                        </p>
                    </div>
                    <div className="w-px bg-white/20"></div>
                    <div>
                        <p className="text-white/70 text-[10px] uppercase">
                            {analysisMode === 'PERFORMANCE' ? 'Receita' : analysisMode === 'WHATSAPP' ? 'Conversas' : 'Vol. Investido'}
                        </p>
                        <p className="text-2xl font-bold">
                             {analysisMode === 'PERFORMANCE' && topCampaign && `R$ ${(topCampaign.spend * topCampaign.roas).toLocaleString('pt-BR', { notation: "compact" })}`}
                             {analysisMode === 'WHATSAPP' && topCampaign && ((topCampaign.conversations||0) + (topCampaign.leads||0))}
                             {analysisMode !== 'PERFORMANCE' && analysisMode !== 'WHATSAPP' && topCampaign && `R$ ${(topCampaign.spend).toLocaleString('pt-BR', { notation: "compact" })}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Alert Campaign */}
            {alertCampaign && (
                <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-full blur-xl -mr-5 -mt-5"></div>
                    <div>
                        <p className="text-rose-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <AlertTriangle size={12} /> Atenção Necessária
                        </p>
                        <h3 className="text-slate-800 font-bold text-sm line-clamp-1" title={alertCampaign.name}>
                            {alertCampaign.name}
                        </h3>
                    </div>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        {analysisMode === 'PERFORMANCE' && `Consumiu R$ ${alertCampaign.spend.toLocaleString()} com ROAS de apenas ${alertCampaign.roas.toFixed(1)}x.`}
                        {analysisMode === 'TRAFFIC' && `Gasto alto mas CTR baixo de ${alertCampaign.ctr.toFixed(2)}%. Criativo saturado?`}
                        {analysisMode === 'BRANDING' && `CPM está muito caro (R$ ${((alertCampaign.spend/alertCampaign.impressions)*1000).toFixed(2)}). Público muito restrito?`}
                        {analysisMode === 'WHATSAPP' && `Custo por conversa muito alto! Verifique se o link do WhatsApp está correto.`}
                    </p>
                </div>
            )}

            {!alertCampaign && topCampaign && (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center h-[180px]">
                    <CheckCircle2 size={32} className="text-emerald-400 mb-3" />
                    <h3 className="font-bold text-slate-700">Otimização em dia</h3>
                    <p className="text-slate-400 text-xs mt-1">Nenhum desperdício crítico detectado para o objetivo de {analysisMode === 'WHATSAPP' ? 'conversão' : analysisMode.toLowerCase()}.</p>
                </div>
            )}
        </div>
      </div>

      {/* --- NOVA SEÇÃO: GRÁFICOS DE AUDIÊNCIA & PLATAFORMA --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Distribuição Plataforma */}
          <GlassCard title="Investimento por Plataforma" className="min-h-[250px] flex flex-col">
              <div className="flex-1 min-h-[180px]">
                {platformData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={platformData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {platformData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_PLATFORM[index % COLORS_PLATFORM.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString()}`} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                        <Activity size={24} className="mb-2 opacity-30" />
                        Sem dados de investimento.
                    </div>
                )}
              </div>
          </GlassCard>

          {/* Card 2: Perfil Idade */}
          <GlassCard title="Perfil Público (Idade Estimada)" className="min-h-[250px] flex flex-col">
               <div className="flex-1 min-h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={ageData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {ageData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_AGE[index % COLORS_AGE.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `${value}%`} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                        </PieChart>
                    </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-slate-400 text-center mt-1 italic">*Dados de referência de mercado</p>
          </GlassCard>

          {/* Card 3: Perfil Gênero */}
          <GlassCard title="Perfil Público (Gênero Estimado)" className="min-h-[250px] flex flex-col">
               <div className="flex-1 min-h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={genderData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {genderData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `${value}%`} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                        </PieChart>
                    </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-slate-400 text-center mt-1 italic">*Dados de referência de mercado</p>
          </GlassCard>
      </div>

      {/* AI Strategy & Funnel Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard title={`Estrategista IA: Foco em ${analysisMode === 'PERFORMANCE' ? 'Vendas' : analysisMode === 'TRAFFIC' ? 'Tráfego' : analysisMode === 'WHATSAPP' ? 'Conversão WhatsApp' : 'Branding'}`} className="flex flex-col min-h-[300px]">
              {aiInsight ? (
                  <div className="prose prose-sm prose-slate max-w-none animate-in fade-in">
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-sm leading-relaxed text-slate-700 shadow-inner max-h-[300px] overflow-y-auto custom-scrollbar">
                           <div dangerouslySetInnerHTML={{ __html: aiInsight }} />
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-60">
                      <Sparkles size={48} className="text-slate-300 mb-4" />
                      <h3 className="text-slate-800 font-bold mb-2">Solicitar Análise</h3>
                      <p className="text-slate-500 text-sm max-w-xs mx-auto">
                          Clique em "Gerar Análise IA" para receber dicas focadas no seu objetivo atual.
                      </p>
                  </div>
              )}
          </GlassCard>

          <GlassCard title="Comparativo de Volume (Top 5)" className="min-h-[300px]">
              <div className="h-[280px] w-full mt-2 min-w-0">
                 <ResponsiveContainer width="100%" height="100%" debounce={200}>
                    <BarChart data={funnelData} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                        <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                        <Bar dataKey="metric1" name="Impressões" stackId="a" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} />
                        <Bar 
                            dataKey="metric2" 
                            name={analysisMode === 'WHATSAPP' ? "Conversas (x100)" : "Cliques"} 
                            stackId="b" 
                            fill={analysisMode === 'PERFORMANCE' ? "#10b981" : analysisMode === 'WHATSAPP' ? "#059669" : "#3b82f6"} 
                            radius={[0, 4, 4, 0]} 
                            barSize={20} 
                        />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
          </GlassCard>
      </div>
    </div>
  );
};

const CheckCircle2 = ({size, className}: {size: number, className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

export default Dashboard;