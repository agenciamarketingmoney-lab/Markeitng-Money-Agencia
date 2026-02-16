import React, { useState, useEffect } from 'react';
import { Save, Lock, Facebook, Key, Loader2, CheckCircle2, ShieldCheck, ExternalLink, HelpCircle, AlertTriangle, ChevronDown, ChevronUp, Zap, XCircle, Trash2, Database } from 'lucide-react';
import GlassCard from './GlassCard';
import { getSettings, saveSettings, validateMetaToken, resetDemoData } from '../services/firebaseService';

const Settings: React.FC = () => {
    const [metaToken, setMetaToken] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [resetting, setResetting] = useState(false);
    
    // Test States
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getSettings();
            setMetaToken(data.metaAdsToken || '');
            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            await saveSettings({
                metaAdsToken: metaToken,
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            alert("Erro ao salvar configurações.");
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!metaToken) return;
        setTestStatus('testing');
        setTestMessage('');
        
        const result = await validateMetaToken(metaToken);
        
        if (result.valid) {
            setTestStatus('success');
            setTestMessage(result.message);
        } else {
            setTestStatus('error');
            setTestMessage('Token inválido ou expirado. ' + result.message);
        }
    };

    const handleResetDemo = async () => {
        if (!confirm("Tem certeza? Isso APAGARÁ todas as campanhas e tarefas existentes e recriará os dados de exemplo. Use apenas para limpar o sistema.")) return;
        
        setResetting(true);
        const res = await resetDemoData();
        setResetting(false);
        
        if (res.success) {
            alert("Dados resetados com sucesso! O dashboard agora mostrará as métricas de WhatsApp.");
            window.location.reload();
        } else {
            alert("Erro ao resetar: " + res.message);
        }
    }

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

    const isValidFormat = metaToken.startsWith('EAA');

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-slate-900 rounded-xl text-white">
                    <Key size={24} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Configurações de API</h2>
                    <p className="text-slate-500 text-sm">Gerencie as conexões externas da agência.</p>
                </div>
            </div>

            <GlassCard title="Integração Meta Ads (Chave Mestra)">
                <form onSubmit={handleSave} className="space-y-6 mt-2">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-800 text-sm">
                        <Facebook size={20} className="flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">Como funciona a integração?</p>
                            <p className="opacity-80 leading-relaxed">
                                Você não precisa de um token por cliente. Insira aqui o <strong>Token de Usuário do Sistema</strong> (System User Token) do Gerenciador de Negócios da sua agência.
                                <br/><br/>
                                Este único token permitirá que o sistema leia dados de qualquer Conta de Anúncios que sua agência tenha permissão de acesso. O vínculo é feito pelo ID da Conta no perfil de cada cliente.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-emerald-600" />
                                Token de Acesso da Agência
                            </label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={metaToken}
                                    onChange={e => setMetaToken(e.target.value)}
                                    className={`w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border focus:outline-none text-slate-800 font-mono text-sm transition-all shadow-inner ${
                                        metaToken && !isValidFormat ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'
                                    }`}
                                    placeholder="EAAG..."
                                />
                                <Lock size={16} className="absolute right-4 top-3.5 text-slate-400" />
                            </div>
                            
                            {metaToken && !isValidFormat && (
                                <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-bold">
                                    <AlertTriangle size={10} /> O token geralmente começa com "EAA..." Verifique se copiou corretamente.
                                </p>
                            )}

                            {testStatus !== 'idle' && (
                                <div className={`mt-2 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                                    testStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                                    testStatus === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                    'bg-slate-50 text-slate-600'
                                }`}>
                                    {testStatus === 'testing' && <Loader2 size={12} className="animate-spin" />}
                                    {testStatus === 'success' && <CheckCircle2 size={12} />}
                                    {testStatus === 'error' && <AlertTriangle size={12} />}
                                    {testStatus === 'testing' ? 'Validando token...' : testMessage}
                                </div>
                            )}
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 gap-2">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowHelp(!showHelp)}
                                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold transition-colors bg-slate-100 px-2 py-1 rounded-md"
                                    >
                                        <HelpCircle size={12} /> {showHelp ? 'Ocultar Guia' : 'Não sabe como gerar?'} {showHelp ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
                                    </button>

                                    {metaToken && (
                                        <button
                                            type="button"
                                            onClick={handleTest}
                                            disabled={testStatus === 'testing'}
                                            className="text-[11px] text-amber-600 hover:text-amber-800 flex items-center gap-1 font-bold transition-colors bg-amber-50 px-2 py-1 rounded-md border border-amber-100"
                                        >
                                            <Zap size={12} /> Testar Conexão
                                        </button>
                                    )}
                                </div>

                                <a 
                                    href="https://business.facebook.com/settings/system-users" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-bold transition-colors"
                                >
                                    Ir para Facebook Business <ExternalLink size={10} />
                                </a>
                            </div>

                            {showHelp && (
                                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-3">
                                        <p className="font-bold text-slate-800 border-b border-slate-200 pb-2">Passo a Passo Rápido:</p>
                                        <ol className="list-decimal list-inside space-y-2 ml-1">
                                            <li>No Facebook, clique no botão <strong>"Gerar novo token"</strong>.</li>
                                            <li>Selecione o App "Conversions API Application".</li>
                                            <li className="text-amber-700 font-bold bg-amber-50 p-1 rounded border border-amber-100">
                                                IMPORTANTE: Marque as caixinhas <code className="mx-1 bg-white border border-slate-200 px-1 rounded text-slate-800">ads_read</code> e 
                                                <code className="mx-1 bg-white border border-slate-200 px-1 rounded text-slate-800">read_insights</code>.
                                            </li>
                                            <li>Role até o final e clique no botão azul "Gerar token".</li>
                                            <li>Copie o código longo que aparece e cole acima.</li>
                                        </ol>
                                    </div>

                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 space-y-2">
                                        <p className="font-bold flex items-center gap-2"><XCircle size={14}/> Deu erro "Nenhuma permissão disponível"?</p>
                                        <p>Isso acontece se você não deu controle total do App ao usuário.</p>
                                        <ul className="list-disc list-inside ml-2 opacity-80">
                                            <li>Feche a janela do erro.</li>
                                            <li>Na lista de "Apps atribuídos", clique no botão <strong>Gerenciar</strong> ao lado do App.</li>
                                            <li>Ative a chave <strong>"Gerenciar aplicativo"</strong> (ficar azul).</li>
                                            <li>Salve e tente gerar o token novamente.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                                success ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'
                            }`}
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} /> : <Save size={18} />}
                            {success ? 'Chave Mestra Salva!' : 'Salvar Configurações'}
                        </button>
                    </div>
                </form>
            </GlassCard>

            <GlassCard title="Zona de Perigo" className="border-t-4 border-t-red-500">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <Database size={24} />
                    </div>
                    <div>
                        <h4 className="text-slate-800 font-bold">Resetar Dados de Demo</h4>
                        <p className="text-sm text-slate-500 mt-1 mb-3">
                            Isso apagará todas as campanhas fictícias atuais e criará novas com as métricas de WhatsApp/Leads corrigidas.
                        </p>
                        <button 
                            onClick={handleResetDemo}
                            disabled={resetting}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {resetting ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />}
                            Resetar Banco de Dados
                        </button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

export default Settings;