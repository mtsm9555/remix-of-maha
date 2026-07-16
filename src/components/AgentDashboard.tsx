// src/components/AgentDashboard.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Megaphone, DollarSign, Palette, Settings, Search, Headphones, Wallet, Activity } from 'lucide-react';
import { mahaApi } from '../lib/mahaApi';

const DEPARTMENTS = [
  { id: 'development', name: 'Development', icon: Code, color: 'text-blue-400', border: 'border-blue-500/30' },
  { id: 'marketing', name: 'Marketing', icon: Megaphone, color: 'text-pink-400', border: 'border-pink-500/30' },
  { id: 'sales', name: 'Sales', icon: DollarSign, color: 'text-green-400', border: 'border-green-500/30' },
  { id: 'design', name: 'Design', icon: Palette, color: 'text-purple-400', border: 'border-purple-500/30' },
  { id: 'operations', name: 'Operations', icon: Settings, color: 'text-orange-400', border: 'border-orange-500/30' },
  { id: 'research', name: 'Research', icon: Search, color: 'text-cyan-400', border: 'border-cyan-500/30' },
  { id: 'support', name: 'Support', icon: Headphones, color: 'text-yellow-400', border: 'border-yellow-500/30' },
  { id: 'finance', name: 'Finance', icon: Wallet, color: 'text-emerald-400', border: 'border-emerald-500/30' },
];

export const AgentDashboard: React.FC = () => {
  const [agentStatuses, setAgentStatuses] = useState<any[]>([]);
  const [activeGoals, setActiveGoals] = useState<any[]>([]);

  useEffect(() => {
    // Poll for agent status
    const interval = setInterval(async () => {
      try {
        const statusRes = await mahaApi.getAgentStatus();
        setAgentStatuses(statusRes.agents || []);
        
        const goalsRes = await mahaApi.getGoals();
        setActiveGoals(goalsRes.goals || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Department Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DEPARTMENTS.map((dept, index) => {
          const Icon = dept.icon;
          const agentsInDept = agentStatuses.filter(a => a.department === dept.id);
          const activeCount = agentsInDept.filter(a => a.status === 'working').length;
          
          return (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-slate-900/50 backdrop-blur border ${dept.border} rounded-xl p-4 hover:bg-slate-800/50 transition-all cursor-pointer group`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-6 h-6 ${dept.color} group-hover:scale-110 transition-transform`} />
                {activeCount > 0 && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </div>
              <h3 className="text-slate-200 font-medium text-sm">{dept.name}</h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                {agentsInDept.length} agents • {activeCount} active
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Active Goals / Planning Engine */}
      <div className="bg-slate-900/50 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-cyan-400 font-mono text-sm tracking-wider uppercase">Autonomous Execution Queue</h3>
        </div>
        
        {activeGoals.length === 0 ? (
          <p className="text-slate-500 text-sm font-mono">No active goals. System idle.</p>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-slate-200 text-sm font-medium">{goal.description}</p>
                  <span className={`text-xs px-2 py-1 rounded font-mono ${
                    goal.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    goal.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-cyan-500/20 text-cyan-400 animate-pulse'
                  }`}>
                    {goal.status.toUpperCase()}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress || 0}%` }}
                    className="bg-cyan-400 h-1.5 rounded-full shadow-[0_0_10px_#22d3ee]"
                  />
                </div>
                
                {/* Subtasks */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {goal.subtasks?.map((task: any) => (
                    <span key={task.id} className={`text-[10px] px-2 py-1 rounded border font-mono ${
                      task.status === 'completed' ? 'border-green-500/30 text-green-400' :
                      task.status === 'in_progress' ? 'border-cyan-500/30 text-cyan-400' :
                      'border-slate-700 text-slate-500'
                    }`}>
                      {task.assignedAgentName || task.description.substring(0, 20)}...
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};