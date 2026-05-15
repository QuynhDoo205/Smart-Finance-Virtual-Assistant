import { motion, AnimatePresence } from 'framer-motion';
import { Database, Server, Cpu, HardDrive, Terminal, RefreshCw, Layers, ShieldCheck, X, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';

export default function AdminDatabase() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDatabaseStats();
      if (res.success) setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
      {/* Table Detail Modal */}
      <AnimatePresence>
        {selectedTable && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTable(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl bg-[#161B2B] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Bảng: {selectedTable.name}</h3>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{selectedTable.rows} bản ghi thực tế</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTable(null)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Kích thước vật lý</p>
                    <p className="text-lg font-bold text-white">{selectedTable.size}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Trạng thái</p>
                    <p className="text-lg font-bold text-emerald-400 uppercase tracking-tighter">Healthy</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Hành động gần đây
                  </p>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 leading-relaxed italic">
                    Hệ thống đang theo dõi các thay đổi trực tiếp trên bảng này. Mọi thao tác Thêm/Sửa/Xóa đều được ghi lại trong Audit Log.
                  </div>
                </div>
              </div>

              <button className="w-full mt-8 py-4 rounded-2xl bg-sky-500 text-white text-xs font-black hover:bg-sky-600 transition-all shadow-xl shadow-sky-500/20 uppercase tracking-widest">
                Tối ưu hóa bảng (VACUUM)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-sky-400" />
            Cơ sở dữ liệu
          </h1>
          <p className="text-sm text-slate-500 mt-1">Giám sát trạng thái và dung lượng hệ thống lưu trữ Real-time.</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
          {loading ? 'ĐANG CẬP NHẬT...' : 'LÀM MỚI DỮ LIỆU'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Trạng thái Server', value: data?.serverStatus || '...', icon: Server, color: 'text-emerald-400' },
          { label: 'Tỉ lệ CPU', value: data?.cpuUsage || '...', icon: Cpu, color: 'text-sky-400' },
          { label: 'Dung lượng đã dùng', value: data?.totalSize || '...', icon: HardDrive, color: 'text-purple-400' },
        ].map((item, idx) => (
          <div key={idx} className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="flex items-center justify-between mb-4">
              <item.icon className={`w-7 h-7 ${item.color}`} />
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">NORMAL</span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
            <h3 className="text-2xl font-black text-white mt-1">{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A]">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            Chi tiết các Bảng
          </h3>
          <div className="space-y-4">
            {data?.tables?.map((t: any) => (
              <motion.div 
                key={t.name} 
                whileHover={{ x: 10 }}
                onClick={() => setSelectedTable(t)}
                className="flex items-center justify-between p-5 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white/5 text-slate-400 group-hover:bg-sky-500/10 group-hover:text-sky-400 transition-all">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white group-hover:text-sky-400 transition-all">{t.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black">{t.rows} bản ghi</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{t.size}</p>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Healthy</p>
                  </div>
                  <RefreshCw className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A] flex flex-col items-center justify-center text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
            <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border-4 border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Bảo mật Cơ sở dữ liệu</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">Hệ thống đang sử dụng PostgreSQL với cơ chế mã hóa AES-256. Mọi thay đổi đều được sao lưu định kỳ mỗi 24 giờ vào máy chủ dự phòng.</p>
          </div>
          <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest">
            Xem lịch sử sao lưu
          </button>
        </div>
      </div>
    </motion.div>
  );
}

