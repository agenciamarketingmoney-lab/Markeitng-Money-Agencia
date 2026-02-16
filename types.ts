
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  KANBAN = 'KANBAN',
  CAMPAIGNS = 'CAMPAIGNS',
  CLIENT_AREA = 'CLIENT_AREA',
  ADMIN_USERS = 'ADMIN_USERS',
  SETTINGS = 'SETTINGS'
}

export type UserRole = 'ADMIN' | 'TEAM' | 'CLIENT' | null;

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  companyName?: string; 
  adAccountId?: string; // ID da conta de anúncios externa (ex: act_123456)
}

export interface BreakdownData {
    [key: string]: number; // ex: "18-24": 1500 (impressions or spend)
}

export interface Campaign {
  id: string;
  clientId?: string;
  externalId?: string; // ID da campanha no Meta Ads para evitar duplicatas
  name: string;
  status: 'Active' | 'Paused' | 'Completed';
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  roas: number;
  conversations?: number; // Novas conversas de mensagem
  leads?: number; // Cadastros
  platform: 'Meta' | 'Google' | 'TikTok';
  
  // Dados Reais de Breakdown
  ageBreakdown?: BreakdownData; 
  genderBreakdown?: BreakdownData;
  platformBreakdown?: BreakdownData;
}

export enum TaskStatus {
  TODO = 'A Fazer',
  IN_PROGRESS = 'Em Progresso',
  REVIEW = 'Revisão',
  DONE = 'Concluído'
}

export interface Task {
  id: string;
  clientId?: string;
  title: string;
  assignee: string;
  status: TaskStatus;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  tags: string[];
}

export interface KPIData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface ChartData {
  name: string;
  spend: number;
  revenue: number;
}

export interface AppSettings {
    metaAdsToken: string;
    googleAdsKey?: string;
}