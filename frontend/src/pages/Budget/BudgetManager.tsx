import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, RefreshCw, Sparkles, Info, HelpCircle, Target, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import LinkedSliders, { type Jar } from './components/LinkedSliders';
import { dashboardApi, authApi, transactionsApi } from '../../utils/api';

const INIT_JARS: Jar[] = [
  { id:'1', name:'Thiết yếu',  emoji:'🛒', percentage:40, locked:false, color:'#0EA5E9', neonColor:'#22d3ee', description:'Ăn uống, đi lại, hóa đơn' },
  { id:'2', name:'Tiết kiệm',  emoji:'🏦', percentage:30, locked:false, color:'#10B981', neonColor:'#10b981', description:'Quỹ khẩn cấp & tích lũy' },
  { id:'3', name:'Phát triển', emoji:'📚', percentage:10, locked:false, color:'#8B5CF6', neonColor:'#a855f7', description:'Học tập, sách, kỹ năng' },
  { id:'4', name:'Hưởng thụ',  emoji:'🎮', percentage:10, locked:false, color:'#F59E0B', neonColor:'#fbbf24', description:'Giải trí, sở thích' },
  { id:'5', name:'Đầu tư',     emoji:'📈', percentage:10, locked:false, color:'#EC4899', neonColor:'#ff00c8', description:'Tài sản, kinh doanh' },
];

const fmtVND = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

export default function BudgetManager() {
  const [income, setIncome] = useState(0);
  const [jars, setJars] = useState<Jar[]>(INIT_JARS);
  const [fixedExpenses, setFixedExpenses] = useState<{name: string, emoji: string, amount: number}[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, transRes, dashRes, dashBudgetRes] = await Promise.all([
          authApi.me(),
          transactionsApi.list(50),
          dashboardApi.getSummary(),
          dashboardApi.getBudget()
        ]);
        
        let detectedIncome = profileRes.success ? (profileRes.data.user.monthly_income || 0) : 0;
        
        if (detectedIncome === 0 && dashRes.success) {
          detectedIncome = dashRes.data.totalIncome;
        }

        if (detectedIncome === 0 && transRes.success) {
          const incomes = transRes.data.transactions.filter((t: any) => t.type === 'income' || t.loai_giao_dich === 'thu_nhap');
          if (incomes.length > 0) detectedIncome = Number(incomes[0].amount);
        }
        
        setIncome(detectedIncome);

        if (dashBudgetRes.success) {
          const actualBudgets = dashBudgetRes.data.budgets;
          const mappedFixed = actualBudgets
            .filter((b: any) => b.limit_amount > 0)
            .map((b: any) => ({
              name: b.category_name,
              emoji: b.category_icon || '💰',
              amount: parseFloat(b.limit_amount)
            }));
          
          setFixedExpenses(mappedFixed);
        }
      } catch (err) {
        console.error('Failed to load budget data:', err);
      }
    };
    loadData();
  }, []);

  const totalFixed = fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const available = Math.max(0, income - totalFixed);
  const unallocated = 100 - jars.reduce((s, j) => s + j.percentage, 0);

  const handleAI = async () => {
    setAiLoading(true);
    try {
      const res = await dashboardApi.suggestJars();
      if (res.success) {
        setJars(res.data.jars.map((s: any, i: number) => ({ ...jars[i], percentage: s.percentage })));
      }
    } catch {
      // Fallback if AI fails
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    const categoryMapping: Record<string, number> = { '1': 4, '2': 3, '3': 9, '4': 7, '5': 8 };
    const budgetsToSave = jars
      .filter(j => categoryMapping[j.id])
      .map(j => ({
        categoryId: categoryMapping[j.id],
        limit: Math.round(available * (j.percentage / 100))
      }));

    try {
      const res = await dashboardApi.setupBudget(budgetsToSave);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // Error handling
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-theme-text-primary tracking-tight">Thiết lập Ngân sách</h1>
          <p className="text-xs text-theme-text-muted mt-1 font-medium">Lên kế hoạch chi tiêu thông minh theo quy tắc 6 lọ.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGuide(!showGuide)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-theme-text-muted hover:bg-white/10 transition-all">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={handleAI} 
            disabled={aiLoading} 
            className="px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 text-xs font-black uppercase tracking-widest hover:bg-primary-500/20 transition-all flex items-center gap-2"
          >
            {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
            AI Gợi ý
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showGuide && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 shadow-xl mb-6 relative group">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    Chào bạn, hãy để Nova giúp bạn lập kế hoạch!
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <div className="text-indigo-400 font-black text-[9px] uppercase tracking-widest">Bước 1: Thu nhập</div>
                      <p className="text-[11px] text-theme-text-muted leading-relaxed">Nova lấy thu nhập thực tế của bạn và trừ đi các chi phí cố định (nhà, điện...).</p>
                    </div>
                    <div className="space-y-1">
                      <div className="text-indigo-400 font-black text-[9px] uppercase tracking-widest">Bước 2: Chia lọ</div>
                      <p className="text-[11px] text-theme-text-muted leading-relaxed">Dùng thanh trượt bên phải để chia % cho từng mục tiêu (Ăn uống, Tiết kiệm...).</p>
                    </div>
                    <div className="space-y-1">
                      <div className="text-indigo-400 font-black text-[9px] uppercase tracking-widest">Bước 3: Lưu lại</div>
                      <p className="text-[11px] text-theme-text-muted leading-relaxed">Nhấn <span className="text-white font-bold">Lưu</span> để hệ thống theo dõi giúp bạn trên Dashboard.</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowGuide(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-theme-text-muted" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted mb-1">Ngân sách khả dụng</p>
            <h2 className="text-3xl font-black text-emerald-400 tracking-tighter">{fmtVND(available)}</h2>
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-theme-text-muted">Tổng thu nhập:</span>
                <span className="text-theme-text-primary">{fmtVND(income)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-theme-text-muted">Phí cố định:</span>
                <span className="text-rose-400">-{fmtVND(totalFixed)}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-text-primary flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-primary-400" /> Chi tiết cố định
              </h3>
              <Link to="/app/profile?tab=expenses" className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 uppercase">
                Chỉnh sửa <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {fixedExpenses.map((exp, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.03] text-xs">
                  <span className="font-bold text-theme-text-muted">{exp.emoji} {exp.name}</span>
                  <span className="font-black text-theme-text-primary">{fmtVND(exp.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sliders - Compact and Balanced */}
        <div className="lg:col-span-8 glass-panel p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-theme-text-primary tracking-tight">Phân bổ dòng tiền</h2>
            <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${unallocated === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'}`}>
              {unallocated === 0 ? 'Hoàn tất' : `Còn ${unallocated}%`}
            </div>
          </div>
          
          <LinkedSliders jars={jars} totalBudget={available} onJarsChange={setJars} formatCurrency={fmtVND} />
          
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-theme-text-muted font-medium max-w-[300px]">Thiết lập sẽ được áp dụng ngay lập tức cho trang Tổng quan.</p>
            <button 
              onClick={handleSave} 
              disabled={unallocated !== 0} 
              className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
                unallocated === 0 
                  ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95' 
                  : 'bg-white/5 text-white/10 cursor-not-allowed'
              }`}
            >
              Lưu Ngân Sách
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-emerald-500 text-white px-8 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-black uppercase tracking-widest text-xs">
               <Sparkles className="w-4 h-4" /> Thiết lập thành công!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
