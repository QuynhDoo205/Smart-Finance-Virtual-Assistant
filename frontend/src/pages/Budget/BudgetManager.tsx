import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Lucide from 'lucide-react';
import { BrainCircuit, RefreshCw, Sparkles, Info, HelpCircle, Target, X, ExternalLink, Banknote, PieChart as PieIcon, CheckCircle2, AlertCircle, PlusCircle, Settings } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
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

const getSmartIcon = (title: string, defaultIcon: string) => {
  const t = title.toLowerCase();
  if (t.includes('nhà') || t.includes('phòng') || t.includes('trọ')) return 'home';
  if (t.includes('điện') || t.includes('nước') || t.includes('hóa đơn')) return 'zap';
  if (t.includes('ăn') || t.includes('uống') || t.includes('chợ')) return 'utensils';
  if (t.includes('xe') || t.includes('xăng') || t.includes('đi lại')) return 'car';
  if (t.includes('học') || t.includes('trường') || t.includes('khóa')) return 'book';
  if (t.includes('mạng') || t.includes('wifi') || t.includes('4g') || t.includes('internet')) return 'wifi';
  if (t.includes('gym') || t.includes('sức khỏe') || t.includes('thuốc')) return 'heart';
  if (t.includes('mua') || t.includes('sắm')) return 'shopping-bag';
  return defaultIcon;
};

const IconRenderer = ({ iconName, className }: { iconName: string, className?: string }) => {
  if (!iconName) return <Lucide.HelpCircle className={className} />;
  
  // Check if it's an emoji
  const isEmoji = /\p{Emoji}/u.test(iconName);
  if (isEmoji) return <span className={className}>{iconName}</span>;

  // Convert kebab-case to PascalCase
  const pascalName = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const IconComponent = (Lucide as any)[pascalName];
  if (IconComponent) return <IconComponent className={className} />;
  
  return <Lucide.HelpCircle className={className} />;
};

export default function BudgetManager() {
  const navigate = useNavigate();
  const [income, setIncome] = useState(0);
  const [jars, setJars] = useState<Jar[]>(INIT_JARS);
  const [fixedExpenses, setFixedExpenses] = useState<{name: string, emoji: string, amount: number}[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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
          const jarNames = ['ăn uống', 'đầu tư', 'giáo dục', 'giải trí', 'sức khỏe'];
          const mappedFixed = actualBudgets
            .filter((b: any) => b.limit_amount > 0 && !jarNames.includes(b.category_name.toLowerCase()))
            .map((b: any) => ({
              name: b.budget_title || b.category_name,
              emoji: getSmartIcon(b.budget_title || b.category_name, b.category_icon || '💰'),
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

  const handleSyncReality = async () => {
    try {
      const summaryRes = await dashboardApi.getSummary();
      if (summaryRes.success && summaryRes.data.totalIncome > 0) {
        const realIncome = summaryRes.data.totalIncome;
        setIncome(realIncome);
        // Sync to profile as well
        const budgetRes = await dashboardApi.getBudget();
        const existingBudgets = budgetRes.success 
          ? budgetRes.data.budgets.map((b: any) => ({ 
              categoryName: b.budget_title || b.category_name, 
              amount: b.limit_amount,
              category: b.category_name
            }))
          : [];
        await userApi.updateOnboarding(realIncome, existingBudgets);
        alert(`Đã đồng bộ Thu nhập thực tế (${fmtVND(realIncome)}) vào kế hoạch!`);
      }
    } catch (err) {
      console.error('Reality sync failed:', err);
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
          <button onClick={() => setShowGuide(!showGuide)} className="p-2 rounded-xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] text-theme-text-muted hover:bg-[var(--theme-bg-surface)] transition-all">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>


      {/* --- STATUS BANNER --- */}
      <AnimatePresence>
        {unallocated === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between shadow-lg shadow-emerald-500/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Phân bổ hoàn hảo!</h3>
                <p className="text-xs text-theme-text-muted">Kế hoạch của bạn đã sẵn sàng để lưu lại.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-400">100%</p>
              <p className="text-[10px] text-theme-text-muted uppercase tracking-widest">= 100% ✓</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- INSTRUCTIONS (Ghi chú/Hướng dẫn) --- */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="glass-panel p-8 rounded-[2.5rem] border border-primary-500/20 bg-primary-500/5 relative">
              <button onClick={() => setShowGuide(false)} className="absolute top-6 right-6 p-2 text-theme-text-muted hover:text-theme-text-primary transition-all">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-black text-primary-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <HelpCircle className="w-5 h-5" /> Hướng dẫn thiết lập
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 font-black">1</div>
                  <p className="text-xs font-bold text-theme-text-primary">Kiểm tra thu nhập</p>
                  <p className="text-[11px] text-theme-text-muted leading-relaxed">Đảm bảo thu nhập tháng của bạn đã chính xác để hệ thống tính toán khả dụng.</p>
                </div>
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 font-black">2</div>
                  <p className="text-xs font-bold text-theme-text-primary">Trừ phí cố định</p>
                  <p className="text-[11px] text-theme-text-muted leading-relaxed">Hệ thống sẽ tự động trừ các khoản chi phí cứng (thuê nhà, điện nước...) trước khi chia lọ.</p>
                </div>
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 font-black">3</div>
                  <p className="text-xs font-bold text-theme-text-primary">Chia lọ thông minh</p>
                  <p className="text-[11px] text-theme-text-muted leading-relaxed">Kéo các thanh trượt bên dưới sao cho tổng phân bổ đạt đúng 100%.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SECTION 1: INCOME & FIXED (AREA 1) --- */}
      <div className="glass-panel p-8 rounded-[2.5rem] border border-[var(--theme-subtle-border)]  relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0" />
        
        <div className="flex items-center justify-between gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/20 rounded-lg">
              <Banknote className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="text-xs font-black text-theme-text-primary uppercase tracking-[0.2em]">KHU VỰC 1 - THU NHẬP & PHÍ CỐ ĐỊNH</h2>
          </div>
          <button
            onClick={() => navigate('/app/profile?tab=expenses')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-[10px] font-black uppercase tracking-widest transition-all group"
          >
            <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300" />
            Sửa chi phí cố định
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Total Income */}
          <div className="lg:col-span-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted mb-2">Tổng thu nhập / tháng</p>
            <h3 className="text-4xl font-black text-theme-text-primary tracking-tighter mb-2">
              {fmtVND(income)}
            </h3>
            <button 
              onClick={handleSyncReality}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest transition-all"
              title="Lấy số tiền thu nhập thực tế từ các giao dịch trong tháng để lập kế hoạch"
            >
              <RefreshCw className="w-3 h-3" /> Đồng bộ thực tế
            </button>
          </div>

          {/* Fixed Expenses List */}
          <div className="lg:col-span-5 border-l border-r border-[var(--theme-subtle-border)] px-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Phí cố định (Đã khóa)
            </p>
            <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
              {fixedExpenses.length === 0 ? (
                <p className="text-xs text-theme-text-muted italic">Chưa có khoản cố định nào</p>
              ) : (
                fixedExpenses.map((exp, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-3 text-theme-text-muted font-bold">
                      <IconRenderer iconName={exp.emoji} className="w-4 h-4 text-theme-text-muted/70" /> 
                      {exp.name}
                    </div>
                    <span className="font-black text-rose-400">-{fmtVND(exp.amount)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--theme-subtle-border)] flex justify-between text-xs font-black">
              <span className="text-theme-text-muted uppercase tracking-widest text-[9px]">Tổng phí cố định</span>
              <span className="text-rose-400">-{fmtVND(totalFixed)}</span>
            </div>
          </div>

          {/* Available Budget */}
          <div className="lg:col-span-4 text-right flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center justify-end gap-2 mb-2">
               Số tiền khả dụng để chia lọ <Info className="w-3.5 h-3.5" />
            </p>
            <h3 className="text-4xl font-black text-cyan-400 tracking-tighter drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              {fmtVND(available)}
            </h3>
            <p className="text-[10px] text-theme-text-muted font-bold tracking-tight mt-1">
              ={fmtVND(income)} - {fmtVND(totalFixed)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* --- LEFT COLUMN: SLIDERS (AREA 3) --- */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] border border-[var(--theme-subtle-border)]  shadow-2xl relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-xs font-black text-theme-text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="p-1.5 bg-primary-500/20 rounded-lg">
                    <PieIcon className="w-4 h-4 text-primary-400" />
                  </div>
                  KHU VỰC 3 - Điều chỉnh Lọ Chi Tiêu
                </h2>
                <p className="text-[10px] text-theme-text-muted font-bold pl-9">Kéo tự do • Quỹ dự theo dõi phía trên</p>
              </div>
              <Link 
                to="/app/profile?tab=expenses" 
                className="flex items-center gap-2 px-4 py-2 bg-[var(--theme-subtle-bg)] hover:bg-[var(--theme-bg-surface)] border border-[var(--theme-subtle-border)] rounded-xl text-[10px] font-black text-theme-text-muted transition-all uppercase tracking-widest"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Thêm lọ
              </Link>
            </div>
            
            <LinkedSliders jars={jars} totalBudget={available} onJarsChange={setJars} formatCurrency={fmtVND} />
          </div>
        </div>

        {/* --- RIGHT COLUMN: VISUALIZATION & AI (AREA 2) --- */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex flex-col gap-6">
            {/* AI Button - Large & Gradient (Matches Ref 2) */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xs font-black text-theme-text-primary uppercase tracking-[0.2em] px-2">KHU VỰC 2 - AI Gợi ý & Phân bổ</h2>
              <button 
                onClick={handleAI} 
                disabled={aiLoading} 
                className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white text-sm font-black uppercase tracking-[0.25em] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-xl relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-[var(--theme-bg-surface)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {aiLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                AI Gợi ý Phân bổ ✨
              </button>
              <p className="text-[10px] text-theme-text-muted font-bold text-center px-4 -mt-2 uppercase tracking-widest">Phân bổ tối ưu trên {fmtVND(available)} khả dụng</p>
            </div>

            {/* CARD 1: Pie Chart + Legend (Matches Ref 10 & 11) */}
            <div className="glass-panel p-8 rounded-[3rem] border border-[var(--theme-subtle-border)]  relative shadow-2xl overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full" />
              <h2 className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.4em] mb-10">BIỂU ĐỒ PHÂN BỔ</h2>
              
              <div className="h-[240px] relative mb-12">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jars.map(j => ({ name: j.name, value: j.percentage, color: j.color, neonColor: j.neonColor }))}
                      innerRadius={82}
                      outerRadius={105}
                      paddingAngle={2}
                      dataKey="value"
                      animationDuration={1500}
                      stroke="none"
                    >
                      {jars.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.neonColor || entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[var(--theme-bg-surface)] border border-[var(--theme-subtle-border)] p-3 rounded-2xl shadow-2xl backdrop-blur-xl">
                              <p className="text-xs font-black text-theme-text-primary mb-1">{data.name}</p>
                              <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-widest">
                                {data.value}% = {fmtVND(Math.round(available * (data.value / 100)))}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-5xl font-black text-theme-text-primary tracking-tighter">{100 - unallocated}%</span>
                  <span className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.4em] mt-2">
                    {unallocated === 0 ? 'Hoàn hảo' : 'Chưa đủ'}
                  </span>
                </div>
              </div>

              {/* THE LEGEND (Ghi chú dưới biểu đồ - Matches Ref 10 & 11) */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-2">
                {jars.map(j => (
                  <div key={j.id} className="flex items-center gap-2.5 group">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all group-hover:scale-125" style={{ backgroundColor: j.neonColor || j.color, boxShadow: `0 0 12px ${j.neonColor || j.color}60` }} />
                    <div className="flex items-center gap-2 overflow-hidden">
                      <IconRenderer iconName={j.emoji} className="w-3.5 h-3.5 text-theme-text-muted/60 group-hover:text-theme-text-primary" />
                      <span className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest truncate group-hover:text-theme-text-primary transition-colors">{j.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 2: Detailed Summary List (Matches Ref 12) */}
            <div className="glass-panel p-8 rounded-[3rem] border border-[var(--theme-subtle-border)]  shadow-xl">
              <div className="space-y-5">
                {jars.map(j => (
                  <div key={j.id} className="flex items-center justify-between group py-0.5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] flex items-center justify-center group-hover:bg-[var(--theme-bg-surface)] transition-all">
                        <IconRenderer iconName={j.emoji} className="w-5 h-5 text-theme-text-muted" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-theme-text-primary font-black uppercase tracking-widest">{j.name}</span>
                        <span className="text-[9px] text-theme-text-muted font-bold">{j.description}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-theme-text-primary mr-4 tracking-tight">{fmtVND(Math.round(available * (j.percentage / 100)))}</span>
                      <span className="text-[11px] font-black text-primary-400 bg-primary-500/10 px-2 py-1 rounded-xl border border-primary-500/10">{j.percentage}%</span>
                    </div>
                  </div>
                ))}
                
                <div className="pt-10 mt-2 border-t border-[var(--theme-subtle-border)]">
                  <div className="flex justify-between items-center px-2 mb-6">
                    <div>
                      <p className="text-[9px] text-theme-text-muted font-black uppercase tracking-[0.3em] mb-1">Tổng ngân sách chia lọ</p>
                      <p className="text-3xl font-black text-theme-text-primary tracking-tighter drop-shadow-sm">{fmtVND(available)}</p>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-emerald-400/80 italic mb-4 px-2 text-center font-bold">
                    💡 Lưu ý: Hệ thống sẽ lưu % các lọ này để AI theo dõi chi tiêu. (Sẽ không cộng vào Chi phí cố định)
                  </p>
                  
                  <button 
                    onClick={handleSave} 
                    disabled={unallocated !== 0} 
                    className={`w-full py-5 rounded-[2rem] flex items-center justify-center gap-3 text-[14px] font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden group/save shadow-2xl ${
                      unallocated === 0 
                        ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white hover:scale-[1.02] active:scale-[0.98]' 
                        : 'bg-[var(--theme-subtle-bg)] text-white/10 cursor-not-allowed'
                    }`}
                  >
                    Lưu Ngân Sách <Lucide.ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
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
