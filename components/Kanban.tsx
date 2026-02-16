import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Calendar, ArrowRight, ArrowLeft, Loader2, Users } from 'lucide-react';
import GlassCard from './GlassCard';
import { Task, TaskStatus, UserProfile } from '../types';
import { getTasks, updateTaskStatus, addTask } from '../services/firebaseService';

interface KanbanProps {
    selectedClientId?: string;
    clients: UserProfile[];
}

const Kanban: React.FC<KanbanProps> = ({ selectedClientId, clients }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      fetchTasks();
  }, [selectedClientId]);

  const fetchTasks = async () => {
      setLoading(true);
      const data = await getTasks(selectedClientId);
      setTasks(data);
      setLoading(false);
  }

  const handleNewTask = async () => {
      let targetClientId = selectedClientId;
      
      if (!targetClientId || targetClientId === 'all') {
         if (clients.length === 0) {
             alert("Necessário cadastrar clientes antes de criar tarefas.");
             return;
         }
         const clientNames = clients.map((c, i) => `${i + 1}. ${c.companyName || c.name}`).join('\n');
         const selection = prompt(`Vincular tarefa a qual cliente?\nDigite o NÚMERO:\n\n${clientNames}`);
         
         const index = Number(selection) - 1;
         if (isNaN(index) || index < 0 || index >= clients.length) return;
         targetClientId = clients[index].id;
      }

      const title = prompt("Título da Tarefa:");
      if (!title) return;
      
      const assignee = prompt("Responsável:", "Eu");
      
      const newTask: Omit<Task, 'id'> = {
          title,
          clientId: targetClientId,
          assignee: assignee || "Equipe",
          status: TaskStatus.TODO,
          priority: 'Medium',
          dueDate: new Date().toISOString(),
          tags: ['Geral']
      };

      try {
          await addTask(newTask);
          fetchTasks();
      } catch (e) {
          alert("Erro ao criar tarefa. Verifique o console.");
      }
  }

  const handleMoveTask = async (taskId: string, direction: 'next' | 'prev', currentStatus: TaskStatus) => {
    const statusOrder = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= statusOrder.length) newIndex = statusOrder.length - 1;
    
    const newStatus = statusOrder[newIndex];

    if (newStatus !== currentStatus) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        await updateTaskStatus(taskId, newStatus);
    }
  };

  const getClientInitials = (id?: string) => {
      if (!id) return '?';
      const c = clients.find(client => client.id === id);
      const name = c ? (c.companyName || c.name) : '?';
      return name.substring(0, 2).toUpperCase();
  }

  const Column = ({ title, status, color, borderColor }: { title: string, status: TaskStatus, color: string, borderColor: string }) => {
    const columnTasks = tasks.filter(t => t.status === status);

    return (
      <div className="flex flex-col h-full min-w-[300px]">
        <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${borderColor}`}>
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            {title}
            <span className="bg-slate-200 text-xs px-2 py-0.5 rounded-full text-slate-600 font-semibold">{columnTasks.length}</span>
          </h3>
          <button onClick={handleNewTask} className="text-slate-400 hover:text-emerald-600 transition-colors">
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar pb-20">
          {columnTasks.map(task => (
            <div key={task.id} className="group relative bg-white border border-slate-100 p-4 rounded-xl hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
                  task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {task.priority}
                </span>
                
                {/* Client Badge */}
                <div title="Cliente Vinculado" className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold">
                    {getClientInitials(task.clientId)}
                </div>
              </div>
              
              <h4 className="text-slate-800 font-semibold text-sm mb-3 leading-snug">{task.title}</h4>
              
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {task.tags.map(tag => (
                  <span key={tag} className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] text-slate-700 font-bold border border-white">
                    {task.assignee.charAt(0)}
                  </div>
                  <div className="flex items-center text-xs text-slate-400 font-medium">
                    <Calendar size={12} className="mr-1" />
                    {new Date(task.dueDate).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                  </div>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => handleMoveTask(task.id, 'prev', task.status)}
                    disabled={status === TaskStatus.TODO}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-0"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <button 
                    onClick={() => handleMoveTask(task.id, 'next', task.status)}
                    disabled={status === TaskStatus.DONE}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-0"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
      return (
          <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
      )
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Fluxo de Projetos</h2>
            <p className="text-slate-500 text-sm mt-1">
                {selectedClientId && selectedClientId !== 'all' ? 'Filtro Ativo: Cliente Específico' : 'Visão Geral da Agência'}
            </p>
        </div>
        <button 
            onClick={handleNewTask}
            className="flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg hover:shadow-emerald-500/20"
        >
          <Plus size={18} /> Novo Cartão
        </button>
      </div>

      <GlassCard className="flex-1 overflow-x-auto bg-slate-50/50">
        <div className="flex gap-6 h-full min-w-max pb-4">
          <Column title="A Fazer" status={TaskStatus.TODO} color="text-slate-500" borderColor="border-slate-300" />
          <Column title="Em Progresso" status={TaskStatus.IN_PROGRESS} color="text-blue-500" borderColor="border-blue-400" />
          <Column title="Revisão" status={TaskStatus.REVIEW} color="text-amber-500" borderColor="border-amber-400" />
          <Column title="Concluído" status={TaskStatus.DONE} color="text-emerald-500" borderColor="border-emerald-500" />
        </div>
      </GlassCard>
    </div>
  );
};

export default Kanban;