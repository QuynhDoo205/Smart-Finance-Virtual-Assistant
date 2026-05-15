import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, 
  Target, RefreshCw, Search, ShoppingBag, 
  HelpCircle, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, incomeApi, transactionsApi } from '../../utils/api';
import type { DashboardSummary, Transaction, Budget, IncomeSourceRecord } from '../../utils/api';
import authStore from '../../store/authStore';
import Skeleton from '../../components/common/Skeleton';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSourceRecord[]>([]);
  const [chartData, setChartData] = useState<{name: string; income: number; expense: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogicInfo, setShowLogicInfo] = useState(false);
  const [chartRange, setChartRange] = useState<'week' | 'month' | '6months'>('6months');

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
  


  /**
   * SUPER NORMALIZER - Xử lý chính xác timestamp từ PostgreSQL
   * PostgreSQL trả về ISO string dạng: "2026-05-14T17:39:00.000Z" (UTC)
   * Ta cần hiển thị theo giờ Việt Nam (+7) bằng Intl
   */
  const safeParseDate = (d: any): Date => {
    if (!d) return new Date();
    if (d instanceof Date) return isNaN(d.getTime()) ? new Date() : d;
    const s = String(d).trim();
    if (!s) return new Date();
    // Mọi định dạng timestamp đều được xử lý bằng new Date()
    // PostgreSQL: "2026-05-14T17:39:00.000Z" - trình duyệt tự hiểu là UTC
    // Sau đó Intl sẽ chuyển sang VN time khi hiển thị
    const date = new Date(s);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  /** Chuyển UTC timestamp sang giờ Việt Nam (UTC+7) */
  const toVNDate = (d: any): Date => {
    const utc = safeParseDate(d);
    return new Date(utc.getTime() + 7 * 60 * 60 * 1000);
  };

  const formatTime = (d: string | Date) => {
    if (!d) return '--:--';
    const vn = toVNDate(d);
    return `${String(vn.getUTCHours()).padStart(2,'0')}:${String(vn.getUTCMinutes()).padStart(2,'0')}`;
  };

  const formatFullDate = (d: string | Date) => {
    const vn = toVNDate(d);
    return `${String(vn.getUTCDate()).padStart(2,'0')}/${String(vn.getUTCMonth()+1).padStart(2,'0')}/${vn.getUTCFullYear()}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = toVNDate(dateStr);
    const now = toVNDate(new Date());
    const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const targetMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const diffDays = Math.round((todayMs - targetMs) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}`;
    return formatFullDate(dateStr);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, txRes, budgetRes, incomeRes, chartRes] = await Promise.all([
        dashboardApi.getSummary(),
        transactionsApi.list(25), // Dùng API đầy đủ để lấy giờ phút
        dashboardApi.getBudget(),
        incomeApi.getSources(),
        dashboardApi.getChartData(chartRange),
      ]);
      
      if (summaryRes?.success) setSummary(summaryRes.data);
      if (txRes?.success && txRes?.data?.transactions) setTransactions(txRes.data.transactions);
      if (budgetRes?.success) setBudgets(budgetRes.data.budgets || []);
      if (incomeRes?.success) setIncomeSources(incomeRes.data.sources || []);
      
      if (chartRes?.success && chartRes?.data?.chartData) {
        const rawData = chartRes.data.chartData;
        const formattedMap = new Map();
        const today = new Date();
        
        if (chartRange === 'week') {
          for (let i = 6; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const keyStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            formattedMap.set(keyStr, { name: keyStr, income: 0, expense: 0 });
          }
          rawData.forEach((row: any) => {
            const key = `${String(row.day).padStart(2, '0')}/${String(row.month).padStart(2, '0')}`;
            if (formattedMap.has(key)) {
              if (row.type === 'income') formattedMap.get(key).income = Number(row.total);
              else formattedMap.get(key).expense = Number(row.total);
            }
          });
        } else if (chartRange === 'month') {
          for (let i = 29; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const keyStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            formattedMap.set(keyStr, { name: keyStr, income: 0, expense: 0 });
          }
          rawData.forEach((row: any) => {
            const key = `${String(row.day).padStart(2, '0')}/${String(row.month).padStart(2, '0')}`;
            if (formattedMap.has(key)) {
              if (row.type === 'income') formattedMap.get(key).income = Number(row.total);
              else formattedMap.get(key).expense = Number(row.total);
            }
          });
        } else {
          for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthStr = `Tháng ${d.getMonth() + 1}`;
            formattedMap.set(monthStr, { name: monthStr, income: 0, expense: 0 });
          }
          rawData.forEach((row: any) => {
            const key = `Tháng ${row.month}`;
            if (formattedMap.has(key)) {
              if (row.type === 'income') formattedMap.get(key).income = Number(row.total);
              else formattedMap.get(key).expense = Number(row.total);
            }
          });
        }
        
        setChartData(Array.from(formattedMap.values()));
      }
    } catch (err) {
      console.error("Dashboard stable sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [chartRange]);

  const pieData = (summary?.categoryDistribution && summary.categoryDistribution.length > 0)
    ? summary.categoryDistribution.map(d => ({ name: d.name, value: Number(d.value), color: d.color }))
    : (budgets || []).length > 0
      ? budgets.map(b => ({ name: b.category_name, value: Number(b.spent_amount) || 0, color: b.category_color }))
      : [];
  
  const displayTransactions = Array.isArray(transactions) ? transactions : [];

  const filteredTransactions = displayTransactions.filter(tx => {
    if (!tx || !tx.title) return false;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = tx.title.toLowerCase().includes(searchLower) || 
                          (tx.category_name || '').toLowerCase().includes(searchLower);
    
    if (filterType === 'all') return matchesSearch;
    
    const isIncome = tx.type === 'income' || (tx as any).loai_giao_dich === 'thu_nhap';
    const isExpense = tx.type === 'expense' || (tx as any).loai_giao_dich === 'chi_phi' || tx.type === 'chi_phi';
    
    if (filterType === 'income') return matchesSearch && isIncome;
    if (filterType === 'expense') return matchesSearch && isExpense;
    
    return matchesSearch;
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
    remainingEmergency: 0,
    emergencyLimit: 0,
    incomeChangePercent: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    committedFixedExpenses: 0,
    availableAfterCommitments: 0,
    netAvailableBalance: 0,
  };

  // Use forecasted income in the header stat when no actual income yet
  const displayIncome = displaySummary.totalIncome > 0 ? displaySummary.totalIncome : forecastedIncome;
  const isForecasted = displaySummary.totalIncome === 0 && forecastedIncome > 0;

  // --- BUDGET MONITOR ---
  const mergedBudgets = [...budgets].sort((a, b) => b.limit_amount - a.limit_amount);

  // --- CARD STATS ---
  const topExpenseCategory = [...mergedBudgets].filter(b => b.spent_amount > 0).sort((a, b) => b.spent_amount - a.spent_amount)[0];
  const incomeAchievement = forecastedIncome > 0 ? (displaySummary.totalIncome / forecastedIncome) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6 pb-16 p-2 sm:p-0">
        <div className="flex justify-between items-end mb-2 px-2">
          <div className="space-y-2">
            <Skeleton width="100px" height="12px" variant="text" />
            <Skeleton width="250px" height="40px" />
            <Skeleton width="300px" height="16px" variant="text" />
          </div>
          <Skeleton width="48px" height="48px" className="rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height="140px" className="rounded-2xl" />
          ))}
        </div>

        <Skeleton height="300px" className="rounded-[2rem]" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton height="520px" className="rounded-[2.5rem] lg:col-span-1" />
          <Skeleton height="520px" className="rounded-[2.5rem] lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVars} 
      initial="hidden" 
      animate="show" 
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
        {/* ── PREMIUM BALANCE CARD: Số dư thực vs Khả dụng ── */}
        <div className="glass-panel p-6 rounded-2xl border border-[var(--theme-subtle-border)] bg-gradient-to-br from-primary-500/10 via-transparent to-transparent shadow-lg relative overflow-hidden group col-span-1 md:col-span-1">
          {/* Glow effect */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary-500/10 blur-2xl group-hover:bg-primary-500/15 transition-all duration-700" />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center border border-primary-500/20 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                <Wallet className="text-primary-400 w-5 h-5" />
              </div>
              <h3 className="text-theme-text-muted font-black text-[10px] uppercase tracking-[0.15em]">Tài sản</h3>
            </div>
            <div className="flex items-center text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+{displaySummary.incomeChangePercent}%</span>
            </div>
          </div>

          {/* ── Block 1: Số dư thực ── */}
          <div className="mb-3">
            <p className="text-[9px] text-theme-text-muted font-bold uppercase tracking-widest mb-0.5">Số dư thực tế</p>
            <p className="text-2xl font-black text-theme-text-primary tracking-tighter">
              {formatCurrency(displaySummary.totalBalance)}
            </p>
          </div>

          {/* ── Divider với icon ── */}
          {/* ── Divider với icon ── */}
          {((displaySummary.committedFixedExpenses ?? 0) > 0 || (displaySummary.remainingEmergency ?? 0) > 0) && (
            <>
              <div className="relative flex items-center gap-2 my-3">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">
                    Đã khóa {formatCurrency((displaySummary.committedFixedExpenses ?? 0) + (displaySummary.remainingEmergency ?? 0))}
                  </span>
                </div>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* ── Block 2: Khả dụng thực sự (sau cam kết & quỹ) ── */}
              <div className="relative p-3 rounded-xl border overflow-hidden"
                style={{
                  background: (displaySummary.netAvailableBalance ?? 0) >= 0
                    ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                  borderColor: (displaySummary.netAvailableBalance ?? 0) >= 0
                    ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                      style={{ color: (displaySummary.netAvailableBalance ?? 0) >= 0 ? '#34d399' : '#f87171' }}>
                      Khả dụng thực sự
                    </p>
                    <p className="text-xl font-black tracking-tighter"
                      style={{ color: (displaySummary.netAvailableBalance ?? 0) >= 0 ? '#10b981' : '#ef4444' }}>
                      {formatCurrency(displaySummary.netAvailableBalance ?? displaySummary.totalBalance)}
                    </p>
                  </div>
                  <div className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                    (displaySummary.netAvailableBalance ?? 0) >= displaySummary.totalBalance * 0.5
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : (displaySummary.netAvailableBalance ?? 0) >= 0
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-rose-500/15 text-rose-400'
                  }`}>
                    {(displaySummary.netAvailableBalance ?? 0) >= displaySummary.totalBalance * 0.5
                      ? '✓ An toàn' 
                      : (displaySummary.netAvailableBalance ?? 0) >= 0
                        ? '⚡ Thắt chặt'
                        : '⚠ Thiếu hụt'}
                  </div>
                </div>

                {/* Progress bar: % đã cam kết và khóa quỹ */}
                <div className="mt-2.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] text-theme-text-muted">Đã khóa (Cố định + Quỹ còn lại)</span>
                    <span className="text-[8px] font-black text-amber-400">
                      {displaySummary.totalBalance > 0
                        ? Math.min(100, Math.round((((displaySummary.committedFixedExpenses ?? 0) + (displaySummary.remainingEmergency ?? 0)) / displaySummary.totalBalance) * 100))
                        : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.round(((displaySummary.committedFixedExpenses ?? 0) / Math.max(displaySummary.totalBalance, 1)) * 100))}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    />
                    <motion.div
                      className="h-full bg-gradient-to-r from-sky-400 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.round(((displaySummary.remainingEmergency ?? 0) / Math.max(displaySummary.totalBalance, 1)) * 100))}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Khi không có fixed expenses - hiển thị breakdown cũ */}
          {(displaySummary.committedFixedExpenses ?? 0) === 0 && (
            <div className="space-y-2.5 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-theme-text-muted font-bold uppercase tracking-tight">Tiền có thể tiêu</span>
                </div>
                <span className="text-[13px] font-black text-emerald-400">
                  {formatCurrency(displaySummary.totalBalance - (displaySummary.remainingEmergency || 0))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span className="text-[10px] text-theme-text-muted font-bold uppercase tracking-tight">Quỹ dự phòng còn</span>
                </div>
                <span className="text-[13px] font-black text-sky-400">
                  {formatCurrency(displaySummary.remainingEmergency || 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[var(--theme-subtle-border)] flex flex-col justify-between">
          <div>
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
          
          <div className="mt-4 pt-3 border-t border-[var(--theme-subtle-border)] flex justify-between items-center text-[10px]">
            <div className="flex flex-col">
              <span className="text-theme-text-muted font-bold mb-0.5">Tiến độ thu nhập</span>
              <span className="text-emerald-400 font-black">{forecastedIncome > 0 ? Math.min(100, Math.round(incomeAchievement)) : 0}%</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-theme-text-muted font-bold mb-0.5">Mục tiêu</span>
              <span className="text-theme-text-primary font-black">{formatCurrency(forecastedIncome)}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[var(--theme-subtle-border)] flex flex-col justify-between">
          <div>
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
          
          <div className="mt-4 pt-3 border-t border-[var(--theme-subtle-border)] flex justify-between items-center text-[10px]">
            <div className="flex flex-col">
              <span className="text-theme-text-muted font-bold mb-0.5">Chi nhiều nhất</span>
              <span className="text-rose-400 font-black truncate max-w-[100px]">
                {topExpenseCategory ? (topExpenseCategory.budget_title || topExpenseCategory.category_name) : 'Chưa có'}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-theme-text-muted font-bold mb-0.5">Số tiền</span>
              <span className="text-theme-text-primary font-black">{topExpenseCategory ? formatCurrency(topExpenseCategory.spent_amount) : '0đ'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- Trend Chart --- */}
      {chartData.length > 0 && (
        <div className="glass-panel p-6 rounded-[2rem] border border-[var(--theme-subtle-border)] shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-md font-black text-theme-text-primary tracking-tight">Biểu đồ dòng tiền</h3>
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value as any)}
              className="bg-[var(--theme-bg)] border border-[var(--theme-subtle-border)] text-theme-text-primary text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="week" className="bg-slate-900 text-white">7 ngày qua</option>
              <option value="month" className="bg-slate-900 text-white">30 ngày qua</option>
              <option value="6months" className="bg-slate-900 text-white">6 tháng qua</option>
            </select>
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
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => {
                    if (value === 0) return '0tr';
                    const millions = value / 1000000;
                    // Nếu số quá nhỏ (dưới 0.01 triệu = 10k), hiển thị 0 để tránh số thập phân loằng ngoằng
                    if (Math.abs(millions) < 0.01) return '0tr';
                    // Hiển thị tối đa 2 chữ số thập phân, dùng toLocaleString để có số 0 ở trước
                    return `${millions.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}tr`;
                  }} 
                />
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
                <p><span className="text-theme-text-primary font-bold">Lưu ý:</span> Nova theo dõi chi tiêu của cả <span className="text-emerald-400 font-bold">LỌ NGÂN SÁCH</span> (có thể linh hoạt) và <span className="text-rose-400 font-bold">PHÍ CỐ ĐỊNH</span> (bắt buộc phải trả).</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            {mergedBudgets.map(budget => {
              const isFixedExpense = budget.budget_title && budget.budget_title.trim() !== '';
              const hasNoLimitButSpent = budget.limit_amount === 0 && budget.spent_amount > 0;
              const displayPercent = hasNoLimitButSpent ? 100 : Math.min(budget.usage_percent, 100);
              
              let barColorClass = 'bg-primary-500';
              if (hasNoLimitButSpent || budget.usage_percent >= 90) {
                barColorClass = 'bg-rose-500';
              }

              return (
                <div key={budget.category_name + budget.budget_title} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-theme-text-muted">{budget.budget_title || budget.category_name}</span>
                      {isFixedExpense ? (
                        <span className="px-1.5 py-[1px] rounded bg-rose-500/10 text-rose-400 text-[7px] font-black tracking-widest uppercase">Cố định</span>
                      ) : (
                        <span className="px-1.5 py-[1px] rounded bg-emerald-500/10 text-emerald-400 text-[7px] font-black tracking-widest uppercase">Lọ</span>
                      )}
                    </div>
                    <span className="font-black text-theme-text-primary">
                      {isFixedExpense 
                        ? <span className="text-rose-400">- {formatCurrency(budget.limit_amount)}</span>
                        : <>{formatCurrency(budget.spent_amount)} / <span className="opacity-30">{budget.limit_amount > 0 ? formatCurrency(budget.limit_amount) : '0đ'}</span></>
                      }
                    </span>
                  </div>
                  {!isFixedExpense && (
                    <div className="h-2 bg-[var(--theme-subtle-bg)] rounded-full overflow-hidden border border-[var(--theme-subtle-border)]">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${displayPercent}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${barColorClass}`} />
                    </div>
                  )}
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
            {filteredTransactions.map(tx => {
              // Tìm kiếm sâu các trường thời gian có thể có
              const displayDate = (tx as any).created_at || (tx as any).ngay_tao || (tx as any).timestamp || (tx as any).ngay_giao_dich || tx.transaction_date;
              return (
                <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-[1.25rem] bg-white/[0.01] border border-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group" onClick={() => navigate('/app/expense')}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(tx.type === 'income' || (tx as any).loai_giao_dich === 'thu_nhap') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {(tx.type === 'income' || (tx as any).loai_giao_dich === 'thu_nhap') ? <TrendingUp className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-theme-text-primary">{tx.title}</h4>
                      <p className="text-[9px] text-theme-text-muted font-bold mt-0.5">
                        {tx.category_name === 'Lương' ? '💼 ' : tx.category_name === 'Trợ cấp' ? '🎁 ' : ''}
                        {tx.category_name} • <span className="text-primary-400">{formatTime(displayDate)}</span> • {formatDate(displayDate)}
                      </p>
                    </div>
                  </div>
                  <p className={`text-[14px] font-black ${(tx.type === 'income' || (tx as any).loai_giao_dich === 'thu_nhap') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(tx.type === 'income' || (tx as any).loai_giao_dich === 'thu_nhap') ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              );
            })}
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
