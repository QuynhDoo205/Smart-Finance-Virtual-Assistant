import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, 
  Target, RefreshCw, Search, ShoppingBag, 
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../utils/api';
import type { DashboardSummary, Transaction, Budget } from '../../utils/api';
import authStore from '../../store/authStore';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogicInfo, setShowLogicInfo] = useState(false);

  const user = authStore.getUser();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  
  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, txRes, budgetRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getTransactions(25),
        dashboardApi.getBudget(),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data.transactions);
      setBudgets(budgetRes.data.budgets);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pieData = (summary?.categoryDistribution && summary.categoryDistribution.length > 0)
    ? summary.categoryDistribution.map(d => ({ name: d.name, value: Number(d.value), color: d.color }))
    : budgets.length > 0
      ? budgets.map(b => ({ name: b.category_name, value: Number(b.spent_amount) || 0, color: b.category_color }))
      : [];
  
  const displayTransactions = transactions.length > 0 ? transactions : [];

  const filteredTransactions = displayTransactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.category_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
                        (filterType === 'income' && (tx.type === 'income' || (tx as any).loai_giao_dich === 'thu_nhap')) ||
                        (filterType === 'expense' && (tx.type === 'expense' || (tx as any).loai_giao_dich === 'chi_phi'));
    return matchesSearch && matchesType;
  });

  const displaySummary = summary || {
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    incomeChangePercent: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-5 pb-16 p-4 sm:p-0">
      
      {/* Header Compact */}
      <motion.div variants={itemVars} className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-xl font-black text-theme-text-primary tracking-tight">Tổng quan</h1>
          <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-widest">
            Tháng {displaySummary.month}/{displaySummary.year} — {user?.full_name?.split(' ').pop()}
          </p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
          <RefreshCw className={`w-4 h-4 text-theme-text-muted ${loading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* Summary Cards - Smaller & Harmonious */}
      <motion.div variants={itemVars} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 relative group bg-gradient-to-br from-primary-500/5 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Wallet className="text-primary-400 w-5 h-5" />
            </div>
            <h3 className="text-theme-text-muted font-black text-[9px] uppercase tracking-widest">Số dư</h3>
          </div>
          <p className="text-3xl font-black text-theme-text-primary tracking-tighter">
            {formatCurrency(displaySummary.totalBalance)}
          </p>
          <div className="mt-2 flex items-center text-[10px] font-bold text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>+{displaySummary.incomeChangePercent}% so với trước</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowDownRight className="text-emerald-400 w-5 h-5" />
            </div>
            <h3 className="text-theme-text-muted font-black text-[9px] uppercase tracking-widest">Thu nhập</h3>
          </div>
          <p className="text-3xl font-black text-theme-text-primary tracking-tighter">
            {formatCurrency(displaySummary.totalIncome)}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <ArrowUpRight className="text-rose-400 w-5 h-5" />
            </div>
            <h3 className="text-theme-text-muted font-black text-[9px] uppercase tracking-widest">Chi tiêu</h3>
          </div>
          <p className="text-3xl font-black text-theme-text-primary tracking-tighter">
            {formatCurrency(displaySummary.totalExpense)}
          </p>
        </div>
      </motion.div>

      {/* Budget Monitor - Compact & Clear */}
      {budgets.length > 0 && (
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-[2rem] border border-white/5 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-theme-text-primary tracking-tight">Ngân sách</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowLogicInfo(!showLogicInfo)} className="p-1.5 rounded-lg hover:bg-white/5 text-theme-text-muted">
                <HelpCircle className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/app/budget')} className="px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 text-[10px] font-black uppercase tracking-widest">Sửa</button>
            </div>
          </div>

          <AnimatePresence>
            {showLogicInfo && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-6 p-4 rounded-xl bg-primary-500/5 border border-primary-500/10 text-[11px] text-theme-text-muted overflow-hidden">
                <p><span className="text-theme-text-primary font-bold">Lưu ý:</span> Nova so sánh <span className="text-white font-bold">Thực tiêu</span> / <span className="text-primary-400 font-bold">Kế hoạch</span>. Nếu là 0đ nghĩa là bạn chưa đặt hạn mức cho mục đó.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            {budgets.map(budget => {
              const hasNoLimitButSpent = budget.limit_amount === 0 && budget.spent_amount > 0;
              const displayPercent = hasNoLimitButSpent ? 100 : Math.min(budget.usage_percent, 100);
              const barColorClass = hasNoLimitButSpent ? 'bg-cyan-500' : budget.usage_percent >= 90 ? 'bg-rose-500' : 'bg-emerald-500';

              return (
                <div key={budget.category_name} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-theme-text-muted">{budget.category_name}</span>
                    <span className="font-black text-theme-text-primary">
                      {formatCurrency(budget.spent_amount)} / <span className="opacity-30">{budget.limit_amount > 0 ? formatCurrency(budget.limit_amount) : '0đ'}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${displayPercent}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${barColorClass}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Main Content - Compact Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Pie Chart Card - Compact */}
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-[2.5rem] lg:col-span-1 border border-white/5 h-[520px] flex flex-col">
          <h3 className="text-md font-black text-theme-text-primary tracking-tight mb-4">Tỷ trọng chi tiêu</h3>
          
          <div className="flex-1 w-full relative mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" paddingAngle={5}
                  dataKey="value" nameKey="name" stroke="none"
                >
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || '#38bdf8'} />)}
                </Pie>
                <RechartsTooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-[8px] text-theme-text-muted uppercase font-black">Tổng chi</p>
              <p className="text-lg font-black text-theme-text-primary">{formatCurrency(displaySummary.totalExpense).split(',')[0]}đ</p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 max-h-[160px]">
            {pieData.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-bold text-theme-text-muted">{item.name}</span>
                </div>
                <span className="text-[11px] font-black text-theme-text-primary">{formatCurrency(item.value).split(',')[0]}đ</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Transactions Card - Compact */}
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-[2.5rem] lg:col-span-2 border border-white/5 h-[520px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-md font-black text-theme-text-primary tracking-tight">Nhật ký Giao dịch</h3>
            <div className="flex items-center gap-2">
              <div className="flex bg-white/5 p-0.5 rounded-xl border border-white/10">
                <button onClick={() => setFilterType('all')} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${filterType === 'all' ? 'bg-primary-500 text-white' : 'text-theme-text-muted'}`}>Tất cả</button>
                <button onClick={() => setFilterType('income')} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${filterType === 'income' ? 'bg-emerald-500 text-white' : 'text-theme-text-muted'}`}>Thu</button>
                <button onClick={() => setFilterType('expense')} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${filterType === 'expense' ? 'bg-rose-500 text-white' : 'text-theme-text-muted'}`}>Chi</button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-theme-text-muted" />
                <input 
                  type="text" placeholder="Tìm..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] text-theme-text-primary outline-none w-32"
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2.5">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-[1.25rem] bg-white/[0.01] border border-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group" onClick={() => navigate('/app/expense')}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-theme-text-primary">{tx.title}</h4>
                    <p className="text-[9px] text-theme-text-muted font-bold mt-0.5">{tx.category_name} • {formatDate(tx.transaction_date)}</p>
                  </div>
                </div>
                <p className={`text-[14px] font-black ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount).split(',')[0]}đ
                </p>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => navigate('/app/expense')}
            className="mt-4 w-full py-3 rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-theme-text-muted hover:text-white transition-all"
          >
            Quản lý nhật ký
          </button>
        </motion.div>
      </div>

    </motion.div>
  );
}
