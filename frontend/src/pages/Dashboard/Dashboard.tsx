
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, TrendingUp } from 'lucide-react';

const budgetData = [
  { name: 'Ăn uống', value: 4500000, color: '#0EA5E9' },
  { name: 'Di chuyển', value: 1200000, color: '#8B5CF6' },
  { name: 'Mua sắm', value: 2000000, color: '#F59E0B' },
  { name: 'Tiết kiệm', value: 3000000, color: '#10B981' },
];

const recentTransactions = [
  { id: 1, title: 'Cà phê Highland', amount: -65000, date: 'Hôm nay', category: 'Ăn uống', type: 'expense' },
  { id: 2, title: 'Lương tháng 3', amount: 15000000, date: 'Hôm qua', category: 'Thu nhập', type: 'income' },
  { id: 3, title: 'GrabBike', amount: -40000, date: 'Hôm qua', category: 'Di chuyển', type: 'expense' },
  { id: 4, title: 'Tiki - Mua sách', amount: -320000, date: '02/04/2026', category: 'Mua sắm', type: 'expense' },
];

export default function Dashboard() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6">
      
      {/* Header section */}
      <motion.div variants={itemVars} className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Tổng quan Tài chính</h1>
          <p className="text-gray-400">Tháng này bạn đang làm rất tốt! Tiếp tục phát huy nhé. 🚀</p>
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
            <h3 className="text-gray-400 font-medium">Tổng Số Dư</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight text-white">{formatCurrency(12500000)}</p>
          <div className="mt-4 flex items-center text-sm font-medium text-success">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+15% so với tháng trước</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border-t-emerald-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <ArrowDownRight className="text-emerald-400 w-6 h-6" />
            </div>
            <h3 className="text-gray-400 font-medium">Tổng Thu (Tháng)</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight text-white">{formatCurrency(15000000)}</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border-t-rose-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-rose-500/20" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center">
              <ArrowUpRight className="text-rose-400 w-6 h-6" />
            </div>
            <h3 className="text-gray-400 font-medium">Tổng Chi (Tháng)</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight text-white">{formatCurrency(4650000)}</p>
        </div>
      </motion.div>

      {/* Main Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pie Chart */}
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-3xl lg:col-span-1 border border-white/5 shadow-2xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Cơ cấu Ngân sách</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '1rem', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {budgetData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-300 text-sm">{item.name}</span>
                </div>
                <span className="text-white font-medium text-sm">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Transactions List */}
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-3xl lg:col-span-2 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Giao dịch gần đây</h3>
            <button className="text-sm text-primary-400 hover:text-primary-300 font-medium">Xem tất cả</button>
          </div>
          
          <div className="space-y-4 flex-1">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                    ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20' : 'bg-[#111827] text-gray-400 group-hover:bg-[#1F2937]'}
                  `}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{tx.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{tx.date} • {tx.category}</p>
                  </div>
                </div>
                <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                  {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
