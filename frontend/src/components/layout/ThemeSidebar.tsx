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
    label: '🌙 Nova Dark',
    description: 'Chế độ tối chuyên nghiệp, độ tương phản cao.',
    bg: 'linear-gradient(135deg, #0A0A0A, #111111)',
    accent: '#3B82F6',
    preview: ['#3B82F6', '#8B5CF6', '#10B981'],
  },
  {
    id: 'light-tech',
    label: '☀️ Nova Light',
    description: 'Chế độ sáng thanh lịch, dễ đọc.',
    bg: 'linear-gradient(135deg, #F8FAFC, #FFFFFF)',
    accent: '#2563EB',
    preview: ['#2563EB', '#6366F1', '#059669'],
  },
  {
    id: 'matrix',
    label: '💎 Midnight Emerald',
    description: 'Nền đen sâu OLED, điểm nhấn xanh ngọc bích.',
    bg: 'linear-gradient(135deg, #000000, #050505)',
    accent: '#10B981',
    preview: ['#10B981', '#059669', '#34D399'],
  },
  {
    id: 'sakura',
    label: '🌸 Sakura Pink',
    description: 'Tone hồng mộng mơ, kẹo ngọt và nữ tính.',
    bg: 'linear-gradient(135deg, #FFF0F5, #FFFFFF)',
    accent: '#EC4899',
    preview: ['#EC4899', '#F43F5E', '#F472B6'],
  },
  {
    id: 'ocean',
    label: '🌊 Ocean Blue',
    description: 'Xanh da trời thanh mát, trong trẻo như đại dương.',
    bg: 'linear-gradient(135deg, #F0F9FF, #FFFFFF)',
    accent: '#0EA5E9',
    preview: ['#0EA5E9', '#0284C7', '#38BDF8'],
  },
  {
    id: 'sunset',
    label: '🌅 Sunset Orange',
    description: 'Cam cháy ấm áp, năng động và đầy cá tính.',
    bg: 'linear-gradient(135deg, #1A0B02, #2D1305)',
    accent: '#F97316',
    preview: ['#F97316', '#EF4444', '#F59E0B'],
  },
];

interface ThemeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeSidebar({ isOpen, onClose }: ThemeSidebarProps) {
  const [currentTheme, setTheme] = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />

          {/* Sidebar panel */}
          <motion.aside
            key="sidebar"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed right-0 top-0 h-full w-80 z-[101] flex flex-col"
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
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Theme list */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
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
  );
}
