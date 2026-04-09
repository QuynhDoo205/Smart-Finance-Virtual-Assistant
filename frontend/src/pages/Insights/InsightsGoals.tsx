import { motion } from 'framer-motion';
import { Target, Lightbulb, TrendingUp, Sparkles, CheckCircle2, Crosshair, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'T1', savings: 4000000 },
  { month: 'T2', savings: 5500000 },
  { month: 'T3', savings: 8000000 },
  { month: 'T4', savings: 9500000 },
  { month: 'T5', savings: 12000000, projected: true },
  { month: 'T6', savings: 15000000, projected: true },
];

export default function InsightsGoals() {
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
          <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            Phân tích & Mục tiêu <Sparkles className="w-6 h-6 text-indigo-400" />
          </h1>
          <p className="text-gray-400">AI dự báo dòng tiền và theo dõi tiến độ các mục tiêu lớn của bạn.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* AI Insights Sidebar */}
        <motion.div variants={itemVars} className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-[2rem] border-indigo-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-indigo-400" />
              Insight từ Nova AI
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-sm text-indigo-100 leading-relaxed">
                  Bạn đang tiết kiệm <strong>tốt hơn 25%</strong> so với tháng trước. Nếu duy trì, bạn sẽ đạt mục tiêu "Mua xe" sớm hơn 2 tháng! 🚀
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 text-sm leading-relaxed">
                Thói quen mua sắm trực tuyến vào cuối tuần chiếm <strong>15%</strong> tổng chi. Cân nhắc chờ 24h trước khi bấm "Thanh toán" để giảm chi phí bốc đồng.
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 text-sm leading-relaxed">
                Khoản thu nhập từ "Freelance" đang ổn định. AI đề xuất tự động trích <strong>30%</strong> khoản này thẳng vào Tiết kiệm phòng ngừa rủi ro.
              </div>
            </div>
            
          </div>
        </motion.div>

        {/* Goals & Charts Main Area */}
        <motion.div variants={itemVars} className="lg:col-span-8 space-y-8">
          
          {/* Chart Card */}
          <div className="glass-panel p-6 md:p-8 rounded-[2rem] border-white/5">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> Dự báo Tăng trưởng Tài sản</span>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6b7280" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '1rem', color: '#fff' }}
                    formatter={(value: any) => [`${formatCurrency(value)} đ`, 'Tài sản']}
                  />
                  <Area type="monotone" dataKey="savings" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Goals list */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-400" /> Tiến độ Mục tiêu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Goal 1 */}
              <div className="glass-panel p-6 rounded-2xl border-white/5 group hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Crosshair className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">Mua xe máy mới</h4>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-white/10 text-white rounded-lg">Mục tiêu ngắn hạn</span>
                </div>
                <div className="flex justify-between items-end mb-2 text-sm">
                  <span className="font-bold text-white">{formatCurrency(15000000)} đ</span>
                  <span className="text-gray-400">/ 50.000.000 đ</span>
                </div>
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '30%' }} transition={{ duration: 1 }} className="h-full bg-indigo-500 rounded-full" />
                </div>
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Đi đúng tiến độ (Dự kiến Đạt: T8/2026)
                </p>
              </div>

              {/* Goal 2 */}
              <div className="glass-panel p-6 rounded-2xl border-white/5 group hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5 hidden" /> {/* Dummy hidden for layout */}
                      <Target className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">Quỹ Dự phòng Khẩn cấp</h4>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-white/10 text-white rounded-lg">An toàn</span>
                </div>
                <div className="flex justify-between items-end mb-2 text-sm">
                  <span className="font-bold text-white">{formatCurrency(45000000)} đ</span>
                  <span className="text-gray-400">/ 60.000.000 đ</span>
                </div>
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} transition={{ duration: 1.2 }} className="h-full bg-emerald-400 rounded-full" />
                </div>
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> Gần đạt mục tiêu!
                </p>
              </div>

            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
}
