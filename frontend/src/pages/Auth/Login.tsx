import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Sparkles, AlertCircle, Loader2, ArrowRight, CheckCircle2, Eye, EyeOff, X, Globe, MessageSquare } from 'lucide-react';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { authApi } from '../../utils/api';
import type { UserProfile } from '../../utils/api';
import authStore from '../../store/authStore';

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
    if (successUser.onboarding_completed) navigate('/app');
    else navigate('/onboarding');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const response = await authApi.forgotPassword(forgotEmail);
      if (response.success) setForgotMessage(response.message);
    } catch (err) {
      setForgotMessage(err instanceof Error ? err.message : 'Lỗi khi gửi yêu cầu');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#010828] overflow-hidden text-[#EFF4FF] font-sans selection:bg-[#00D1FF]/30">
      {/* Texture Overlay */}
      <div className="texture-overlay opacity-25" />

      {/* Video Background */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay loop muted playsInline
          className="w-full h-full object-cover opacity-50"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#010828]/80 via-transparent to-[#010828]" />
      </div>

      <main className="relative z-10 max-w-[1831px] mx-auto px-6 py-8 min-h-screen flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        
        {/* Left Side: Hero Content */}
        <div className="w-full lg:w-[45%] relative text-center lg:text-left">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="relative inline-block mb-6">
               <div className="flex items-center gap-2 mb-8 justify-center lg:justify-start">
                  <div className="w-8 h-8 rounded-lg bg-[#00D1FF] flex items-center justify-center text-[#010828] font-grotesk text-xl shadow-[0_0_15px_rgba(0,209,255,0.4)]">N</div>
                  <span className="font-grotesk text-xl uppercase tracking-tighter text-white">Nova.Finance</span>
               </div>
              <h1 className="font-grotesk text-4xl sm:text-6xl md:text-7xl lg:text-[75px] uppercase leading-[0.85] tracking-tighter text-white drop-shadow-2xl">
                KHÁM PHÁ<br/>
                KỶ NGUYÊN<br/>
                <span className="text-[#00D1FF]">TÀI CHÍNH AI</span>
              </h1>
              <span className="absolute -right-4 lg:-right-16 top-0 lg:top-4 font-condiment text-[#00D1FF] text-2xl sm:text-4xl md:text-5xl -rotate-6 opacity-95 drop-shadow-[0_0_15px_rgba(0,209,255,0.6)]">Trợ lý ảo</span>
            </div>
            <p className="mt-6 text-sm sm:text-base text-[#EFF4FF] font-bold max-w-md leading-relaxed uppercase tracking-[0.15em] opacity-80 mx-auto lg:mx-0">
              Công nghệ trí tuệ nhân tạo tối ưu hóa dòng tiền và kiến tạo tương lai vững chắc.
            </p>
          </motion.div>
        </div>

        {/* Right Side: Auth Panel */}
        <div className="w-full lg:w-[380px] relative">
          <AnimatePresence mode="wait">
            {!successUser ? (
              <motion.div 
                key="login-form" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                className="liquid-glass bg-[#010828]/60 backdrop-blur-[30px] rounded-[40px] p-8 sm:p-10 border border-white/20 shadow-[0_30px_100px_rgba(0,0,0,0.7)]"
              >
                <div className="mb-8 text-center lg:text-left">
                  <h2 className="font-grotesk text-4xl uppercase tracking-tighter leading-none mb-2 text-white">Đăng nhập</h2>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                     <div className="h-[2px] w-10 bg-[#00D1FF]" />
                     <p className="text-[#00D1FF] font-black text-[10px] tracking-[0.4em] uppercase">Truy cập hệ thống</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-100 text-[11px] font-bold flex items-center gap-2 animate-shake shadow-lg">
                    <AlertCircle className="w-5 h-5 text-rose-400" /> {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white uppercase tracking-[0.4em] ml-3">Địa chỉ Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 group-focus-within:text-[#00D1FF] transition-all" />
                      <input
                        type="email" placeholder="NGUYEN@EXAMPLE.COM" value={email}
                        onChange={(e) => setEmail(e.target.value)} required
                        className="w-full bg-black/50 border border-white/10 rounded-full py-4 pl-14 pr-6 text-sm focus:outline-none focus:bg-black/70 focus:border-[#00D1FF]/40 transition-all placeholder:text-white/10 font-bold tracking-wider text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-3">
                      <label className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Mật khẩu</label>
                      <button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] font-black text-[#00D1FF] hover:text-white uppercase tracking-widest transition-all">Quên mật khẩu?</button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40 group-focus-within:text-[#00D1FF] transition-all" />
                      <input
                        type={showPassword ? "text" : "password"} placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)} required
                        className="w-full bg-black/50 border border-white/10 rounded-full py-4 pl-14 pr-12 text-sm focus:outline-none focus:bg-black/70 focus:border-[#00D1FF]/40 transition-all placeholder:text-white/10 font-bold text-white"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    disabled={loading} type="submit"
                    className="group relative w-full py-4 rounded-full bg-[#00D1FF] text-[#010828] font-grotesk text-base uppercase tracking-[0.2em] hover:bg-white transition-all duration-300 flex items-center justify-center gap-3 mt-6 overflow-hidden shadow-xl shadow-[#00D1FF]/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine" />
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><LogIn size={20} /> Đăng nhập ngay</>}
                  </button>
                </form>

                <div className="mt-8">
                  <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <span className="relative px-4 bg-[#010828] text-[9px] font-black text-white/40 uppercase tracking-[0.5em]">Hoặc đăng nhập với</span>
                  </div>
                  
                  <button
                    onClick={() => loginWithGoogle()}
                    className="w-full py-4 rounded-full bg-black/50 border border-white/10 text-white font-bold text-[10px] hover:bg-black/70 hover:border-[#00D1FF]/30 transition-all flex items-center justify-center gap-3 group"
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
                    Tiếp tục bằng Google
                  </button>
                </div>
                
                <p className="mt-8 text-center text-white/50 font-bold text-[11px] tracking-widest uppercase">
                  Chưa có tài khoản? <Link to="/register" className="text-[#00D1FF] hover:text-white transition-colors underline underline-offset-4 decoration-2 font-black">Đăng ký ngay</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="liquid-glass bg-[#010828]/70 backdrop-blur-[35px] rounded-[40px] p-16 text-center border border-[#00D1FF]/30 shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-[#00D1FF]/20 flex items-center justify-center mx-auto mb-8 border border-[#00D1FF]/40 shadow-inner">
                  <CheckCircle2 className="w-12 h-12 text-[#00D1FF]" />
                </div>
                <h2 className="font-grotesk text-5xl uppercase tracking-tighter mb-4 text-white">Thành công</h2>
                <p className="text-[#00D1FF] text-xl mb-12 uppercase tracking-[0.2em] font-grotesk">Chào mừng trở lại</p>
                <button onClick={proceedToApp} className="group relative w-full py-4 rounded-full bg-[#00D1FF] text-[#010828] font-grotesk text-lg uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-4 shadow-2xl">
                   Bắt đầu <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#010828]/95 backdrop-blur-[30px]" onClick={() => setShowForgotModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-lg liquid-glass bg-[#010828]/80 rounded-[40px] p-10 border border-white/20 shadow-2xl">
              <button onClick={() => setShowForgotModal(false)} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors p-2"><X size={24} /></button>
              <h3 className="font-grotesk text-4xl uppercase tracking-tighter mb-4 leading-none text-white">Khôi phục</h3>
              <p className="text-white/50 mb-8 uppercase text-xs font-black tracking-[0.4em] leading-relaxed">Nhập email để nhận hướng dẫn khôi phục mật khẩu.</p>
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] ml-3">Email bảo mật</label>
                   <input
                    type="email" placeholder="VD: NGUYEN@EXAMPLE.COM" value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)} required
                    className="w-full bg-black/50 border border-white/10 rounded-full py-4 px-8 text-white text-lg focus:outline-none focus:border-[#00D1FF] transition-all font-bold tracking-widest"
                  />
                </div>
                <button type="submit" disabled={forgotLoading} className="w-full py-4 rounded-full bg-[#00D1FF] text-[#010828] font-grotesk text-lg uppercase tracking-widest hover:bg-white transition-all shadow-2xl">
                  {forgotLoading ? <Loader2 className="animate-spin mx-auto w-8 h-8" /> : 'Gửi yêu cầu'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shine { 0% { transform: translateX(-150%) skewX(-20deg); } 100% { transform: translateX(250%) skewX(-20deg); } }
        .animate-shine { animation: shine 3s infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        ::placeholder { color: rgba(255, 255, 255, 0.1) !important; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
        .w-4.5 { width: 1.125rem; }
        .h-4.5 { height: 1.125rem; }
      `}} />
    </div>
  );
}
