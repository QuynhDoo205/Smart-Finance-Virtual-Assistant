import { motion } from 'framer-motion';
import { Target, Lightbulb, TrendingUp, Sparkles, CheckCircle2, Crosshair, Plus, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { dashboardApi } from '../../utils/api';

const MOCK_TREND = [
  { month: 'T1', savings: 0 },
  { month: 'T2', savings: 0 },
  { month: 'T3', savings: 0 },
  { month: 'T4', savings: 0 },
  { month: 'T5', savings: 0 },
  { month: 'T6', savings: 0 },
];

export default function InsightsGoals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [goalsRes, summaryRes] = await Promise.all([
          dashboardApi.getSavingsGoals(),
          dashboardApi.getSummary()
        ]);
        if (goalsRes.success) setGoals(goalsRes.data.goals);
        if (summaryRes.success) setSummary(summaryRes.data);
      } catch (err) {
        console.error("Failed to load insights:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-theme-text-primary mb-2 flex items-center gap-3">
            Phân tích & Mục tiêu <Sparkles className="w-6 h-6 text-indigo-400" />
          </h1>
          <p className="text-theme-text-muted">AI dự báo dòng tiền và theo dõi tiến độ các mục tiêu lớn của bạn.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* AI Insights Sidebar */}
        <motion.div variants={itemVars} className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-[2rem] border-indigo-500/20 relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-xl font-bold text-theme-text-primary mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-indigo-400" />
              Insight từ Nova AI
            </h3>
            
            <div className="space-y-4">
              {goals.length > 0 ? (
                <div className="p-4 rounded-2xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)]">
                  <p className="text-sm text-theme-text-primary leading-relaxed">
                    Bạn đang tiến gần đến mục tiêu <strong>{goals[0].name}</strong>. Với tốc độ hiện tại, bạn sẽ hoàn thành trong khoảng {(goals[0].target_amount - goals[0].current_amount) / (summary?.netSavings || 1000000) > 0 ? Math.ceil((goals[0].target_amount - goals[0].current_amount) / (summary?.netSavings || 1000000)) : 1} tháng tới! 🚀
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)]">
                  <p className="text-sm text-theme-text-primary leading-relaxed">
                    Bạn chưa có mục tiêu tiết kiệm nào. AI gợi ý bạn nên bắt đầu với một <strong>Quỹ dự phòng khẩn cấp</strong> (thường bằng 3-6 tháng chi tiêu).
                  </p>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] text-theme-text-muted text-sm leading-relaxed">
                Hệ thống đang phân tích thói quen của bạn. Càng nhập nhiều giao dịch, AI sẽ càng đưa ra các lời khuyên chính xác hơn.
              </div>
            </div>
            
          </div>
        </motion.div>

        {/* Goals & Charts Main Area */}
        <motion.div variants={itemVars} className="lg:col-span-8 space-y-8">
          
          {/* Chart Card */}
          <div className="glass-panel p-6 md:p-8 rounded-[2rem] border-[var(--theme-subtle-border)]">
            <h3 className="text-lg font-bold text-theme-text-primary mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> Dự báo Tăng trưởng Tài sản</span>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_TREND} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                  <YAxis 
                    width={50}
                    stroke="#6b7280" 
                    tick={{fill: '#6b7280', fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(value) => `${value / 1000000}Tr`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--theme-bg-surface)', 
                      borderColor: 'var(--theme-border)', 
                      borderRadius: '1rem', 
                      color: 'var(--theme-text-primary)' 
                    }}
                    formatter={(value: any) => [`${formatCurrency(value)} đ`, 'Tài sản']}
                  />
                  <Area type="monotone" dataKey="savings" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Goals list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-theme-text-primary flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-400" /> Tiến độ Mục tiêu
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--theme-subtle-bg)] hover:bg-[var(--theme-bg-surface)] border border-[var(--theme-subtle-border)] text-xs font-bold text-theme-text-primary transition-all">
                <Plus className="w-4 h-4" /> Thêm mục tiêu
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.length === 0 ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-[var(--theme-subtle-border)] rounded-3xl text-center">
                  <Target className="w-12 h-12 text-theme-text-muted mb-4 opacity-20" />
                  <p className="text-theme-text-muted font-bold">Chưa có mục tiêu nào được thiết lập</p>
                  <p className="text-xs text-theme-text-muted/60 mt-1 max-w-xs">Đặt mục tiêu cho những dự định lớn của bạn để Nova AI giúp bạn theo dõi.</p>
                </div>
              ) : (
                goals.map((goal) => (
                  <div key={goal.id} className="glass-panel p-6 rounded-2xl border-[var(--theme-subtle-border)] group hover:border-indigo-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">
                          {goal.icon || '🎯'}
                        </div>
                        <h4 className="font-bold text-theme-text-primary group-hover:text-indigo-400 transition-colors">{goal.name}</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 bg-[var(--theme-bg-surface)] text-theme-text-primary rounded-lg uppercase tracking-wider">{goal.status}</span>
                    </div>
                    <div className="flex justify-between items-end mb-2 text-sm">
                      <span className="font-bold text-theme-text-primary">{formatCurrency(goal.current_amount)} đ</span>
                      <span className="text-theme-text-muted">/ {formatCurrency(goal.target_amount)} đ</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--theme-subtle-bg)] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${goal.progress_percent}%` }} transition={{ duration: 1 }} className="h-full bg-indigo-500 rounded-full" />
                    </div>
                    <p className="text-[10px] text-theme-text-muted mt-3 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Deadline: {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
}
