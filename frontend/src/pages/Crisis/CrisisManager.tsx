import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, HeartPulse, Shield, Siren, ArrowDownToLine, Flame } from 'lucide-react';

export default function CrisisManager() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVars = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Red Hero Banner */}
      <motion.div variants={itemVars} className="relative rounded-[2rem] overflow-hidden p-[2px] shadow-[0_0_50px_rgba(239,68,68,0.15)] bg-gradient-to-r from-red-500/50 to-orange-500/50">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="relative bg-[#0F172A]/90 backdrop-blur-3xl rounded-[1.9rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 shrink-0 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/50 relative">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          
          <div className="flex-1 text-center md:text-left text-theme-text-primary z-10">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight">Trung tâm Giải quyết Khủng hoảng</h1>
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold uppercase rounded flex items-center gap-1"><Siren className="w-3 h-3" /> SOS</span>
            </div>
            <p className="text-red-200/80 text-lg">
              Giúp bạn vượt qua các giai đoạn khó khăn tài chính: Giảm thu nhập, chi tiêu vượt mức, hoặc các tình huống khẩn cấp.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status: Pulse Check */}
        <motion.div variants={itemVars} className="glass-panel p-8 rounded-3xl border-orange-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-xl font-bold text-theme-text-primary mb-6 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-orange-400" />
            Trạng thái Sức khỏe Tài chính
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div>
                <h4 className="text-orange-400 font-bold">Cảnh báo: Chi tiêu Mua sắm</h4>
                <p className="text-sm text-theme-text-muted mt-1">Đã vượt 120% ngân sách tháng này.</p>
              </div>
              <Flame className="w-6 h-6 text-orange-500" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div>
                <h4 className="text-gray-200 font-bold">Quỹ Khẩn cấp</h4>
                <p className="text-sm text-theme-text-muted mt-1">Đủ duy trì sinh hoạt trong 2.5 tháng (An toàn).</p>
              </div>
              <Shield className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div variants={itemVars} className="glass-panel p-8 rounded-3xl border-rose-500/20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-xl font-bold text-theme-text-primary mb-6 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            AI Gợi ý Giải pháp
          </h2>
          
          <ul className="space-y-4">
            <li className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/10">
              <div className="mt-1 w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                <ArrowDownToLine className="w-3 h-3 text-rose-400" />
              </div>
              <div>
                <strong className="text-theme-text-primary block group-hover:text-rose-400 transition-colors">Tạm khoá thẻ Tín dụng phụ</strong>
                <span className="text-sm text-theme-text-muted leading-relaxed block mt-1">Hạn chế các khoản quẹt thẻ không kiểm soát trong 14 ngày tới.</span>
              </div>
            </li>
            
            <li className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/10">
              <div className="mt-1 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-3 h-3 text-amber-500" />
              </div>
              <div>
                <strong className="text-theme-text-primary block group-hover:text-amber-400 transition-colors">Kích hoạt Chế độ "Thắt lưng buộc bụng"</strong>
                <span className="text-sm text-theme-text-muted leading-relaxed block mt-1">Nova AI sẽ nhắc nhở mạnh tay hơn và tự động ẩn số dư thẻ tín dụng để tránh cám dỗ.</span>
              </div>
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Emergency Action */}
      <motion.div variants={itemVars} className="flex justify-center pt-4">
        <button className="relative group px-8 py-4 bg-[#111827] border border-red-500/30 hover:border-red-500 rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:scale-105 active:scale-95">
          <div className="absolute inset-0 w-full h-full bg-red-500/10 group-hover:bg-red-500/20 transition-colors" />
          <span className="relative z-10 flex items-center gap-2 font-bold text-red-500 group-hover:text-red-400 uppercase tracking-widest text-sm">
            <Siren className="w-5 h-5" /> Rút tiền từ Quỹ Dự phòng (Chỉ khi khẩn cấp)
          </span>
        </button>
      </motion.div>
      
    </motion.div>
  );
}
