import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wifi, Zap, CheckCircle2, ChevronRight, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../utils/api';
import authStore from '../../store/authStore';

type ExpenseItem = {
  id: string;
  name: string;
  icon: React.ReactNode;
  amount: string;
  color: string;
};

export default function OnboardingSurvey() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'cyberpunk');
  }, []);

  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 'rent', name: 'Nhà ở & Tiện ích', icon: <Home className="w-5 h-5 text-sky-400" />, amount: '', color: 'bg-sky-500' },
    { id: 'electric', name: 'Điện / Nước', icon: <Zap className="w-5 h-5 text-amber-400" />, amount: '', color: 'bg-amber-500' },
    { id: 'internet', name: 'Internet / 4G', icon: <Wifi className="w-5 h-5 text-fuchsia-400" />, amount: '', color: 'bg-fuchsia-500' },
  ]);

  const handleAmountChange = (id: string, value: string) => {
    const numericStr = value.replace(/\D/g, '');
    if (numericStr === '') {
      setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, amount: '' } : exp));
      return;
    }
    const formatted = new Intl.NumberFormat('vi-VN').format(Number(numericStr));
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, amount: formatted } : exp));
  };

  const totalFixed = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (Number(curr.amount.replace(/\D/g, '')) || 0), 0);
  }, [expenses]);



  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      // Prepare data for API
      const monthlyIncome = 0; // The UI currently doesn't ask for total income, I'll default to 0 or we could add an input
      const data = expenses.map(exp => ({
        categoryName: exp.name,
        amount: Number(exp.amount.replace(/\D/g, '')) || 0
      }));

      await userApi.updateOnboarding(monthlyIncome, data);
      
      // Update local storage user state to reflect onboarding completed
      const user = authStore.getUser();
      if (user) {
        authStore.setAuth(authStore.getToken() || '', { ...user, onboarding_completed: true });
      }

      setTimeout(() => {
        navigate('/app');
      }, 2000);
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
      setIsFinishing(false);
      setError('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex-1 flex min-h-screen relative bg-[#030712] overflow-hidden">
      {/* --- ERROR TOAST --- */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border border-white/10">
              <Activity className="w-4 h-4" /> {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* LEFT SIDE: Visual Data Representation */}
      <div className="hidden lg:flex w-[40%] relative flex-col justify-center items-center p-8 border-r border-[var(--theme-subtle-border)] overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[100px] animate-pulse delay-1000" />
          <div className="absolute inset-0 opacity-[0.03] bg-white mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 w-full max-w-sm flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#1F2937]/50 border border-[var(--theme-subtle-border)] flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(56,189,248,0.2)] backdrop-blur-xl">
            <PieChartIcon className="w-7 h-7 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-theme-text-primary mb-1.5 tracking-tight">Phân tích Real-time</h2>
          <p className="text-theme-text-muted text-sm text-center mb-8">Hệ thống đang mô phỏng dòng tiền cố định của bạn.</p>

          {/* Dynamic Stacked Bar */}
          <div className="w-full h-8 rounded-full bg-[#111827] border border-[var(--theme-subtle-border)] overflow-hidden flex shadow-inner">
            <AnimatePresence>
              {expenses.map(exp => {
                const val = Number(exp.amount.replace(/\D/g, '')) || 0;
                if (val === 0) return null;
                const widthPercent = Math.min((val / Math.max(totalFixed, 1000000)) * 100, 100);
                return (
                  <motion.div
                    key={exp.id}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: `${widthPercent}%`, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className={`h-full ${exp.color} transition-all duration-500 ease-out`}
                  />
                )
              })}
            </AnimatePresence>
          </div>

          <div className="mt-5 p-4 w-full glass-panel flex flex-col items-center border-[0.5px] border-primary-500/20 shadow-[0_0_20px_rgba(56,189,248,0.1)]">
            <span className="text-theme-text-muted text-xs uppercase tracking-widest font-semibold mb-1">Tổng khóa ngân sách</span>
            <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tabular-nums tracking-tight">
              {new Intl.NumberFormat('vi-VN').format(totalFixed)}<span className="text-base ml-1.5 text-theme-text-muted">đ</span>
            </span>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE: Interactive Form */}
      <div className="w-full lg:w-[60%] flex flex-col justify-center p-6 sm:p-10 relative">
        <div className="max-w-lg w-full mx-auto relative z-10">
          
          <div className="flex items-center gap-2 mb-7">
            <div className="h-1.5 w-12 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
            <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step === 2 ? 'bg-primary-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'bg-[var(--theme-bg-surface)]'}`} />
            <div className="ml-auto flex items-center gap-2 text-primary-400 font-bold text-sm tracking-widest uppercase bg-primary-500/10 px-4 py-1.5 rounded-full border border-primary-500/20">
              <Activity className="w-4 h-4 animate-pulse" />
              Bước {step}/2
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-3xl sm:text-4xl font-extrabold text-theme-text-primary mb-3 tracking-tight">
                  Sinh tồn an toàn.
                </h1>
                <p className="text-theme-text-muted text-sm mb-6 leading-relaxed font-medium">
                  Nhập các khoản chi phí mà bạn <strong>bắt buộc phải trả</strong> mỗi tháng. AI sẽ cách ly số tiền này khỏi quỹ tiêu vặt ngay khi nhận lương.
                </p>

                <div className="space-y-3 mb-6">
                  {expenses.map((exp, idx) => (
                    <motion.div 
                      key={exp.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative"
                    >
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent rounded-[1.2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
                      
                      <div className="relative p-2.5 sm:p-3 rounded-[1.2rem] bg-[#111827] border border-[var(--theme-subtle-border)] transition-all duration-300 flex items-center gap-3 hover:bg-[#1F2937]/50 shadow-lg">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-[#1F2937] to-[#111827] flex items-center justify-center flex-shrink-0 border border-[var(--theme-subtle-border)] shadow-inner`}>
                          {exp.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-[11px] text-theme-text-muted font-semibold uppercase tracking-wider block mb-0.5">{exp.name}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              className="bg-transparent text-xl sm:text-2xl font-bold text-theme-text-primary focus:outline-none w-full placeholder-theme-text-muted/50 transition-all font-sans"
                              placeholder="0"
                              value={exp.amount}
                              onChange={(e) => handleAmountChange(exp.id, e.target.value)}
                            />
                            <span className="text-theme-text-muted font-medium pr-3">đ</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setStep(2); handleFinish(); }}
                  className="btn-primary w-full flex items-center justify-between px-6 py-3.5 text-base shadow-[0_8px_24px_rgba(14,165,233,0.3)] bg-gradient-to-r from-primary-600 to-sky-400"
                >
                  <span className="font-bold">Nhập Dữ Liệu & Bắt Đầu Ngay</span>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <ChevronRight className="w-5 h-5 text-theme-text-primary" />
                  </div>
                </motion.button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-12"
              >
                <div className="relative w-28 h-28 mb-8">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-[2px] border-dashed border-primary-500/40"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 rounded-full border-[1.5px] border-accent-400/30"
                  />
                  
                  <div className="absolute inset-6 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                    {isFinishing ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <CheckCircle2 className="w-10 h-10 text-theme-text-primary" />
                      </motion.div>
                    ) : (
                      <motion.div 
                        animate={{ opacity: [0.5, 1, 0.5] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin"
                      />
                    )}
                  </div>
                </div>
                
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mb-4">
                  {isFinishing ? "Thiết lập hoàn tất!" : "AI đang kết nối..."}
                </h2>
                <p className="text-theme-text-muted text-sm leading-relaxed max-w-sm mx-auto mb-8">
                  {isFinishing 
                    ? "Ngân sách an toàn của bạn đã được lá chắn AI kích hoạt. Mọi rủi ro cạn tiền giờ đã được lường trước." 
                    : "Hệ thống đang phân tích hành vi chi tiêu và khởi tạo các Lọ tài chính an toàn cho bạn."}
                </p>

                {!isFinishing && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFinish}
                    className="btn-primary px-10 py-4 text-lg bg-emerald-500 hover:bg-emerald-400 absolute opacity-0 animate-[fadeIn_0.5s_ease-in-out_2s_forwards]"
                  >
                    Bắt đầu sử dụng
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
