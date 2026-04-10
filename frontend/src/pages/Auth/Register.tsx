import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, UserPlus, Sparkles, AlertCircle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
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

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successUser, setSuccessUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.register(fullName, email, password);
      if (response.success && response.data) {
        authStore.setAuth(response.data.token, response.data.user);
        setSuccessUser(response.data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError('');
    try {
      const response = await authApi.googleLogin(credentialResponse.credential, 'register');
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
    // New users always go to onboarding
    navigate('/onboarding');
  };

  return (
    <div className="flex-1 flex min-h-screen relative shadow-2xl">
      {/* LEFT SIDE: Content Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <AnimatePresence mode="wait">
          {!successUser ? (
            <motion.div 
              key="register-form"
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
                <h2 className="text-3xl font-bold text-theme-text-primary mb-2">Tạo tài khoản</h2>
                <p className="text-theme-text-muted">Gia nhập thế hệ quản lý tài chính 4.0</p>
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

                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-sm text-theme-text-muted font-medium ml-1">Họ và tên</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-400 text-theme-text-muted">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        className="glass-input pl-11"
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

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
                    <label className="text-sm text-theme-text-muted font-medium ml-1">Mật khẩu</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-400 text-theme-text-muted">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="password"
                        className="glass-input pl-11"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
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
                        <span>Đang khởi tạo...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Đăng ký ngay</span>
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
                        onError={() => setError('Đăng ký Google bị gián đoạn')}
                        useOneTap
                        shape="pill"
                        text="signup_with"
                        width="320"
                      />
                    </div>
                  </div>
                </div>
                
                <p className="mt-8 text-center text-theme-text-muted">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">
                    Trở lại đăng nhập
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
              <h2 className="text-3xl font-extrabold text-theme-text-primary mb-2">Chào mừng bạn mới</h2>
              <p className="text-theme-text-muted mb-8">
                Tài khoản <span className="text-primary-400 font-bold text-lg">{successUser.full_name}</span> đã được khởi tạo. Hãy thiết lập hồ sơ tài chính để AI bắt đầu hỗ trợ bạn.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(56,189,248,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={proceedToApp}
                className="btn-primary w-full flex items-center justify-center gap-3 py-5 text-xl font-bold bg-gradient-to-r from-primary-600 to-sky-400"
              >
                Tiếp tục thiết lập
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT SIDE: Brand & Graphic */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-l border-white/5">
        <div className="absolute inset-0 z-0 text-right">
          <img 
            src="/hero-bg.png" 
            alt="Futuristic Finance" 
            className="w-full h-full object-cover opacity-80 mix-blend-lighten"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/10 via-[#030712]/40 to-[#030712] z-10" />
        </div>
        
        <div className="relative z-20 flex items-center gap-3 justify-end">
          <span className="text-2xl font-bold tracking-tight text-theme-text-primary drop-shadow-md text-right">
            Nova<span className="text-primary-400">Finance</span>
          </span>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)]">
            <Sparkles className="text-theme-text-primary w-6 h-6" />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative z-20 max-w-lg ml-auto"
        >
          <div className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl text-right">
            <h2 className="text-4xl font-extrabold text-theme-text-primary leading-tight mb-4 drop-shadow-lg">
              Bắt đầu hành trình<br/>
              tự do tài chính.
            </h2>
            <p className="text-theme-text-muted text-lg">
              Chỉ 1 phút đăng ký để AI trở thành trợ lý đắc lực theo dõi sát sao từng biến động số dư trong thẻ của bạn.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
