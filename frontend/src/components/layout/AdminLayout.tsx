import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Activity, Settings, 
  LogOut, LayoutDashboard, Database, 
  Zap, Bell, Search, Menu, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authStore from '../../store/authStore';

const ADMIN_NAV = [
  { path: '/app/admin', label: 'Bảng điều khiển', icon: Activity },
  { path: '/app/admin/users', label: 'Quản lý người dùng', icon: Users },
  { path: '/app/admin/database', label: 'Cơ sở dữ liệu', icon: Database },
  { path: '/app/admin/ai-config', label: 'Cấu hình AI', icon: Zap },
  { path: '/app/admin/settings', label: 'Cài đặt hệ thống', icon: Settings },
];

export default function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = authStore.getUser();
  
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Thành viên mới', message: 'Văn Thắng Lê vừa đăng ký tài khoản.', time: '2 phút trước', type: 'user', read: false },
    { id: 2, title: 'Bảo mật', message: 'Cơ sở dữ liệu đã được sao lưu định kỳ.', time: '1 giờ trước', type: 'system', read: true },
    { id: 3, title: 'AI Model', message: 'Gemini 2.5 Flash đang hoạt động ổn định.', time: '3 giờ trước', type: 'ai', read: true },
  ]);

  useEffect(() => {
    // Bảo vệ trang Admin ngay tại Layout
    if (!user?.is_admin && user?.email?.toLowerCase() !== 'levanteolvt12@gmail.com') {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    authStore.clearAuth();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex bg-[#0B0F1A] text-white">
      {/* Sidebar Admin */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-white/5 bg-[#0F172A]">
        <div className="p-8">
          <Link to="/app" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-xl tracking-tight">ADMIN <span className="text-sky-400">HUB</span></h2>
              <p className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest">NovaFinance v2.0</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {ADMIN_NAV.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
              {user?.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-500 truncate">Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all font-bold text-xs"
          >
            <LogOut className="w-4 h-4" /> ĐĂNG XUẤT HỆ THỐNG
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Admin */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 relative z-[100]">
          {/* Lớp nền làm mờ riêng biệt để không chặn fixed overlay */}
          <div className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-xl z-[-1]" />
          
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-400" onClick={() => setIsMobileOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Tìm kiếm dữ liệu hệ thống..." 
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-sky-500/50 w-80 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2.5 rounded-xl transition-all relative ${isNotifOpen ? 'bg-sky-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0F172A]" />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-[9998] cursor-default" onClick={() => setIsNotifOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 bg-[#161B2B] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-2 z-[9999]"
                    >
                      <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h4 className="font-black text-sm text-white">Trung tâm thông báo</h4>
                        <span className="text-[10px] text-sky-400 font-bold bg-sky-400/10 px-2 py-0.5 rounded-full">{unreadCount} mới</span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto py-2">
                        {notifications.map((n) => (
                          <div key={n.id} className={`p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group mb-1 ${!n.read ? 'bg-white/[0.02]' : ''}`}>
                            <div className="flex gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                n.type === 'user' ? 'bg-emerald-500/10 text-emerald-400' : 
                                n.type === 'system' ? 'bg-sky-500/10 text-sky-400' : 'bg-purple-500/10 text-purple-400'
                              }`}>
                                {n.type === 'user' ? <Users className="w-5 h-5" /> : n.type === 'system' ? <Database className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">{n.title}</h5>
                                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                                <p className="text-[8px] text-slate-600 mt-1 uppercase font-bold">{n.time}</p>
                              </div>
                              {!n.read && <div className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1 shrink-0" />}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 border-t border-white/5">
                        <button className="w-full py-2.5 rounded-xl bg-white/5 text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest">
                          Xem tất cả thông báo
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <Link to="/app" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sky-400 hover:bg-white/10 transition-all font-bold text-xs">
              <LayoutDashboard className="w-4 h-4" /> VỀ TRANG USER
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="absolute inset-y-0 left-0 w-72 bg-[#0F172A] p-6 border-r border-white/10">
              {/* Reuse sidebar logic here if needed */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-black text-xl tracking-tight">ADMIN <span className="text-sky-400">HUB</span></h2>
                <button onClick={() => setIsMobileOpen(false)}><X className="w-6 h-6" /></button>
              </div>
              <nav className="space-y-2">
                {ADMIN_NAV.map((item) => (
                  <Link key={item.path} to={item.path} onClick={() => setIsMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white">
                    <item.icon className="w-5 h-5" />
                    <span className="font-bold text-sm">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
