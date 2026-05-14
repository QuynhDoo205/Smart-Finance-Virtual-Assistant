import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, ShieldAlert, HeartPulse, Shield, Siren, 
  ArrowDownToLine, Flame, CheckCircle, Loader2, Sparkles, 
  X, DollarSign, Wallet, Clock, ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardApi, transactionsApi } from '../../utils/api';

function numberToVietnameseText(number: number): string {
  if (number === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroup(n: number): string {
    let s = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0) s += digits[h] + ' trăm ';
    if (t > 1) {
      s += digits[t] + ' mươi ';
      if (u === 1) s += 'mốt';
      else if (u === 5) s += 'lăm';
      else if (u > 0) s += digits[u];
    } else if (t === 1) {
      s += 'mười ';
      if (u === 5) s += 'lăm';
      else if (u > 0) s += digits[u];
    } else if (h > 0 && u > 0) {
      s += 'lẻ ' + digits[u];
    } else if (u > 0) {
      s += digits[u];
    }
    return s.trim();
  }

  let res = '';
  let i = 0;
  let tempNum = number;
  while (tempNum > 0) {
    const group = tempNum % 1000;
    if (group > 0) {
      res = readGroup(group) + ' ' + units[i] + ' ' + res;
    }
    tempNum = Math.floor(tempNum / 1000);
    i++;
  }
  return res.trim().charAt(0).toUpperCase() + res.trim().slice(1) + ' đồng';
}

export default function CrisisManager() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [emergencyTransactions, setEmergencyTransactions] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [sumRes, transRes] = await Promise.all([
        dashboardApi.getSummary(),
        transactionsApi.list(50)
      ]);
      
      if (sumRes.success) setSummary(sumRes.data);
      
      if (transRes.success) {
        const emergency = transRes.data.transactions.filter((t: any) => 
          (t.ghi_chu || t.note || "").includes("INTERNAL_TRANSFER")
        );
        setEmergencyTransactions(emergency);
      }
    } catch (err) {
      console.error("Failed to load crisis data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleWithdraw = async () => {
    const finalAmount = Number(withdrawAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      setNotification({ type: 'error', msg: 'Vui lòng nhập số tiền hợp lệ!' });
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await transactionsApi.emergencyWithdrawal(finalAmount, withdrawReason);
      if (res.success) {
        setNotification({ type: 'success', msg: `Đã rút ${new Intl.NumberFormat('vi-VN').format(finalAmount)}đ dự phòng!` });
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawReason('');
        await loadData();
      } else {
        setNotification({ type: 'error', msg: res.message || 'Giao dịch bị từ chối' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', msg: err.response?.data?.message || err.message || 'Có lỗi xảy ra' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getDisplayWithdrawAmount = () => {
    if (isInputFocused) return withdrawAmount === '' ? '' : withdrawAmount.toString();
    return withdrawAmount === '' ? '' : new Intl.NumberFormat('vi-VN').format(withdrawAmount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  const usagePercent = (summary?.totalIncome && Number(summary.totalIncome) > 0) 
    ? Math.round((Number(summary.totalExpense || 0) / Number(summary.totalIncome)) * 100) 
    : 0;
  
  const isWarning = usagePercent >= 70 && usagePercent <= 95;
  const isCrisis = usagePercent > 95 || summary?.isSurvivalMode;

  // Tính quỹ dự phòng (giả định 10% thu nhập là lọ dự phòng)
  const totalEmergencyLimit = Number(summary?.totalIncome || 0) * 0.1;
  const totalWithdrawn = emergencyTransactions.reduce((sum, t) => sum + Number(t.so_tien || t.amount || 0), 0);
  const remainingEmergency = Math.max(0, totalEmergencyLimit - totalWithdrawn);

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVars = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto pb-20 px-4">
      
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
              notification.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-bold text-sm">{notification.msg}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={itemVars} 
        className={`relative rounded-[2.5rem] overflow-hidden p-[2px] transition-all duration-700 shadow-2xl ${
          isCrisis 
            ? 'shadow-red-500/25 bg-gradient-to-r from-red-500 to-orange-500' 
            : isWarning
              ? 'shadow-amber-500/20 bg-gradient-to-r from-amber-500 to-orange-400'
              : 'shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-sky-500'
        }`}
      >
        <div className="relative bg-[#0F172A]/90 backdrop-blur-3xl rounded-[2.4rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          <div className={`w-28 h-28 shrink-0 rounded-[2rem] flex items-center justify-center border-2 relative ${
            isCrisis ? 'bg-red-500/20 border-red-500/50' : isWarning ? 'bg-amber-500/20 border-amber-500/50' : 'bg-emerald-500/20 border-emerald-500/50'
          }`}>
            <span className={`absolute inline-flex h-full w-full rounded-[2rem] opacity-20 animate-ping ${isCrisis ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            {isCrisis ? <AlertTriangle className="w-14 h-14 text-red-500" /> : isWarning ? <Flame className="w-14 h-14 text-amber-500" /> : <Shield className="w-14 h-14 text-emerald-500" />}
          </div>
          
          <div className="flex-1 text-center md:text-left z-10">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                {isCrisis ? 'Báo động Khủng hoảng' : isWarning ? 'Cảnh báo Ngân sách' : 'Sức khỏe Tài chính Tốt'}
              </h1>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5 ${
                isCrisis ? 'bg-red-500 text-white' : isWarning ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-white'
              }`}>
                {isCrisis ? <Siren className="w-3 h-3" /> : isWarning ? <Flame className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                {isCrisis ? 'SOS' : isWarning ? 'Warning' : 'Safe'}
              </div>
            </div>
            <p className="text-lg md:text-xl text-theme-text-muted font-medium leading-relaxed max-w-2xl">
              {isCrisis 
                ? 'Ngân sách của bạn đang thâm hụt nghiêm trọng. Hãy kích hoạt chế độ "Sống còn" và cắt giảm mọi chi phí không thiết yếu ngay lập tức.'
                : isWarning
                  ? 'Chi tiêu đang tiến gần ngưỡng giới hạn thu nhập. Bạn cần cân đối lại các khoản chi giải trí để giữ an toàn.'
                  : 'Mọi chỉ số đều đang ở vùng an toàn. Bạn đang kiểm soát rất tốt dòng tiền của mình.'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div variants={itemVars} className="glass-panel p-8 rounded-[2rem] relative overflow-hidden border-white/[0.05] h-full flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-theme-text-primary mb-8 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isCrisis ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                <HeartPulse className="w-6 h-6" />
              </div>
              Phân tích Chỉ số Sống còn
            </h2>
            
            <div className="space-y-6">
              <div className="relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-theme-text-muted uppercase tracking-widest">Tỷ lệ sử dụng Thu nhập</span>
                  <span className={`text-lg font-black ${isCrisis ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>{usagePercent}%</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(usagePercent, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${isCrisis ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="flex items-center gap-2 mb-2 text-theme-text-muted">
                    <Wallet className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Số dư ví</span>
                  </div>
                  <p className="text-xl font-black text-theme-text-primary">
                    {new Intl.NumberFormat('vi-VN').format(summary?.totalBalance || 0)}
                    <span className="text-xs ml-1 opacity-50">đ</span>
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10 border-dashed">
                  <div className="flex items-center gap-2 mb-2 text-sky-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Quỹ dự phòng còn</span>
                  </div>
                  <p className="text-xl font-black text-sky-400">
                    {new Intl.NumberFormat('vi-VN').format(remainingEmergency)}
                    <span className="text-xs ml-1 opacity-50">đ</span>
                  </p>
                  <p className="text-[9px] text-theme-text-muted mt-1 italic">Hạn mức ảo (10% thu nhập)</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="glass-panel p-8 rounded-[2rem] border-white/[0.05] relative overflow-hidden">
          <h2 className="text-xl font-bold text-theme-text-primary mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <Clock className="w-6 h-6" />
            </div>
            Lịch sử Rút khẩn cấp
          </h2>
          
          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
                {emergencyTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                    <ArrowDownToLine className="w-10 h-10 mb-4" />
                    <p className="text-xs italic">Chưa có giao dịch rút nào.</p>
                  </div>
                ) : (
                  emergencyTransactions.map((t, idx) => (
                    <motion.div 
                      key={t.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-10 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        <div>
                          <p className="text-sm font-bold text-white leading-none mb-1.5">
                            Rút {new Intl.NumberFormat('vi-VN').format(Number(t.so_tien || t.amount || 0))}đ
                          </p>
                          <p className="text-[10px] text-theme-text-muted italic flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t.ghi_chu?.replace('INTERNAL_TRANSFER: ', '') || t.tieu_de || t.title || 'Lý do khẩn cấp'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-theme-text-muted uppercase">
                          {t.ngay_giao_dich || t.transaction_date 
                            ? new Date(t.ngay_giao_dich || t.transaction_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                            : '--:--'}
                        </p>
                        <p className="text-[9px] font-bold text-theme-text-muted/60">
                          {t.ngay_giao_dich || t.transaction_date 
                            ? new Date(t.ngay_giao_dich || t.transaction_date).toLocaleDateString('vi-VN')
                            : 'Mới đây'}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVars} className="flex flex-col items-center gap-4 pt-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/60">Giao dịch nhạy cảm</p>
        <button 
          onClick={() => setShowWithdrawModal(true)}
          className="relative group px-10 py-5 bg-[#0F172A] border-2 border-red-500/30 hover:border-red-500 rounded-[2rem] overflow-hidden transition-all duration-500 shadow-[0_0_40px_rgba(239,68,68,0.15)] hover:shadow-[0_0_60px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 w-full h-full bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
          <span className="relative z-10 flex items-center gap-4 font-black text-red-500 group-hover:text-red-400 uppercase tracking-widest text-base">
            <Siren className="w-6 h-6 animate-pulse" /> RÚT TIỀN TỪ QUỸ DỰ PHÒNG
          </span>
        </button>
        <p className="text-xs text-theme-text-muted italic max-w-sm text-center">Tiền sẽ được "vật lý" trừ khỏi hạn mức tiết kiệm tháng này của bạn.</p>
      </motion.div>

      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isWithdrawing && setShowWithdrawModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#0F172A] border border-red-500/20 rounded-[2.5rem] p-10 relative z-10 shadow-[0_0_100px_rgba(239,68,68,0.2)]"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Xác nhận rút khẩn cấp?</h3>
                  <p className="text-sm text-theme-text-muted leading-relaxed">
                    Hành động này sẽ trừ vào <b>Quỹ dự phòng còn lại ({new Intl.NumberFormat('vi-VN').format(remainingEmergency)}đ)</b> của bạn.
                  </p>
                </div>

                <div className="w-full space-y-4 text-left">
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
                    <input 
                      type="text"
                      placeholder="Số tiền (VD: 1.000.000)"
                      value={getDisplayWithdrawAmount()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setWithdrawAmount(val === '' ? '' : Number(val));
                      }}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-xl font-bold text-white outline-none focus:border-red-500/50 transition-all"
                    />
                  </div>
                  {withdrawAmount !== '' && Number(withdrawAmount) > 0 && (
                    <p className="text-[10px] text-red-400 font-bold italic ml-2 -mt-2 animate-in fade-in slide-in-from-top-1">
                      ~ {numberToVietnameseText(Number(withdrawAmount))}
                    </p>
                  )}
                  <input 
                    type="text"
                    placeholder="Lý do rút..."
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white outline-none focus:border-red-500/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  <button
                    disabled={isWithdrawing}
                    onClick={() => setShowWithdrawModal(false)}
                    className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-theme-text-muted font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    disabled={isWithdrawing || !withdrawAmount}
                    onClick={handleWithdraw}
                    className="px-6 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-sm shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận rút'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </motion.div>
  );
}
