import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, PieChart, MessageSquare, Award, LogOut, Menu, X, Sparkles, Target, AlertTriangle, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSidebar from './ThemeSidebar';

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
  const location = useLocation();

  const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

  const SidebarContent = () => (
    <div className="h-full flex flex-col py-6 px-4">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-400 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)]">
          <Sparkles className="text-white w-6 h-6" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
          Nova<span className="text-primary-400">Finance</span>
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className="font-semibold">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="pt-6 border-t border-white/10 mt-auto">
        <Link to="/app/profile" className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold border border-white/20">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Nguyễn Văn A</p>
            <p className="text-xs text-gray-500 truncate">Pro Member</p>
          </div>
          <LogOut className="w-5 h-5 text-gray-600 hover:text-danger cursor-pointer transition-colors" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: 'var(--theme-bg-deep)', color: 'var(--theme-text-primary)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-screen z-20 flex-shrink-0">
        <div className="h-full border-y-0 border-l-0 rounded-none" style={{ background: 'var(--theme-bg-panel)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRight: '1px solid var(--theme-border)' }}>
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 glass-panel rounded-none border-x-0 border-t-0 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary-400 w-6 h-6" />
          <span className="text-xl font-bold text-white">Nova<span className="text-primary-400">Finance</span></span>
        </div>
        <button onClick={toggleMobileMenu} className="p-2 text-gray-300 hover:text-white">
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="lg:hidden fixed inset-0 z-20"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleMobileMenu} />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] glass-panel rounded-l-none border-y-0 border-l-0">
              <SidebarContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative pt-16 lg:pt-0">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Global Theme Sidebar */}
      <ThemeSidebar />
    </div>
  );
}
