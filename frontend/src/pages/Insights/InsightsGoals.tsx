import { motion, AnimatePresence } from 'framer-motion';
import { Target, Lightbulb, TrendingUp, Sparkles, CheckCircle2, Crosshair, Plus, Loader2, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useMemo } from 'react';
import { dashboardApi } from '../../utils/api';

export default function InsightsGoals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    icon: '🎯'
  });

  const [fundGoalId, setFundGoalId] = useState<number | null>(null);
  const [fundAmount, setFundAmount] = useState('');

  const fetchGoals = async () => {
    try {
      const res = await dashboardApi.getSavingsGoals();
      if (res.success) setGoals(res.data.goals);
    } catch (err) {
      console.error(err);
    }
  };

  // AI-Driven Icon Auto-Suggest
  useEffect(() => {
    const name = newGoal.name.toLowerCase();
    let suggestedIcon = newGoal.icon;
    
    // Vehicles
    if (name.includes('xe máy') || name.includes('moto') || name.includes('sh') || name.includes('honda')) suggestedIcon = '🏍️';
    else if (name.includes('ô tô') || name.includes('xe hơi') || name.includes('oto') || name.includes('car')) suggestedIcon = '🚗';
    else if (name.includes('máy bay') || name.includes('vé bay') || name.includes('du lịch') || name.includes('tour') || name.includes('chơi')) suggestedIcon = '✈️';
    // Real Estate
    else if (name.includes('nhà') || name.includes('chung cư') || name.includes('căn hộ') || name.includes('đất')) suggestedIcon = '🏠';
    // Tech
    else if (name.includes('laptop') || name.includes('macbook') || name.includes('máy tính') || name.includes('pc')) suggestedIcon = '💻';
    else if (name.includes('điện thoại') || name.includes('iphone') || name.includes('smartphone') || name.includes('ipad')) suggestedIcon = '📱';
    // Life events
    else if (name.includes('cưới') || name.includes('kết hôn') || name.includes('vợ') || name.includes('chồng') || name.includes('nhẫn')) suggestedIcon = '💍';
    else if (name.includes('con') || name.includes('bỉm') || name.includes('sữa') || name.includes('đẻ')) suggestedIcon = '👶';
    // Finance
    else if (name.includes('khẩn cấp') || name.includes('tiết kiệm') || name.includes('dự phòng') || name.includes('đầu tư') || name.includes('chứng khoán')) suggestedIcon = '🏦';
    // Education & Health
    else if (name.includes('học') || name.includes('ielts') || name.includes('toeic') || name.includes('sách') || name.includes('khóa')) suggestedIcon = '📚';
    else if (name.includes('sức khỏe') || name.includes('bảo hiểm') || name.includes('khám') || name.includes('viện')) suggestedIcon = '🏥';

    if (suggestedIcon !== newGoal.icon && newGoal.name.length > 2) {
      setNewGoal(prev => ({ ...prev, icon: suggestedIcon }));
    }
  }, [newGoal.name]);

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

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.deadline) return;
    
    setSubmitting(true);
    try {
      const res = await dashboardApi.createSavingsGoal({
        name: newGoal.name,
        targetAmount: Number(newGoal.targetAmount),
        deadline: newGoal.deadline,
        icon: newGoal.icon
      });
      if (res.success) {
        setShowGoalModal(false);
        setNewGoal({ name: '', targetAmount: '', deadline: '', icon: '🎯' });
        await fetchGoals(); // Refresh list
      }
    } catch (err) {
      console.error("Failed to create goal", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFundGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundGoalId || !fundAmount) return;
    
    setSubmitting(true);
    try {
      const res = await dashboardApi.fundSavingsGoal(fundGoalId, Number(fundAmount));
      if (res.success) {
        setFundGoalId(null);
        setFundAmount('');
        await fetchGoals(); // Refresh list
      }
    } catch (err) {
      console.error("Failed to fund goal", err);
    } finally {
      setSubmitting(false);
    }
  };

  // --- AI PROJECTION LOGIC (REAL DATA) ---
  const projectionData = useMemo(() => {
    if (!summary) return [];
    
    const data = [];
    const currentBalance = summary.totalBalance || 0;
    const monthlySavings = summary.netSavings || 0;
    
    // Tạo dự báo cho 6 tháng tới
    for (let i = 0; i <= 5; i++) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() + i);
      const monthLabel = `Tháng ${monthDate.getMonth() + 1}`;
      
      // Công thức: Số dư hiện tại + (Tiết kiệm hàng tháng * i)
      // Thêm một chút biến thiên AI (ví dụ: lãi suất giả định 0.5%/tháng) để đường cong mượt hơn
      const projectedWealth = currentBalance * Math.pow(1.005, i) + (monthlySavings * i);
      
      data.push({
        month: monthLabel,
        savings: Math.max(0, Math.round(projectedWealth)),
        isForecast: i > 0
      });
    }
    return data;
  }, [summary]);

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
          <p className="text-theme-text-muted">Dựa trên thu nhập thực tế <strong>{formatCurrency(summary?.totalIncome || 0)}đ</strong> tháng này.</p>
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
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-400 leading-relaxed font-bold">
                  🚀 Bùng nổ thu nhập!
                </p>
                <p className="text-xs text-theme-text-primary mt-1">
                  Tháng này bạn thu về {formatCurrency(summary?.totalIncome || 0)}đ, vượt xa dự tính. AI gợi ý bạn nên dành ngay <strong>{formatCurrency((summary?.netSavings || 0) * 0.7)}đ</strong> để tất toán các mục tiêu tiết kiệm.
                </p>
              </div>

              {goals.length > 0 ? (
                <div className="p-4 rounded-2xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)]">
                  <p className="text-sm text-theme-text-primary leading-relaxed">
                    Với đà thu nhập này, mục tiêu <strong>{goals[0].name}</strong> của bạn có thể hoàn thành chỉ trong vòng 1 tháng tới thay vì dự kiến!
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)]">
                  <p className="text-sm text-theme-text-primary leading-relaxed">
                    Bạn đang có thặng dư lớn. Hãy tạo ngay một **Mục tiêu mới** để AI giúp bạn tối ưu dòng tiền này.
                  </p>
                </div>
              )}
            </div>
            
          </div>
        </motion.div>

        {/* Goals & Charts Main Area */}
        <motion.div variants={itemVars} className="lg:col-span-8 space-y-8">
          
          {/* Chart Card */}
          <div className="glass-panel p-6 md:p-8 rounded-[2rem] border-[var(--theme-subtle-border)]">
            <h3 className="text-lg font-bold text-theme-text-primary mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> Dự báo Tăng trưởng Tài sản (Real-time)</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider">AI Forecast</span>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                  <YAxis 
                    width={70}
                    stroke="#6b7280" 
                    tick={{fill: '#6b7280', fontSize: 10}} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(value) => value >= 1000000 ? `${Math.round(value / 1000000)}Tr` : value} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--theme-bg-surface)', 
                      borderColor: 'var(--theme-border)', 
                      borderRadius: '1rem', 
                      color: 'var(--theme-text-primary)' 
                    }}
                    formatter={(value: any) => [`${formatCurrency(value)} đ`, 'Tổng Tài sản']}
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
              <button 
                onClick={() => setShowGoalModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--theme-subtle-bg)] hover:bg-[var(--theme-bg-surface)] border border-[var(--theme-subtle-border)] text-xs font-bold text-theme-text-primary transition-all"
              >
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
                      <span className="text-[10px] font-bold px-2 py-1 bg-[var(--theme-bg-surface)] text-theme-text-primary rounded-lg uppercase tracking-wider">
                        {goal.status === 'hoat_dong' ? 'Đang thực hiện' : goal.status === 'hoan_thanh' ? 'Đã hoàn thành' : 'Đã hủy'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mb-2 text-sm">
                      <div>
                        <span className="text-xs text-theme-text-muted block mb-0.5">Đã tích lũy</span>
                        <span className="font-bold text-emerald-400">{formatCurrency(goal.current_amount)} đ</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-theme-text-muted block mb-0.5">Mục tiêu</span>
                        <span className="font-bold text-theme-text-primary">{formatCurrency(goal.target_amount)} đ</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-[var(--theme-subtle-bg)] rounded-full overflow-hidden mb-3">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${goal.progress_percent}%` }} transition={{ duration: 1 }} className="h-full bg-indigo-500 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-[10px] text-theme-text-muted flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Deadline: {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                      </p>
                      {goal.status !== 'hoan_thanh' && (
                        <button 
                          onClick={() => setFundGoalId(goal.id)}
                          className="px-3 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Nạp tiền
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </motion.div>
      </div>

      {/* --- ADD GOAL MODAL --- */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowGoalModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[var(--theme-bg-surface)] border border-[var(--theme-subtle-border)] p-6 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-theme-text-primary">Thêm Mục tiêu mới</h3>
                <button 
                  onClick={() => setShowGoalModal(false)}
                  className="w-8 h-8 rounded-full bg-[var(--theme-subtle-bg)] flex items-center justify-center text-theme-text-muted hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-theme-text-muted mb-1.5 uppercase tracking-wider">Tên mục tiêu</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Mua xe máy mới, Quỹ khẩn cấp"
                    value={newGoal.name}
                    onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                    className="w-full bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] rounded-xl px-4 py-3 text-theme-text-primary focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-theme-text-muted mb-1.5 uppercase tracking-wider">Số tiền cần đạt (VNĐ)</label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 50000000"
                    value={newGoal.targetAmount}
                    onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})}
                    className="w-full bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] rounded-xl px-4 py-3 text-theme-text-primary focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-theme-text-muted mb-1.5 uppercase tracking-wider">Hạn chót</label>
                    <input
                      type="date"
                      required
                      value={newGoal.deadline}
                      onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                      className="w-full bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] rounded-xl px-4 py-3 text-theme-text-primary focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-theme-text-muted mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      Biểu tượng 
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md ml-1">AI Gợi ý</span>
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {['🎯', '🚗', '🏍️', '🏠', '💻', '📱', '✈️', '💍', '🏦', '📚', '🏥', '👶'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewGoal({...newGoal, icon: emoji})}
                          className={`w-full h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                            newGoal.icon === emoji 
                              ? 'bg-indigo-500/20 border border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                              : 'bg-[var(--theme-subtle-bg)] border border-transparent opacity-50 hover:opacity-100'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Tạo Mục tiêu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FUND GOAL MODAL --- */}
      <AnimatePresence>
        {fundGoalId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setFundGoalId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[var(--theme-bg-surface)] border border-[var(--theme-subtle-border)] p-6 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-theme-text-primary">Nạp tiền vào Mục tiêu</h3>
                <button 
                  onClick={() => setFundGoalId(null)}
                  className="w-8 h-8 rounded-full bg-[var(--theme-subtle-bg)] flex items-center justify-center text-theme-text-muted hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFundGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-theme-text-muted mb-1.5 uppercase tracking-wider">Số tiền nạp (VNĐ)</label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 5000000"
                    value={fundAmount}
                    onChange={e => setFundAmount(e.target.value)}
                    className="w-full bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] rounded-xl px-4 py-3 text-theme-text-primary focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                  {summary && (
                    <p className="text-xs text-theme-text-muted mt-2">
                      Thặng dư khả dụng tháng này: <strong className="text-emerald-400">{formatCurrency(summary.netSavings)} đ</strong>
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                    Xác nhận Nạp
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
