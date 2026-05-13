import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, 
  Target, RefreshCw, Search, ShoppingBag, 
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, incomeApi } from '../../utils/api';
import type { DashboardSummary, Transaction, Budget, IncomeSourceRecord } from '../../utils/api';
import authStore from '../../store/authStore';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSourceRecord[]>([]);
  const [chartData, setChartData] = useState<{name: string; income: number; expense: number}[]>([]);
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
      const [summaryRes, txRes, budgetRes, incomeRes, chartRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getTransactions(25),
        dashboardApi.getBudget(),
        incomeApi.getSources(),
        dashboardApi.getChartData(),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data.transactions);
      setBudgets(budgetRes.data.budgets);
      if (incomeRes.success) setIncomeSources(incomeRes.data.sources);
      if (chartRes.success) {
        // Transform backend data format to Recharts format
        const rawData = chartRes.data.chartData;
        const formattedMap = new Map();
        
        // Luôn tạo đủ 6 tháng gần nhất (bao gồm tháng hiện tại)
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthStr = `Tháng ${d.getMonth() + 1}`;
          formattedMap.set(monthStr, { name: monthStr, income: 0, expense: 0 });
        }

        // Đắp dữ liệu thật vào
        rawData.forEach((row: any) => {
          const key = `Tháng ${row.month}`;
          if (formattedMap.has(key)) {
            if (row.type === 'income') formattedMap.get(key).income = Number(row.total);
            else formattedMap.get(key).expense = Number(row.total);
          }
        });
        
        setChartData(Array.from(formattedMap.values()));
      }
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

  // Calculate forecasted income from income sources
  const forecastedIncome = incomeSources.reduce((sum, s) => {
    const amount = s.so_tien_du_kien ? parseFloat(s.so_tien_du_kien.toString()) : 0;
    return sum + amount;
  }, 0);

  const displaySummary = summary || {
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    incomeChangePercent: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  };

  // Use forecasted income in the header stat when no actual income yet
  const displayIncome = displaySummary.totalIncome > 0 ? displaySummary.totalIncome : forecastedIncome;
  const isForecasted = displaySummary.totalIncome === 0 && forecastedIncome > 0;

  // --- SMART MERGE FOR BUDGET MONITOR ---
  // Merge actual budgets with fixed income sources for a complete view
  const mergedBudgets = (() => {
    // Start with income sources (fixed ones with a positive expected amount)
    const list: Budget[] = incomeSources
      .filter(s => s.loai_nguon === 'fixed' && Number(s.so_tien_du_kien) > 0)
      .map(s => ({
        id: -1, // Virtual ID
        category_name: s.ten_nguon,
        limit_amount: Number(s.so_tien_du_kien),
        spent_amount: 0, // Income sources are usually "Fixed Costs" that we expect to pay
        usage_percent: 0,
        category_icon: '🔒',
        category_color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      }));

    // Add actual budgets that don't overlap by name
    budgets.forEach(b => {
      const exists = list.find(l => l.category_name.toLowerCase() === b.category_name.toLowerCase());
      if (!exists) {
        list.push(b);
      }
    });

    // Update spent_amount for virtual income budgets based on actual transactions
    list.forEach(item => {
      if (item.id === -1) {
        const actualIncome = displayTransactions
          .filter(tx => 
            (tx.type === 'income' || (tx as any).loai_giao_dich === 'thu_nhap') && 
            (tx.title === item.category_name || tx.note?.includes(item.category_name))
          )
          .reduce((sum, tx) => sum + Number(tx.amount), 0);
        item.spent_amount = actualIncome;
        item.usage_percent = item.limit_amount > 0 ? (actualIncome / item.limit_amount) * 100 : 0;
      }
    });

    return list.sort((a, b) => b.limit_amount - a.limit_amount);
  })();

  return (
    <motion.div 
      variants={containerVars} 
      initial="hidden" 
      whileInView="show" 
      viewport={{ once: true, amount: 0.05 }} 
      className="space-y-6 pb-16 p-2 sm:p-0"
    >
      
      {/* --- Premium Greeting Header --- */}
      <motion.div variants={itemVars} className="flex justify-between items-end mb-2 px-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-[1px] bg-primary-500/50" />
            <p className="text-[10px] text-primary-400 font-black uppercase tracking-[0.2em]">Tháng {displaySummary.month}/{displaySummary.year}</p>
          </div>
          <h1 className="text-3xl font-black text-theme-text-primary tracking-tight flex items-center gap-2">
            Chào buổi {new Date().getHours() < 12 ? 'sáng' : new Date().getHours() < 18 ? 'chiều' : 'tối'}, {user?.full_name?.split(' ').pop() || 'bạn'}! 👋
          </h1>
          <p className="text-xs text-theme-text-muted mt-1 font-medium max-w-md">
            {displaySummary.totalBalance >= 1000000 
              ? "Tuyệt vời! Tài chính của bạn đang rất khởi sắc. Tiếp tục phát huy nhé! ✨" 
              : displaySummary.totalBalance >= 0
                ? "Tài chính của bạn đang ở mức an toàn. Hãy lập kế hoạch cho mục tiêu mới! 🎯"
                : "Có vẻ chi tiêu đang hơi cao, hãy cùng Nova tối ưu lại ngân sách nhé! 💡"}
          </p>
        </div>
        
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="p-3 rounded-2xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] text-theme-text-muted hover:text-primary-400 hover:bg-primary-500/5 hover:border-primary-500/20 transition-all group"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-primary-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>
      </motion.div>

      {/* Summary Cards - Smaller & Harmonious */}
      <motion.div variants={itemVars} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-[var(--theme-subtle-border)] relative group bg-gradient-to-br from-primary-500/5 to-transparent">
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

        <div className="glass-panel p-5 rounded-2xl border border-[var(--theme-subtle-border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowDownRight className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-theme-text-muted font-black text-[9px] uppercase tracking-widest">Thu nhập</h3>
              {isForecasted && <span className="text-[8px] text-amber-400 font-bold">(Dự tính)</span>}
            </div>
          </div>
          <p className="text-3xl font-black text-theme-text-primary tracking-tighter">
            {formatCurrency(displayIncome)}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[var(--theme-subtle-border)]">
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

      {/* --- 6-Month Trend Chart --- */}
      {chartData.length > 0 && (
        <div className="glass-panel p-6 rounded-[2rem] border border-[var(--theme-subtle-border)] shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-md font-black text-theme-text-primary tracking-tight">Biểu đồ dòng tiền (6 tháng)</h3>
          </div>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000000}tr`} />
                <RechartsTooltip 
                  formatter={(value: any) => formatCurrency(Number(value)) + ' đ'}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="income" name="Thu nhập" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Chi tiêu" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Budget Monitor - Compact & Clear */}
      {mergedBudgets.length > 0 && (
        <div className="glass-panel p-6 rounded-[2rem] border border-[var(--theme-subtle-border)] shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-theme-text-primary tracking-tight">Ngân sách & Cố định</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowLogicInfo(!showLogicInfo)} className="p-1.5 rounded-lg hover:bg-[var(--theme-subtle-bg)] text-theme-text-muted">
                <HelpCircle className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/app/budget')} className="px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 text-[10px] font-black uppercase tracking-widest">Sửa</button>
            </div>
          </div>

          <AnimatePresence>
            {showLogicInfo && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-6 p-4 rounded-xl bg-primary-500/5 border border-primary-500/10 text-[11px] text-theme-text-muted overflow-hidden">
                <p><span className="text-theme-text-primary font-bold">Lưu ý:</span> Nova so sánh <span className="text-white font-bold">Thực tiêu</span> / <span className="text-primary-400 font-bold">Kế hoạch</span>. Các mục có biểu tượng <span className="text-emerald-400">🔒</span> là các khoản cố định được đồng bộ từ mục Thu nhập.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            {mergedBudgets.map(budget => {
              const isIncomeTarget = budget.id === -1;
              const hasNoLimitButSpent = budget.limit_amount === 0 && budget.spent_amount > 0;
              const displayPercent = hasNoLimitButSpent ? 100 : Math.min(budget.usage_percent, 100);
              
              let barColorClass = 'bg-emerald-500';
              if (isIncomeTarget) {
                barColorClass = budget.usage_percent >= 100 ? 'bg-emerald-500' : 'bg-sky-500';
              } else {
                barColorClass = hasNoLimitButSpent ? 'bg-rose-500' : budget.usage_percent >= 90 ? 'bg-rose-500' : 'bg-primary-500';
              }

              return (
                <div key={budget.category_name} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      {budget.id === -1 && <span className="text-[10px]">🔒</span>}
                      <span className="font-bold text-theme-text-muted">{budget.category_name}</span>
                    </div>
                    <span className="font-black text-theme-text-primary">
                      {formatCurrency(budget.spent_amount)} / <span className="opacity-30">{budget.limit_amount > 0 ? formatCurrency(budget.limit_amount) : '0đ'}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--theme-subtle-bg)] rounded-full overflow-hidden border border-[var(--theme-subtle-border)]">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${displayPercent}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${barColorClass}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content - Compact Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Pie Chart Card - Compact */}
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-[2.5rem] lg:col-span-1 border border-[var(--theme-subtle-border)] h-[520px] flex flex-col">
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
              <p className="text-lg font-black text-theme-text-primary">{formatCurrency(displaySummary.totalExpense)}</p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 max-h-[160px]">
            {pieData.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-bold text-theme-text-muted">{item.name}</span>
                </div>
                <span className="text-[11px] font-black text-theme-text-primary">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Transactions Card - Compact */}
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-[2.5rem] lg:col-span-2 border border-[var(--theme-subtle-border)] h-[520px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-md font-black text-theme-text-primary tracking-tight">Nhật ký Giao dịch</h3>
            <div className="flex items-center gap-2">
              <div className="flex bg-[var(--theme-subtle-bg)] p-0.5 rounded-xl border border-[var(--theme-subtle-border)] overflow-x-auto custom-scrollbar">
                <button onClick={() => setFilterType('all')} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${filterType === 'all' ? 'bg-primary-500 text-white' : 'text-theme-text-muted hover:text-white'}`}>Tất cả</button>
                <button onClick={() => setFilterType('income')} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${filterType === 'income' ? 'bg-emerald-500 text-white' : 'text-theme-text-muted hover:text-white'}`}>Thu</button>
                <button onClick={() => { setFilterType('income'); setSearchTerm('Lương'); }} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${searchTerm === 'Lương' ? 'bg-emerald-500/40 text-white border border-emerald-500/50' : 'text-theme-text-muted hover:text-white'}`}>Lương</button>
                <button onClick={() => { setFilterType('income'); setSearchTerm('Trợ cấp'); }} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${searchTerm === 'Trợ cấp' ? 'bg-emerald-500/40 text-white border border-emerald-500/50' : 'text-theme-text-muted hover:text-white'}`}>Trợ cấp</button>
                <button onClick={() => { setFilterType('expense'); setSearchTerm(''); }} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${filterType === 'expense' ? 'bg-rose-500 text-white' : 'text-theme-text-muted hover:text-white'}`}>Chi</button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-theme-text-muted" />
                <input 
                  type="text" placeholder="Tìm..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] rounded-lg text-[11px] text-theme-text-primary outline-none w-24 sm:w-32"
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2.5">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-[1.25rem] bg-white/[0.01] border border-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group" onClick={() => navigate('/app/expense')}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(tx.type === 'income' || (tx as any).loai_giao_dich === 'thu_nhap') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {(tx.type === 'income' || (tx as any).loai_giao_dich === 'thu_nhap') ? <TrendingUp className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-theme-text-primary">{tx.title}</h4>
                    <p className="text-[9px] text-theme-text-muted font-bold mt-0.5">
                      {tx.category_name === 'Lương' ? '💼 ' : tx.category_name === 'Trợ cấp' ? '🎁 ' : ''}
                      {tx.category_name} • {formatDate(tx.transaction_date)}
                    </p>
                  </div>
                </div>
                <p className={`text-[14px] font-black ${(tx.type === 'income' || (tx as any).loai_giao_dich === 'thu_nhap') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(tx.type === 'income' || (tx as any).loai_giao_dich === 'thu_nhap') ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => navigate('/app/expense')}
            className="mt-4 w-full py-3 rounded-xl bg-[var(--theme-subtle-bg)] text-[9px] font-black uppercase tracking-widest text-theme-text-muted hover:text-white transition-all"
          >
            Quản lý nhật ký
          </button>
        </motion.div>
      </div>

    </motion.div>
  );
}
