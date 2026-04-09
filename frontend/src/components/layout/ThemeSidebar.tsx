import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Check } from 'lucide-react';
import { useTheme, type AppTheme } from '../../store/themeStore';

const THEMES: {
  id: AppTheme;
  label: string;
  description: string;
  bg: string;
  accent: string;
  preview: string[];
}[] = [
  {
    id: 'cyberpunk',
    label: '⚡ Cyberpunk',
    description: 'Nền tối sâu, neon xanh/hồng. Mặc định.',
    bg: 'linear-gradient(135deg, #030712, #0B0F19)',
    accent: '#00f5ff',
    preview: ['#00f5ff', '#ff00c8', '#a855f7'],
  },
  {
    id: 'light-tech',
    label: '🌤️ Light Tech',
    description: 'Frosted glass trắng mờ, cyan sáng.',
    bg: 'linear-gradient(135deg, #e8edf5, #f0f4fb)',
    accent: '#0ea5e9',
    preview: ['#0ea5e9', '#6366f1', '#10b981'],
  },
  {
    id: 'matrix',
    label: '🟩 Matrix',
    description: 'Nền đen, chữ xanh lá Matrix rain.',
    bg: 'linear-gradient(135deg, #000500, #010d01)',
    accent: '#00ff41',
    preview: ['#00ff41', '#39ff14', '#00a82a'],
  },
];

export default function ThemeSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setTheme] = useTheme();

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl neon-pulse"
        style={{
          background: 'linear-gradient(135deg, var(--theme-neon-primary), var(--theme-neon-accent))',
          boxShadow: '0 0 20px var(--theme-neon-primary), 0 0 40px rgba(0,245,255,0.3)',
        }}
        aria-label="Mở cài đặt theme"
      >
        <Settings className="w-6 h-6 text-black" />
      </motion.button>

      {/* Sidebar overlay + panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />

            {/* Sidebar panel */}
            <motion.aside
              key="sidebar"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col"
              style={{
                background: 'var(--theme-glass-bg)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderLeft: '1px solid var(--theme-border)',
                boxShadow: '-4px 0 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-6"
                style={{ borderBottom: '1px solid var(--theme-border)' }}
              >
                <div>
                  <h2 className="text-lg font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                    🎨 Cài đặt Giao diện
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    Chọn theme VIP PRO cho trải nghiệm của bạn
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theme list */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                  Chọn Theme
                </p>

                {THEMES.map(theme => {
                  const isActive = currentTheme === theme.id;
                  return (
                    <motion.button
                      key={theme.id}
                      onClick={() => setTheme(theme.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left rounded-2xl p-4 transition-all relative overflow-hidden"
                      style={{
                        border: `1px solid ${isActive ? theme.accent : 'var(--theme-border)'}`,
                        boxShadow: isActive ? `0 0 16px ${theme.accent}40, 0 0 4px ${theme.accent}20` : undefined,
                        background: isActive
                          ? `linear-gradient(135deg, ${theme.accent}15, ${theme.accent}05)`
                          : 'var(--theme-glass-bg)',
                      }}
                    >
                      {/* Preview colors */}
                      <div className="flex gap-1.5 mb-3">
                        {theme.preview.map((c, i) => (
                          <div
                            key={i}
                            className="h-4 flex-1 rounded-full"
                            style={{
                              background: c,
                              boxShadow: isActive ? `0 0 6px ${c}` : undefined,
                            }}
                          />
                        ))}
                      </div>

                      {/* Theme name */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm" style={{ color: isActive ? theme.accent : 'var(--theme-text-primary)' }}>
                            {theme.label}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                            {theme.description}
                          </p>
                        </div>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: theme.accent, boxShadow: `0 0 10px ${theme.accent}` }}
                          >
                            <Check className="w-4 h-4 text-black" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div
                className="p-6 text-center"
                style={{ borderTop: '1px solid var(--theme-border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Theme được lưu tự động trong trình duyệt
                </p>
                <p className="text-xs mt-1 neon-text font-semibold">NovaFinance VIP PRO ✨</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
