import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, Sparkles } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/onboarding');
  };

  return (
    <div className="flex-1 flex min-h-screen relative shadow-2xl">
      
      {/* RIGHT SIDE: Brand & Graphic (Hidden on small screens) - Reversed for Register */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-l border-white/5 order-2">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Futuristic Finance" 
            className="w-full h-full object-cover opacity-80 mix-blend-lighten scale-x-[-1]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/10 via-[#030712]/40 to-[#030712] z-10" />
        </div>
        
        <div className="relative z-20 flex items-center justify-end gap-3 w-full">
          <span className="text-2xl font-bold tracking-tight text-theme-text-primary drop-shadow-md">
            Nova<span className="text-primary-400">Finance</span>
          </span>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)]">
            <Sparkles className="text-theme-text-primary w-6 h-6" />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative z-20 max-w-lg self-end text-right"
        >
          <div className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
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

      {/* LEFT SIDE: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 order-1">
        <motion.div 
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
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
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="btn-primary w-full flex justify-center items-center gap-2 mt-4"
              >
                <UserPlus className="w-5 h-5" />
                <span>Đăng ký ngay</span>
              </motion.button>
            </form>

            <p className="mt-8 text-center text-theme-text-muted">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">
                Trở lại đăng nhập
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
