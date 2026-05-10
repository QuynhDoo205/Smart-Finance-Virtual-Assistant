import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, HeartPulse, Shield, Siren, ArrowDownToLine, Flame, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardApi } from '../../utils/api';

export default function CrisisManager() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await dashboardApi.getSummary();
        if (res.success) setSummary(res.data);
      } catch (err) {
        console.error("Failed to load health summary:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  const isCrisis = summary?.isSurvivalMode || (summary?.totalExpense > summary?.totalIncome && summary?.totalIncome > 0);
  const usagePercent = summary?.totalIncome > 0 ? Math.round((summary.totalExpense / summary.totalIncome) * 100) : 0;


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
      
      {/* Dynamic Hero Banner */}
      <motion.div 
        variants={itemVars} 
        className={`relative rounded-[2rem] overflow-hidden p-[2px] transition-all duration-500 shadow-2xl ${
          isCrisis 
            ? 'shadow-red-500/15 bg-gradient-to-r from-red-500/50 to-orange-500/50' 
            : 'shadow-emerald-500/15 bg-gradient-to-r from-emerald-500/50 to-sky-500/50'
        }`}
      >
        <div className="absolute inset-0 opacity-[0.03] bg-white mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
        <div className="relative bg-[#0F172A]/90 backdrop-blur-3xl rounded-[1.9rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className={`w-24 h-24 shrink-0 rounded-full flex items-center justify-center border-2 relative ${
            isCrisis ? 'bg-red-500/20 border-red-500/50' : 'bg-emerald-500/20 border-emerald-500/50'
          }`}>
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-20 animate-ping ${isCrisis ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
            {isCrisis ? <AlertTriangle className="w-12 h-12 text-red-500" /> : <CheckCircle className="w-12 h-12 text-emerald-500" />}
          </div>
          
          <div className="flex-1 text-center md:text-left text-theme-text-primary z-10">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight">
                {isCrisis ? 'Trung tâm Giải quyết Khủng hoảng' : 'Sức khỏe Tài chính Tuyệt vời'}
              </h1>
              {isCrisis ? (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold uppercase rounded flex items-center gap-1"><Siren className="w-3 h-3" /> SOS</span>
              ) : (
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase rounded flex items-center gap-1"><Shield className="w-3 h-3" /> An toàn</span>
              )}
            </div>
            <p className={`${isCrisis ? 'text-red-200/80' : 'text-emerald-200/80'} text-lg`}>
              {isCrisis 
                ? 'Hệ thống phát hiện dấu hiệu rủi ro. Hãy xem các gợi ý bên dưới để cân bằng lại dòng tiền.'
                : 'Bạn đang quản lý tài chính rất tốt! Thu nhập của bạn đang bao phủ toàn bộ chi tiêu.'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status: Pulse Check */}
        <motion.div variants={itemVars} className={`glass-panel p-8 rounded-3xl relative overflow-hidden ${isCrisis ? 'border-orange-500/20' : 'border-emerald-500/20'}`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${isCrisis ? 'bg-orange-500/10' : 'bg-emerald-500/10'}`} />
          <h2 className="text-xl font-bold text-theme-text-primary mb-6 flex items-center gap-2">
            <HeartPulse className={`w-6 h-6 ${isCrisis ? 'text-orange-400' : 'text-emerald-400'}`} />
            Trạng thái Sức khỏe Tài chính
          </h2>
          
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              isCrisis ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <div>
                <h4 className={`${isCrisis ? 'text-orange-400' : 'text-emerald-400'} font-bold`}>
                  {isCrisis ? 'Cảnh báo: Chi tiêu cao' : 'Tỷ lệ Chi tiêu / Thu nhập'}
                </h4>
                <p className="text-sm text-theme-text-muted mt-1">Đã sử dụng {usagePercent}% thu nhập tháng này.</p>
              </div>
              {isCrisis ? <Flame className="w-6 h-6 text-orange-500" /> : <CheckCircle className="w-6 h-6 text-emerald-500" />}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] hover:bg-[var(--theme-bg-surface)] transition-colors">
              <div>
                <h4 className="text-gray-200 font-bold">Số dư khả dụng</h4>
                <p className="text-sm text-theme-text-muted mt-1">Hiện tại: {new Intl.NumberFormat('vi-VN').format(summary?.totalBalance || 0)} đ</p>
              </div>
              <Shield className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div variants={itemVars} className="glass-panel p-8 rounded-3xl border-[var(--theme-subtle-border)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-xl font-bold text-theme-text-primary mb-6 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
            AI Gợi ý Giải pháp
          </h2>
          
          <ul className="space-y-4">
            {isCrisis ? (
              <>
                <li className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--theme-subtle-bg)] transition-colors group cursor-pointer border border-transparent hover:border-[var(--theme-subtle-border)]">
                  <div className="mt-1 w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                    <ArrowDownToLine className="w-3 h-3 text-rose-400" />
                  </div>
                  <div>
                    <strong className="text-theme-text-primary block group-hover:text-rose-400 transition-colors">Tạm khoá thẻ Tín dụng phụ</strong>
                    <span className="text-sm text-theme-text-muted leading-relaxed block mt-1">Hạn chế các khoản quẹt thẻ không kiểm soát trong 14 ngày tới.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--theme-subtle-bg)] transition-colors group cursor-pointer border border-transparent hover:border-[var(--theme-subtle-border)]">
                  <div className="mt-1 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-3 h-3 text-amber-500" />
                  </div>
                  <div>
                    <strong className="text-theme-text-primary block group-hover:text-amber-400 transition-colors">Chế độ "Thắt lưng buộc bụng"</strong>
                    <span className="text-sm text-theme-text-muted leading-relaxed block mt-1">Ưu tiên tối đa cho các nhu cầu thiết yếu và tạm dừng giải trí.</span>
                  </div>
                </li>
              </>
            ) : (
              <li className="flex flex-col items-center justify-center py-6 text-center">
                <Sparkles className="w-8 h-8 text-indigo-400 mb-2" />
                <p className="text-sm text-theme-text-muted">Mọi thứ đều ổn định. Hãy duy trì thói quen ghi chép chi tiêu mỗi ngày nhé!</p>
              </li>
            )}
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
