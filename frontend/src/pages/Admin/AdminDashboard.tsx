import { motion } from 'framer-motion';
import { 
  Users, Activity, DollarSign, ArrowUpRight, 
  ArrowDownRight, ShieldCheck, UserPlus, Search, 
  Filter, MoreHorizontal, Settings, Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.getUsers()
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (usersRes.success) setUsers(usersRes.data.users);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-sky-400" />
            Hệ thống Quản trị
          </h1>
          <p className="text-theme-text-muted mt-1">Chào mừng Admin. Đây là tổng quan toàn bộ hệ thống NovaFinance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-2">
            <Settings className="w-4 h-4" /> Cài đặt hệ thống
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Tổng người dùng', value: stats?.totalUsers, icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10', trend: (stats?.userGrowth >= 0 ? '+' : '') + stats?.userGrowth + '%' },
          { label: 'Tổng giao dịch', value: stats?.totalTransactions, icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10', trend: 'REAL-TIME' },
          { label: 'Tổng tiền lưu thông', value: fmt(stats?.totalVolume || 0) + 'đ', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: 'CUMULATIVE' },
          { label: 'Tỉ lệ hoạt động', value: stats?.activityRate + '%', icon: ArrowUpRight, color: 'text-orange-400', bg: 'bg-orange-500/10', trend: '7 DAYS' },
        ].map((s, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel p-6 rounded-3xl border-white/5 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${s.bg} blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-700`} />
            <div className="relative z-10 flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                {s.trend}
              </span>
            </div>
            <div className="mt-4 relative z-10">
              <p className="text-xs font-bold text-theme-text-muted uppercase tracking-widest">{s.label}</p>
              <h3 className="text-2xl font-black text-white mt-1">{s.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-[2.5rem] border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Hoạt động 7 ngày qua</h3>
            <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-theme-text-muted outline-none">
              <option>Theo tuần</option>
              <option>Theo tháng</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.dailyStats || []}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(v) => new Date(v).toLocaleDateString('vi-VN', { weekday: 'short' })}
                  axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latest Users */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5">
          <h3 className="text-xl font-bold text-white mb-6">Người dùng mới</h3>
          <div className="space-y-5">
            {stats?.latestUsers?.map((u: any) => (
              <div key={u.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{u.name}</p>
                  <p className="text-[10px] text-theme-text-muted truncate">{u.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-theme-text-muted">
                    {new Date(u.created_at).toLocaleDateString('vi-VN')}
                  </p>
                  {u.is_admin && <span className="text-[8px] font-black text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded border border-sky-400/20">ADMIN</span>}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-sky-400 hover:bg-white/10 transition-all">
            Xem tất cả người dùng
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-white">Quản lý Tài khoản</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
              <input 
                type="text" 
                placeholder="Tìm người dùng..." 
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-sky-500/50 transition-all w-full md:w-64"
              />
            </div>
            <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-theme-text-muted hover:text-white transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-4 text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Người dùng</th>
                <th className="px-8 py-4 text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Trạng thái</th>
                <th className="px-8 py-4 text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Ngày tham gia</th>
                <th className="px-8 py-4 text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Quyền hạn</th>
                <th className="px-8 py-4 text-[10px] font-black text-theme-text-muted uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-white">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{u.name}</p>
                        <p className="text-[10px] text-theme-text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 text-[10px] font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Ngoại tuyến
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-sm text-theme-text-muted">
                    {new Date(u.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      {u.is_admin ? (
                        <span className="px-2 py-1 rounded-lg bg-sky-500/10 text-sky-400 text-[10px] font-black border border-sky-500/20">ADMIN</span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-white/5 text-theme-text-muted text-[10px] font-black border border-white/10">USER</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 rounded-lg text-theme-text-muted hover:text-white hover:bg-white/5 transition-all">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
