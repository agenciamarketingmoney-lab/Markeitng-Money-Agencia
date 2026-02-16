
import { Campaign, Task, TaskStatus, KPIData, ChartData } from './types';

export const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Verão 2024 - Conversão', status: 'Active', spend: 12500, impressions: 450000, clicks: 8500, ctr: 1.89, cpc: 1.47, roas: 4.2, conversations: 1240, leads: 50, platform: 'Meta' },
  { id: '2', name: 'Branding Institucional', status: 'Active', spend: 4200, impressions: 800000, clicks: 3200, ctr: 0.4, cpc: 1.31, roas: 1.5, conversations: 80, leads: 10, platform: 'Meta' },
  { id: '3', name: 'Promoção Flash Weekend', status: 'Paused', spend: 1500, impressions: 120000, clicks: 4000, ctr: 3.33, cpc: 0.37, roas: 8.5, conversations: 850, leads: 20, platform: 'Meta' },
  { id: '4', name: 'Remarketing Carrinho', status: 'Active', spend: 3100, impressions: 90000, clicks: 2100, ctr: 2.33, cpc: 1.48, roas: 6.1, conversations: 400, leads: 150, platform: 'Meta' },
  { id: '5', name: 'Lead Gen - Ebook', status: 'Completed', spend: 5000, impressions: 200000, clicks: 5000, ctr: 2.5, cpc: 1.00, roas: 2.1, conversations: 50, leads: 2100, platform: 'Meta' },
];

export const MOCK_TASKS: Task[] = [
  { id: '101', title: 'Criar criativos Campanha Black Friday', assignee: 'Ana Designer', status: TaskStatus.IN_PROGRESS, priority: 'High', dueDate: '2024-05-20', tags: ['Design', 'Meta'] },
  { id: '102', title: 'Configurar Pixel Conversão Site', assignee: 'Dev Team', status: TaskStatus.TODO, priority: 'High', dueDate: '2024-05-22', tags: ['Tech', 'Tracking'] },
  { id: '103', title: 'Aprovar Copy Institucional', assignee: 'Carlos Copy', status: TaskStatus.REVIEW, priority: 'Medium', dueDate: '2024-05-18', tags: ['Copywriting'] },
  { id: '104', title: 'Relatório Mensal Abril', assignee: 'Luiza Account', status: TaskStatus.DONE, priority: 'Medium', dueDate: '2024-05-05', tags: ['Relatório'] },
  { id: '105', title: 'Planejamento Q3', assignee: 'João Strat', status: TaskStatus.TODO, priority: 'Low', dueDate: '2024-06-01', tags: ['Strategy'] },
];

export const MOCK_KPIS: KPIData[] = [
  { label: 'Investimento Total', value: 'R$ 26.300', change: '+12%', trend: 'up', icon: 'DollarSign' },
  { label: 'Receita Gerada', value: 'R$ 142.050', change: '+24%', trend: 'up', icon: 'TrendingUp' },
  { label: 'ROAS Médio', value: '5.4x', change: '+5%', trend: 'up', icon: 'Target' },
  { label: 'Leads Qualificados', value: '342', change: '-2%', trend: 'down', icon: 'Users' },
];

export const MOCK_CHART_DATA: ChartData[] = [
  { name: 'Seg', spend: 4000, revenue: 24000 },
  { name: 'Ter', spend: 3000, revenue: 13980 },
  { name: 'Qua', spend: 2000, revenue: 9800 },
  { name: 'Qui', spend: 2780, revenue: 39080 },
  { name: 'Sex', spend: 1890, revenue: 4800 },
  { name: 'Sab', spend: 2390, revenue: 3800 },
  { name: 'Dom', spend: 3490, revenue: 4300 },
];
