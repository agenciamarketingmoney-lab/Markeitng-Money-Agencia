import { GoogleGenAI } from "@google/genai";
import { Campaign } from "../types";

const apiKey = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;
try {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
    }
} catch (error) {
    console.error("Failed to initialize GoogleGenAI", error);
}

export const analyzeCampaignPerformance = async (campaigns: Campaign[], analysisMode: string = 'PERFORMANCE'): Promise<string> => {
    if (!ai) return "API Key não configurada. Impossível gerar insights.";

    // Prepara dados mais ricos para a IA, incluindo métricas novas
    const campaignDataStr = JSON.stringify(campaigns.map(c => ({
        name: c.name,
        spend: c.spend,
        roas: c.roas,
        ctr: c.ctr,
        cpc: c.cpc,
        conversations: c.conversations || 0,
        leads: c.leads || 0,
        costPerConversation: (c.conversations && c.conversations > 0) ? (c.spend / c.conversations).toFixed(2) : "N/A",
        clicks: c.clicks,
        platform: c.platform
    })));

    // Personaliza a instrução baseada no modo
    let modeInstruction = "";
    if (analysisMode === 'PERFORMANCE') {
        modeInstruction = "O foco da análise é ROAS (Retorno sobre Investimento) e Venda Direta. Ignore métricas de vaidade.";
    } else if (analysisMode === 'TRAFFIC') {
        modeInstruction = "O foco da análise é CTR, CPC e Volume de Cliques. Avalie a atratividade dos anúncios.";
    } else if (analysisMode === 'BRANDING') {
        modeInstruction = "O foco da análise é Alcance, Impressões e CPM. O objetivo é visibilidade de marca.";
    } else if (analysisMode === 'WHATSAPP') {
        modeInstruction = "O foco CRÍTICO é GERAÇÃO DE LEADS e CONVERSAS NO WHATSAPP. Ignore o ROAS. Analise o 'Custo por Conversa' e a taxa de conversão de cliques para conversas.";
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Você é um Diretor de Performance Sênior (Media Buyer) da agência 'Marketing Money'. 
            
            ${modeInstruction}
            
            DADOS DAS CAMPANHAS (JSON):
            ${campaignDataStr}
            
            Gere um relatório em HTML BÁSICO (use apenas tags <b>, <br>, <ul>, <li>, <p>) com a seguinte estrutura estrita:

            1. <p><b>🔍 Diagnóstico (${analysisMode}):</b></p>
               Resuma o desempenho focado APENAS no objetivo selecionado. Diga se estamos eficientes.

            2. <p><b>⚔️ Oportunidades & Cortes:</b></p>
               Cite nominalmente qual campanha escalar e qual pausar baseada no custo por resultado do objetivo atual.

            3. <p><b>💡 Ação Estratégica:</b></p>
               Dê uma instrução tática curta. Exemplo: "O custo por conversa está alto (R$ 15), mude a oferta no criativo."

            Mantenha o tom profissional e direto.`,
        });

        return response.text || "Não foi possível gerar insights no momento.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Erro ao conectar com a inteligência artificial. Tente novamente mais tarde.";
    }
};
