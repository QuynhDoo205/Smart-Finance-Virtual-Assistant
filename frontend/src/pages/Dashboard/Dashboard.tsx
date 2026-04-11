
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, TrendingUp, Target, RefreshCw } from 'lucide-react';
import { dashboardApi } from '../../utils/api';
import type { DashboardSummary, Transaction, Budget } from '../../utils/api';
import authStore from '../../store/authStore';

// Fallback data khi chưa có API/DB
const fallbackBudgetData = [
  { name: 'Ăn uống', value: 4500000, color: '#0EA5E9' },
  { name: 'Di chuyển', value: 1200000, color: '#8B5CF6' },
  { name: 'Mua sắm', value: 2000000, color: '#F59E0B' },
  { name: 'Tiết kiệm', value: 3000000, color: '#10B981' },
];

const fallbackTransactions = [
  { id: 1, title: 'Cà phê Highland', amount: 65000, date: 'Hôm nay', category_name: 'Ăn uống', type: 'expense' as const, transaction_date: '', category_icon: '', category_color: '#F97316' },
  { id: 2, title: 'Lương tháng 4', amount: 15000000, date: 'Hôm qua', category_name: 'Thu nhập', type: 'income' as const, transaction_date: '', category_icon: '', category_color: '#10B981' },
  { id: 3, title: 'GrabBike', amount: 40000, date: 'Hôm qua', category_name: 'Di chuyển', type: 'expense' as const, transaction_date: '', category_icon: '', category_color: '#8B5CF6' },
  { id: 4, title: 'Tiki - Mua sách', amount: 320000, date: '02/04/2026', category_name: 'Mua sắm', type: 'expense' as const, transaction_date: '', category_icon: '', category_color: '#F59E0B' },
];

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  const user = authStore.getUser();

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
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
        dashboardApi.getTransactions(8),
        dashboardApi.getBudget(),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data.transactions);
      setBudgets(budgetRes.data.budgets);
      setApiConnected(true);
    } catch {
      // Sử dụng fallback data nếu API chưa hoạt động
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Build chart data from budgets or use fallback
  const pieData = budgets.length > 0
    ? budgets.map(b => ({ name: b.category_name, value: b.spent_amount, color: b.category_color }))
    : fallbackBudgetData;

  const displayTransactions = transactions.length > 0 ? transactions : fallbackTransactions;
  
  const displaySummary = summary || {
    totalBalance: 12500000,
    totalIncome: 15000000,
    totalExpense: 4650000,
    netSavings: 10350000,
    incomeChangePercent: 15,
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6">
      
      {/* Header section */}
      <motion.div variants={itemVars} className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-theme-text-primary mb-2">
            Xin chào, {user?.full_name?.split(' ').pop() ?? 'bạn'} 👋
          </h1>
          <p className="text-theme-text-muted">
            {apiConnected 
              ? `Tháng ${summary?.month ?? new Date().getMonth() + 1}/${summary?.year ?? new Date().getFullYear()} — Dữ liệu thực từ database` 
              : 'Tháng này bạn đang làm rất tốt! Tiếp tục phát huy nhé. 🚀'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* API Status badge */}
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
            apiConnected 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${apiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
            {apiConnected ? 'Live DB' : 'Demo mode'}
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-theme-text-muted ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVars} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-primary-500/20" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center">
              <Wallet className="text-primary-400 w-6 h-6" />
            </div>
            <h3 className="text-theme-text-muted font-medium">Tổng Số Dư</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight text-theme-text-primary">
            {loading ? '—' : formatCurrency(displaySummary.totalBalance)}
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-success">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{displaySummary.incomeChangePercent >= 0 ? '+' : ''}{displaySummary.incomeChangePercent}% so với tháng trước</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <ArrowDownRight className="text-emerald-400 w-6 h-6" />
            </div>
            <h3 className="text-theme-text-muted font-medium">Tổng Thu (Tháng)</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight text-theme-text-primary">
            {loading ? '—' : formatCurrency(displaySummary.totalIncome)}
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-emerald-400">
            <ArrowDownRight className="w-4 h-4 mr-1" />
            <span>Thu nhập tháng này</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-rose-500/20" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center">
              <ArrowUpRight className="text-rose-400 w-6 h-6" />
            </div>
            <h3 className="text-theme-text-muted font-medium">Tổng Chi (Tháng)</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight text-theme-text-primary">
            {loading ? '—' : formatCurrency(displaySummary.totalExpense)}
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-rose-400">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            <span>Chi tiêu tháng này</span>
          </div>
        </div>
      </motion.div>

      {/* Budget Progress + Savings */}
      {budgets.length > 0 && (
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-theme-text-primary flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-400" />
              Ngân sách tháng này
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.slice(0, 4).map(budget => (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-theme-text-muted">{budget.category_name}</span>
                  <span className="text-theme-text-primary">{formatCurrency(budget.spent_amount)} / {formatCurrency(budget.limit_amount)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${budget.usage_percent >= 90 ? 'bg-rose-500' : budget.usage_percent >= 70 ? 'bg-yellow-500' : 'bg-primary-500'}`}
                    style={{ width: `${Math.min(budget.usage_percent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-theme-text-muted">{budget.usage_percent}% đã dùng</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pie Chart */}
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-3xl lg:col-span-1 border border-white/5 shadow-2xl flex flex-col h-[500px]">
          <h3 className="text-lg font-bold text-theme-text-primary mb-6">Cơ cấu Ngân sách</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '1rem', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto pt-6 space-y-3">
            {pieData.slice(0, 5).map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-theme-text-muted text-sm truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="text-theme-text-primary font-medium text-sm">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Transactions List */}
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-3xl lg:col-span-2 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-theme-text-primary">Giao dịch gần đây</h3>
            <button className="text-sm text-primary-400 hover:text-primary-300 font-medium">Xem tất cả</button>
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-theme-text-muted text-sm">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {displayTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                      ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20' : 'bg-[#111827] text-theme-text-muted group-hover:bg-[#1F2937]'}
                    `}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-theme-text-primary font-semibold">{tx.title}</h4>
                      <p className="text-xs text-theme-text-muted mt-0.5">
                        {formatDate(tx.transaction_date)} • {tx.category_name}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>

      {/* Savings Progress (if API data available) */}
      {apiConnected && summary && (
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-3xl border border-white/5">
          <h3 className="text-lg font-bold text-theme-text-primary mb-4">💰 Tiết kiệm tháng này</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-sm text-theme-text-muted mb-1">Thu nhập</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(summary.totalIncome)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-sm text-theme-text-muted mb-1">Chi tiêu</p>
              <p className="text-xl font-bold text-rose-400">{formatCurrency(summary.totalExpense)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-sm text-theme-text-muted mb-1">Tiết kiệm được</p>
              <p className={`text-xl font-bold ${summary.netSavings >= 0 ? 'text-primary-400' : 'text-rose-400'}`}>
                {formatCurrency(summary.netSavings)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
