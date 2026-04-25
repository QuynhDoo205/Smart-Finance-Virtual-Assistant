import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, PieChart, MessageSquare, Award, LogOut, Menu, X, Sparkles, Target, AlertTriangle, ShoppingBag, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSidebar from './ThemeSidebar';
import authStore from '../../store/authStore';

const NAV_ITEMS = [
  { path: '/app', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/app/income', label: 'Thu nhập', icon: Wallet },
  { path: '/app/budget', label: 'Ngân sách', icon: PieChart },
  { path: '/app/chat', label: 'AI Trợ lý', icon: MessageSquare },
  { path: '/app/badges', label: 'Huy hiệu', icon: Award },
  { path: '/app/insights', label: 'Mục tiêu', icon: Target },
  { path: '/app/crisis', label: 'Khủng hoảng', icon: AlertTriangle },
  { path: '/app/expense', label: 'Chi tiêu', icon: ShoppingBag },
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
    return unsubscribe;
  }, []);

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
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.4)]">
          <Sparkles className="text-theme-text-primary w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-theme-text-primary drop-shadow-md">
          Nova<span className="text-primary-400">Finance</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
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

      <div className="pt-4 border-t border-white/10 mt-auto flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group">
          <Link to="/app/profile" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-theme-text-primary font-bold border border-white/20 overflow-hidden flex-shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:5001${user.avatar_url}`} alt={user.full_name} className="w-full h-full object-cover" />
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
            <button onClick={() => setIsThemeOpen(true)} className="p-2 rounded-lg hover:bg-white/10 text-theme-text-muted transition-all">
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
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--theme-bg-deep)', color: 'var(--theme-text-primary)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-full z-20 flex-shrink-0">
        <div className="h-full border-r border-white/5" style={{ background: 'var(--theme-bg-panel)', backdropFilter: 'blur(24px)' }}>
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 z-30 flex items-center justify-between px-4 bg-theme-bg-panel/80 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary-400 w-6 h-6" />
          <span className="text-xl font-bold text-theme-text-primary">Nova<span className="text-primary-400">Finance</span></span>
        </div>
        <button onClick={toggleMobileMenu} className="p-2 text-theme-text-muted hover:text-theme-text-primary">
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleMobileMenu} />
            <div className="absolute inset-y-0 left-0 w-64 max-w-[80%] bg-theme-bg-panel border-r border-white/5">
              <SidebarContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area - Cố định hoàn toàn chiều cao */}
      <main className={`flex-1 flex flex-col h-screen overflow-hidden relative pt-16 lg:pt-0`}>
        {isChatPage ? (
          // Layout đặc biệt cho Chat: Không có padding, không có scroll ngoài
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <Outlet />
          </div>
        ) : (
          // Layout thường cho các trang khác
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        )}
      </main>

      <ThemeSidebar isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
    </div>
  );
}
