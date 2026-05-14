import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Sparkles, AlertCircle, Loader2, ArrowRight, CheckCircle2, Eye, EyeOff, X } from 'lucide-react';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
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
    const token = credentialResponse.credential || credentialResponse;
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await authApi.googleLogin(token);
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

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => handleGoogleSuccess(tokenResponse.access_token),
    onError: () => setError('Đăng nhập Google bị gián đoạn'),
  });

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
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-[var(--theme-subtle-border)]">
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
          <div className="p-8 rounded-[2rem] bg-[var(--theme-subtle-bg)] backdrop-blur-md border border-[var(--theme-subtle-border)] shadow-2xl">
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Premium Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-accent-500/10 rounded-full blur-[100px] pointer-events-none" />

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

              <motion.div variants={itemVariants} className="mb-6 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-theme-text-primary mb-1">Đăng nhập</h2>
                <p className="text-xs text-theme-text-muted">Chào mừng bạn quay lại hệ thống</p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="glass-panel p-6 sm:p-8 max-w-[400px] mx-auto lg:ml-0">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <p className="text-[12px] text-rose-300">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[12px] text-theme-text-muted font-medium ml-1">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-400 text-theme-text-muted">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        className="glass-input pl-10 py-2.5 text-sm"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="flex justify-between items-center text-[12px] ml-1">
                      <span className="text-theme-text-muted font-medium">Mật khẩu</span>
                      <button 
                        type="button"
                        onClick={() => setShowForgotModal(true)} 
                        className="text-primary-400 hover:text-primary-300 transition-colors font-bold"
                      >
                        Quên mật khẩu?
                      </button>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-400 text-theme-text-muted">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`glass-input pl-10 pr-10 py-2.5 text-sm ${password.length > 0 && password.length < 6 ? 'border-rose-500/50 bg-rose-500/5' : ''}`}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-theme-text-muted hover:text-primary-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.99 }}
                    type="submit" 
                    className="btn-primary w-full flex justify-center items-center gap-2 py-3 mt-2 disabled:opacity-60 text-sm shadow-lg shadow-primary-500/20"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Truy cập hệ thống</span>
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--theme-subtle-border)]"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                      <span className="px-3 bg-[#030712] text-theme-text-muted">Hoặc tiếp tục với</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col items-center">
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => loginWithGoogle()}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[var(--theme-subtle-border)] bg-white/5 transition-all group"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px" className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                      </svg>
                      <span className="text-sm font-semibold text-theme-text-primary tracking-tight">Tiếp tục bằng Google</span>
                    </motion.button>
                  </div>
                </div>
                
                <p className="mt-6 text-center text-[13px] text-theme-text-muted">
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
              className="relative w-full max-w-md glass-panel p-8 shadow-2xl border-[var(--theme-subtle-border)]"
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
