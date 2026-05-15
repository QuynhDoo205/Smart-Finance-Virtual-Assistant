import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, PieChart, MessageSquare, Award, LogOut, Menu, X, Orbit, Target, AlertTriangle, ShoppingBag, Settings, User, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ROOT, authApi, adminApi } from '../../utils/api';
import ThemeSidebar from './ThemeSidebar';
import authStore from '../../store/authStore';
import { setTheme } from '../../store/themeStore';
const NAV_ITEMS = [
  { path: '/app/admin', label: 'Hệ thống Admin', icon: Shield, adminOnly: true },
  { path: '/app', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/app/income', label: 'Thu nhập', icon: Wallet },
  { path: '/app/budget', label: 'Ngân sách', icon: PieChart },
  { path: '/app/expense', label: 'Chi tiêu', icon: ShoppingBag },
  { path: '/app/chat', label: 'AI Trợ lý', icon: MessageSquare },
  { path: '/app/badges', label: 'Huy hiệu', icon: Award },
  { path: '/app/insights', label: 'Mục tiêu', icon: Target },
  { path: '/app/crisis', label: 'Khẩn cấp', icon: AlertTriangle },
];

export default function MainLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(authStore.getUser());

  // Kiểm tra nếu đang ở trang Chat để dùng layout đặc biệt (tràn màn hình)
  const isChatPage = location.pathname === '/app/chat';

  useEffect(() => {
    const unsubscribe = authStore.subscribe((updatedUser) => {
      setUser(updatedUser);
    });

    // Đồng bộ cài đặt hệ thống (Theme mặc định & Bảo trì)
    const syncSystem = async () => {
      try {
        const res = await fetch(`${API_ROOT}/api/status`);
        const data = await res.json();
        
        // 1. Áp dụng Theme mặc định nếu người dùng chưa chọn
        if (data.defaultTheme && !localStorage.getItem('app-theme')) {
          setTheme(data.defaultTheme);
        }

        // 2. Kiểm tra bảo trì (Bỏ qua nếu là Admin)
        const isAdmin = user?.is_admin || user?.email?.toLowerCase() === 'levanteolvt12@gmail.com';
        if (data.maintenance === true && !isAdmin) {
          const msg = encodeURIComponent(data.message || '');
          const until = data.until ? encodeURIComponent(data.until) : '';
          window.location.href = `/maintenance?msg=${msg}&until=${until}`;
        }
      } catch (err) {
        console.error("Failed to sync system status:", err);
      }
    };
    syncSystem();
    const maintenanceInterval = setInterval(syncSystem, 15000); // Tăng lên 15s để nhẹ máy hơn

    // Đồng bộ thông tin người dùng
    const syncUser = async () => {
      try {
        const res = await authApi.me();
        if (res.success) authStore.setUser(res.data.user);
      } catch (err) {}
    };
    syncUser();

    return () => {
      unsubscribe();
      clearInterval(maintenanceInterval);
    };
  }, []); // Chỉ chạy 1 lần khi mount layout

  const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col py-6 px-4">
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.4)] border border-white/20">
          <Orbit className="text-white w-5 h-5 animate-[spin_8s_linear_infinite]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[22px] font-black tracking-tighter text-theme-text-primary leading-none">
            NOVA<span className="text-primary-400">FIN</span>
          </span>
          <span className="text-[8px] font-bold text-theme-text-muted uppercase tracking-[0.25em] mt-0.5">
            Quantum AI System
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isAdmin = user?.is_admin || user?.email?.toLowerCase() === 'levanteolvt12@gmail.com';
          if (item.adminOnly && !isAdmin) return null;
          const isActive = item.path === '/app' 
            ? location.pathname === '/app' 
            : (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 group relative ${
                isActive 
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                  : 'text-theme-text-muted hover:text-theme-text-primary hover:bg-primary-500/5'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary-400' : 'text-theme-text-muted group-hover:text-primary-400 transition-colors'}`} />
              <span className="font-semibold text-sm">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-[var(--theme-subtle-border)] mt-auto flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[var(--theme-subtle-bg)] transition-colors group">
          <Link to="/app/profile" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-theme-text-primary font-bold border border-white/20 overflow-hidden flex-shrink-0">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_ROOT}${user.avatar_url}`} 
                  alt={user.full_name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                user?.full_name?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-theme-text-primary truncate">{user?.full_name || 'Người dùng'}</p>
              <p className="text-xs text-theme-text-muted truncate">{user?.email}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsThemeOpen(true)} className="p-2 rounded-lg hover:bg-[var(--theme-subtle-bg)] text-theme-text-muted transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-500/10 group/logout transition-all flex-shrink-0">
              <LogOut className="w-5 h-5 text-theme-text-muted group-hover/logout:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-deep)', color: 'var(--theme-text-primary)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-full z-20 flex-shrink-0">
        <div className="h-full border-r border-[var(--theme-subtle-border)]" style={{ backgroundColor: 'var(--theme-bg-panel)', backdropFilter: 'blur(24px)' }}>
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 z-30 flex items-center justify-between px-4 border-b border-[var(--theme-subtle-border)] backdrop-blur-md" style={{ backgroundColor: 'var(--theme-glass-bg)' }}>
        <div className="flex items-center gap-2">
          <Orbit className="text-primary-400 w-6 h-6 animate-[spin_8s_linear_infinite]" />
          <span className="text-xl font-black tracking-tighter text-theme-text-primary">NOVA<span className="text-primary-400">FIN</span></span>
        </div>
        <button onClick={toggleMobileMenu} className="p-2 text-theme-text-muted hover:text-theme-text-primary">
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleMobileMenu} />
            <div className="absolute inset-y-0 left-0 w-64 max-w-[80%] border-r border-[var(--theme-subtle-border)]" style={{ backgroundColor: 'var(--theme-bg-surface)' }}>
              <SidebarContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Bottom Navigation for Mobile - App Experience */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 z-50 flex items-center justify-around px-2 border-t border-[var(--theme-subtle-border)] backdrop-blur-2xl" style={{ backgroundColor: 'var(--theme-bg-panel)' }}>
        {[
          { path: '/app', icon: LayoutDashboard, label: 'Tổng quan' },
          { path: '/app/expense', icon: ShoppingBag, label: 'Chi tiêu' },
          { path: '/app/chat', icon: MessageSquare, label: 'AI Trợ lý' },
          (user?.is_admin || user?.email?.toLowerCase() === 'levanteolvt12@gmail.com') ? { path: '/app/admin', icon: Shield, label: 'Admin' } : { path: '/app/crisis', icon: AlertTriangle, label: 'Khẩn cấp' },
          { path: '/app/profile', icon: User, label: 'Cá nhân' },
        ].map((item) => {
          const isActive = item.path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all relative ${isActive ? 'text-primary-400' : 'text-theme-text-muted'}`}>
              <div className="relative">
                <Icon className={`w-5.5 h-5.5 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-70'}`} />
                {isActive && (
                  <motion.div 
                    layoutId="bottom-nav-glow"
                    className="absolute inset-0 bg-primary-500/20 blur-md rounded-full -z-10"
                  />
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter transition-all ${isActive ? 'opacity-100 scale-105' : 'opacity-60'}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col h-screen overflow-hidden relative pt-16 lg:pt-0 pb-16 lg:pb-0`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {isChatPage ? (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <Outlet />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                  <Outlet />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <ThemeSidebar isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
    </div>
  );
}
