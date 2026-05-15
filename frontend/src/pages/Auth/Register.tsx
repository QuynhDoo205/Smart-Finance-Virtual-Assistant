import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, UserPlus, Sparkles, AlertCircle, Loader2, CheckCircle2, ArrowRight, Eye, EyeOff, X, Globe, MessageSquare, ShieldCheck, KeyRound } from 'lucide-react';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { authApi } from '../../utils/api';
import type { UserProfile } from '../../utils/api';
import authStore from '../../store/authStore';
import { getTheme } from '../../store/themeStore';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successUser, setSuccessUser] = useState<UserProfile | null>(null);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const navigate = useNavigate();

  // Force dark theme for Auth pages to preserve video background fidelity
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'cyberpunk');
    return () => {
      document.documentElement.setAttribute('data-theme', getTheme());
    };
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự trở lên');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.register(fullName, email, password);
      if (response.success && response.step === 'otp') {
        setStep('otp');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Vui lòng nhập đầy đủ mã OTP');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authApi.verifyOtp(email, otpCode);
      if (response.success && response.data) {
        authStore.setAuth(response.data.token, response.data.user);
        setSuccessUser(response.data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Chỉ cho phép nhập 1 số
    if (!/^\d*$/.test(value)) return; // Chỉ cho phép nhập số
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus ô tiếp theo
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const token = credentialResponse.credential || credentialResponse;
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await authApi.googleLogin(token); // Removed 'register' flag to allow auto-login if account exists
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

  const registerWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => handleGoogleSuccess(tokenResponse.access_token),
    onError: () => setError('Đăng ký Google bị gián đoạn'),
  });

  const proceedToApp = () => {
    if (!successUser) return;
    navigate('/onboarding');
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
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#010828]/80 via-transparent to-[#010828]/60" />
      </div>

      <main className="relative z-10 max-w-[1831px] mx-auto px-6 py-6 min-h-screen flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16">
        
        {/* Left Side: Auth Panel - ELECTRIC CYAN THEME */}
        <div className="w-full lg:w-[410px] relative order-2 lg:order-1 mt-0">
          <AnimatePresence mode="wait">
            {!successUser ? (
              step === 'form' ? (
              <motion.div 
                key="register-form" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                className="liquid-glass bg-[#010828]/60 backdrop-blur-[25px] rounded-[35px] p-8 sm:p-10 border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.7)]"
              >
                <div className="mb-8 text-center lg:text-left">
                  <h2 className="font-grotesk text-3xl uppercase tracking-tighter leading-none mb-2 text-white">Tạo tài khoản</h2>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                     <div className="h-[1.5px] w-8 bg-[#00D1FF]" />
                     <p className="text-[#00D1FF] font-black text-[9px] tracking-[0.4em] uppercase">Khởi đầu kỷ nguyên mới</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-100 text-[10px] font-bold flex items-center gap-2 animate-shake shadow-lg">
                    <AlertCircle className="w-4 h-4 text-rose-400" /> {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-white/80 uppercase tracking-widest ml-3">Họ và tên</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#00D1FF] transition-all" />
                      <input
                        type="text" placeholder="NGUYỄN VĂN A" value={fullName}
                        onChange={(e) => setFullName(e.target.value)} required
                        className="w-full bg-black/50 border border-white/10 rounded-full py-3.5 pl-12 pr-5 text-sm focus:outline-none focus:bg-black/70 focus:border-[#00D1FF]/40 transition-all placeholder:text-white/10 font-bold text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-white/80 uppercase tracking-widest ml-3">Địa chỉ Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#00D1FF] transition-all" />
                      <input
                        type="email" placeholder="NAME@EXAMPLE.COM" value={email}
                        onChange={(e) => setEmail(e.target.value)} required
                        className="w-full bg-black/50 border border-white/10 rounded-full py-3.5 pl-12 pr-5 text-sm focus:outline-none focus:bg-black/70 focus:border-[#00D1FF]/40 transition-all placeholder:text-white/10 font-bold text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-white/80 uppercase tracking-widest ml-3">Mật khẩu</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#00D1FF] transition-all" />
                      <input
                        type={showPassword ? "text" : "password"} placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)} required
                        className="w-full bg-black/50 border border-white/10 rounded-full py-3.5 pl-12 pr-12 text-xs focus:outline-none focus:bg-black/70 focus:border-[#00D1FF]/40 transition-all font-bold text-white"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {password.length > 0 && password.length < 6 && (
                      <p className="text-[10px] text-rose-400 font-bold ml-3 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Mật khẩu phải từ 6 ký tự trở lên</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-white/80 uppercase tracking-widest ml-3">Xác nhận mật khẩu</label>
                    <div className="relative group">
                      <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#00D1FF] transition-all" />
                      <input
                        type={showConfirmPassword ? "text" : "password"} placeholder="••••••••"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                        className="w-full bg-black/50 border border-white/10 rounded-full py-3.5 pl-12 pr-12 text-xs focus:outline-none focus:bg-black/70 focus:border-[#00D1FF]/40 transition-all font-bold text-white"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && password !== confirmPassword && (
                      <p className="text-[10px] text-rose-400 font-bold ml-3 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Mật khẩu không trùng khớp</p>
                    )}
                    {confirmPassword.length > 0 && password === confirmPassword && password.length >= 6 && (
                      <p className="text-[10px] text-emerald-400 font-bold ml-3 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Mật khẩu hợp lệ và trùng khớp</p>
                    )}
                  </div>

                  <button 
                    disabled={loading} type="submit"
                    className="group relative w-full py-4 rounded-full bg-gradient-to-r from-[#00D1FF] to-[#0077FF] text-white font-grotesk text-base uppercase tracking-widest hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-3 mt-4 shadow-[0_10px_30px_rgba(0,209,255,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine" />
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><UserPlus size={18} /> Đăng ký ngay</>}
                  </button>
                </form>

                <div className="mt-8">
                  <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20"></div></div>
                    <span className="relative px-4 bg-[#010828] text-[9px] font-black text-white/50 uppercase tracking-widest">Hoặc tiếp tục với</span>
                  </div>
                  
                  <button
                    onClick={() => registerWithGoogle()}
                    className="w-full py-4 rounded-full bg-black/50 border border-white/10 text-white font-bold text-[10px] hover:bg-black/70 hover:border-[#00D1FF]/30 transition-all flex items-center justify-center gap-3 group"
                  >
                    <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
                    Tiếp tục bằng Google
                  </button>
                </div>
                
                <p className="mt-8 text-center text-white/50 font-bold text-[11px] tracking-widest uppercase">
                  Đã có tài khoản? <Link to="/login" className="text-[#00D1FF] hover:text-white transition-colors font-black ml-1">Đăng nhập</Link>
                </p>
              </motion.div>
              ) : (
              <motion.div 
                key="otp-form" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="liquid-glass bg-[#010828]/60 backdrop-blur-[25px] rounded-[35px] p-8 sm:p-10 border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.7)]"
              >
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-[#00D1FF]/10 rounded-full flex items-center justify-center border border-[#00D1FF]/30 mb-4 shadow-[0_0_20px_rgba(0,209,255,0.2)]">
                    <ShieldCheck className="w-8 h-8 text-[#00D1FF]" />
                  </div>
                  <h2 className="font-grotesk text-2xl sm:text-3xl uppercase tracking-tighter leading-none mb-3 text-white">Xác thực Email</h2>
                  <p className="text-[#EFF4FF]/70 text-[11px] font-bold">
                    Chúng tôi đã gửi mã gồm 6 chữ số đến<br />
                    <span className="text-[#00D1FF]">{email}</span>
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-100 text-[10px] font-bold flex items-center gap-2 animate-shake shadow-lg">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> {error}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-8">
                  <div className="flex justify-between gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-12 sm:w-12 sm:h-14 bg-black/50 border border-white/10 rounded-xl text-center text-xl sm:text-2xl font-black text-white focus:outline-none focus:bg-black/70 focus:border-[#00D1FF] focus:shadow-[0_0_15px_rgba(0,209,255,0.3)] transition-all"
                      />
                    ))}
                  </div>

                  <button 
                    disabled={loading || otp.join('').length < 6} type="submit"
                    className="group relative w-full py-4 rounded-full bg-gradient-to-r from-[#00D1FF] to-[#0077FF] text-white font-grotesk text-base uppercase tracking-widest hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,209,255,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine rounded-full" />
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><KeyRound size={18} /> Xác thực & Hoàn tất</>}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <button onClick={() => setStep('form')} className="text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto">
                    <ArrowRight className="w-3 h-3 rotate-180" /> Quay lại Đăng ký
                  </button>
                </div>
              </motion.div>
              )
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="liquid-glass bg-[#010828]/70 backdrop-blur-[35px] rounded-[40px] p-10 sm:p-12 text-center border border-[#00D1FF]/30 shadow-2xl flex flex-col items-center justify-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-[#00D1FF]/20 animate-pulse" />
                  {successUser?.avatar_url ? (
                    <img src={successUser.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-[#00D1FF] relative z-10" />
                  ) : (
                    <div className="w-full h-full rounded-full border-2 border-[#00D1FF] bg-[#010828] text-[#00D1FF] font-grotesk text-4xl flex items-center justify-center relative z-10">
                      {successUser?.full_name ? successUser.full_name.charAt(0).toUpperCase() : <CheckCircle2 className="w-10 h-10" />}
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-[3px] border-[#010828] flex items-center justify-center z-20 shadow-lg">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <h2 className="font-grotesk text-3xl sm:text-4xl uppercase tracking-tighter mb-3 text-white">Khởi tạo thành công</h2>
                <p className="text-white/70 text-sm mb-10 font-bold tracking-wider">
                  Chào mừng gia nhập, <span className="text-[#00D1FF]">{successUser?.full_name || 'Người dùng'}</span>!
                </p>
                
                <button onClick={proceedToApp} className="group relative w-full py-4 rounded-full bg-gradient-to-r from-[#00D1FF] to-[#0077FF] text-white font-grotesk text-base uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,209,255,0.3)]">
                   Bắt đầu hành trình <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Hero Content - Electric Cyan Theme */}
        <div className="w-full lg:w-[48%] relative order-1 lg:order-2 text-center lg:text-right mt-0">
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="relative inline-block mb-6">
               <div className="flex items-center gap-2 mb-8 justify-center lg:justify-end">
                  <span className="font-grotesk text-xl uppercase tracking-tighter text-white">Nova.Finance</span>
                  <div className="w-8 h-8 rounded-lg bg-[#00D1FF] flex items-center justify-center text-[#010828] font-grotesk text-xl shadow-[0_0_15px_rgba(0,209,255,0.4)]">N</div>
               </div>
              <h1 className="font-grotesk text-3xl sm:text-5xl md:text-6xl lg:text-[67px] uppercase leading-[0.85] tracking-tighter text-white drop-shadow-2xl">
                XIN CHÀO!<br/>
                TÔI LÀ <span className="text-[#00D1FF]">ORBIS</span> <br/>
                FINANCE
              </h1>
              <div className="absolute -left-4 lg:-left-12 top-0 lg:top-4 bg-[#00D1FF]/10 border border-[#00D1FF]/30 backdrop-blur-md px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(0,209,255,0.3)]">
                <span className="font-bold text-[#00D1FF] text-xs sm:text-sm uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Trợ lý AI
                </span>
              </div>
            </div>
            <p className="mt-8 lg:ml-auto text-sm sm:text-base text-white/70 font-medium max-w-md leading-relaxed tracking-wide mx-auto lg:mx-0">
              Khám phá không gian tài chính số không giới hạn. Nơi AI định hình dòng tiền và kiến tạo sự thịnh vượng cho bạn.
            </p>
            
            <div className="mt-14 flex flex-wrap justify-center lg:justify-end gap-10 border-t border-white/10 pt-10">
               <div className="text-center lg:text-right">
                 <p className="font-grotesk text-4xl text-white">100%</p>
                 <p className="text-[9px] font-black text-[#00D1FF] uppercase tracking-widest mt-1.5">Tự động</p>
               </div>
               <div className="text-center lg:text-right">
                 <p className="font-grotesk text-4xl text-white">256-BIT</p>
                 <p className="text-[9px] font-black text-[#00D1FF] uppercase tracking-widest mt-1.5">Bảo mật</p>
               </div>
            </div>
          </motion.div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shine { 0% { transform: translateX(-150%) skewX(-20deg); } 100% { transform: translateX(250%) skewX(-20deg); } }
        .animate-shine { animation: shine 3s infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        ::placeholder { color: rgba(255, 255, 255, 0.1) !important; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
      `}} />
    </div>
  );
}
