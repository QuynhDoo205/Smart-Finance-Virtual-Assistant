import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Sparkles, AlertCircle, Loader2, ArrowRight, CheckCircle2, Eye, EyeOff, X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../../utils/api';
import type { UserProfile } from '../../utils/api';
import authStore from '../../store/authStore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [successUser, setSuccessUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        authStore.setAuth(response.data.token, response.data.user);
        setSuccessUser(response.data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError('');
    try {
      const response = await authApi.googleLogin(credentialResponse.credential);
      if (response.success && response.data) {
        authStore.setAuth(response.data.token, response.data.user);
        setSuccessUser(response.data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const proceedToApp = () => {
    if (!successUser) return;
    if (successUser.onboarding_completed) {
      navigate('/app');
    } else {
      navigate('/onboarding');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const response = await authApi.forgotPassword(forgotEmail);
      if (response.success) {
        setForgotMessage(response.message);
      }
    } catch (err) {
      setForgotMessage(err instanceof Error ? err.message : 'Lỗi khi gửi yêu cầu');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-screen relative shadow-2xl">
      
      {/* LEFT SIDE: Brand & Graphic */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Futuristic Finance" 
            className="w-full h-full object-cover opacity-80 mix-blend-lighten"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/10 via-[#030712]/40 to-[#030712] z-10" />
        </div>
        
        <div className="relative z-20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)]">
            <Sparkles className="text-theme-text-primary w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-theme-text-primary drop-shadow-md">
            Nova<span className="text-primary-400">Finance</span>
          </span>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative z-20 max-w-lg"
        >
          <div className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
            <h2 className="text-4xl font-extrabold text-theme-text-primary leading-tight mb-4 drop-shadow-lg">
              Quản trị dòng tiền,<br/>
              Kiến tạo tương lai.
            </h2>
            <p className="text-theme-text-muted text-lg">
              Hệ sinh thái tài chính AI siêu thực giúp bạn tối ưu hóa từng đồng thu nhập. Trải nghiệm ngay báo cáo thông minh và tự động hóa chia ngân sách.
            </p>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE: Content Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <AnimatePresence mode="wait">
          {!successUser ? (
            <motion.div 
              key="login-form"
              className="w-full max-w-md"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.5)] mb-4">
                  <Sparkles className="text-theme-text-primary w-7 h-7" />
                </div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  Nova<span className="text-primary-400">Finance</span>
                </h1>
              </div>

              <motion.div variants={itemVariants} className="mb-8 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-theme-text-primary mb-2">Đăng nhập</h2>
                <p className="text-theme-text-muted">Chào mừng bạn quay lại hệ thống</p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="glass-panel p-8 sm:p-10">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    <p className="text-sm text-rose-300">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-sm text-theme-text-muted font-medium ml-1">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-400 text-theme-text-muted">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        className="glass-input pl-11"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex justify-between items-center text-sm ml-1">
                      <span className="text-theme-text-muted font-medium">Mật khẩu</span>
                      <button 
                        type="button"
                        onClick={() => setShowForgotModal(true)} 
                        className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
                      >
                        Quên mật khẩu?
                      </button>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-400 text-theme-text-muted">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`glass-input pl-11 pr-12 ${password.length > 0 && password.length < 6 ? 'border-rose-500/50 bg-rose-500/5' : ''}`}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-theme-text-muted hover:text-primary-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {password.length > 0 && password.length < 6 && (
                      <p className="text-[10px] text-rose-400 font-bold ml-1">Mật khẩu tối thiểu 6 ký tự</p>
                    )}
                  </div>

                  <motion.button 
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    type="submit" 
                    className="btn-primary w-full flex justify-center items-center gap-2 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang xác thực...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Truy cập hệ thống</span>
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-[#111827] text-theme-text-muted rounded-full border border-white/5">Hoặc tiếp tục với</span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-4 items-center">
                    <div className="w-full max-w-sm flex justify-center py-2 bg-white rounded-xl overflow-hidden hover:bg-gray-50 transition-colors">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Đăng nhập Google bị gián đoạn')}
                        useOneTap
                        shape="pill"
                        text="continue_with"
                        width="320"
                      />
                    </div>
                  </div>
                </div>
                
                <p className="mt-8 text-center text-theme-text-muted">
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">
                    Đăng ký ngay
                  </Link>
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              key="success-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md text-center p-8 glass-panel border-primary-500/20"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-extrabold text-theme-text-primary mb-2">Xác thực thành công</h2>
              <p className="text-theme-text-muted mb-8">
                Chào mừng bạn quay lại, <span className="text-primary-400 font-bold text-lg">{successUser.full_name}</span>. Tài khoản của bạn đã sẵn sàng.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(56,189,248,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={proceedToApp}
                className="btn-primary w-full flex items-center justify-center gap-3 py-5 text-xl font-bold bg-gradient-to-r from-primary-600 to-sky-400"
              >
                Tiếp tục vào Dashboard
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowForgotModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 shadow-2xl border-white/10"
            >
              <button 
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 p-2 text-theme-text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-bold text-theme-text-primary mb-2">Quên mật khẩu?</h3>
              <p className="text-theme-text-muted mb-6 text-sm">Nhập email của bạn, chúng tôi sẽ gửi mật khẩu mới về Gmail của bạn.</p>

              {forgotMessage ? (
                <div className="text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                    {forgotMessage}
                  </div>
                  <button 
                    onClick={() => setShowForgotModal(false)}
                    className="btn-primary w-full"
                  >
                    Đã hiểu
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-sm text-theme-text-muted font-medium ml-1">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-400 text-theme-text-muted">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        className="glass-input pl-11"
                        placeholder="name@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        disabled={forgotLoading}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="btn-primary w-full flex justify-center items-center gap-2"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Gửi mật khẩu mới'
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
