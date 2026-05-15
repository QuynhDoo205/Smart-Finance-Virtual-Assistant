import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, X, Plus, Minus, Lock, AlertTriangle } from 'lucide-react';

export interface Jar {
  id: string;
  name: string;
  emoji: string;
  percentage: number;
  color: string;
  neonColor: string;
  locked: boolean;
  description: string;
}

interface LinkedSlidersProps {
  jars: Jar[];
  totalBudget: number;
  onJarsChange: (jars: Jar[]) => void;
  onWarning?: (msg: string) => void;
  formatCurrency: (val: number) => string;
}

// ── Circular Progress Ring ────────────────────────────────────────────────────
function CircleProgress({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="var(--theme-subtle-bg)"
        strokeWidth={6}
      />
      {/* Glow */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 0.5s cubic-bezier(.4,0,.2,1)',
          filter: `drop-shadow(0 0 6px ${color}99)`,
        }}
      />
    </svg>
  );
}

export default function LinkedSliders({ jars, totalBudget, onJarsChange, onWarning, formatCurrency }: LinkedSlidersProps) {
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [shakingId, setShakingId]     = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const startEdit  = (jar: Jar) => { setEditingId(jar.id); setEditingName(jar.name); };
  const cancelEdit = () => { setEditingId(null); setEditingName(''); };
  const commitEdit = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed) onJarsChange(jars.map(j => j.id === id ? { ...j, name: trimmed } : j));
    cancelEdit();
  };

  const step = (targetId: string, delta: number) => {
    const targetJar = jars.find(j => j.id === targetId);
    if (!targetJar) return;

    const newPct = Math.max(0, Math.min(100, targetJar.percentage + delta));
    if (newPct === targetJar.percentage) return;

    const currentTotal = jars.reduce((s, j) => s + j.percentage, 0);

    if (delta > 0 && currentTotal + delta > 100) {
      const maxPossible = 100 - (currentTotal - targetJar.percentage);
      if (maxPossible > targetJar.percentage) {
        onJarsChange(jars.map(j => j.id === targetId ? { ...j, percentage: maxPossible } : j));
      } else {
        setShakingId(targetId);
        onWarning?.('Vui lòng giảm lọ khác trước khi tăng lọ này.');
        setTimeout(() => setShakingId(null), 500);
      }
      return;
    }

    onJarsChange(jars.map(j => j.id === targetId ? { ...j, percentage: newPct } : j));
  };

  const totalAllocated = jars.reduce((s, j) => s + j.percentage, 0);
  const remaining = 100 - totalAllocated;

  return (
    <div className="space-y-3">
      {jars.map((jar, index) => {
        const amount       = Math.round((totalBudget * jar.percentage) / 100);
        const isEditing    = editingId === jar.id;
        const isShaking    = shakingId === jar.id;

        return (
          <motion.div
            key={jar.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{
              opacity: 1,
              y: 0,
              x: isShaking ? [0, -7, 7, -5, 5, -3, 3, 0] : 0,
            }}
            transition={{
              opacity: { delay: index * 0.05, duration: 0.4 },
              y:       { delay: index * 0.05, duration: 0.4, ease: 'easeOut' },
              x: isShaking ? { duration: 0.4 } : undefined,
            }}
            className="relative overflow-hidden rounded-2xl group jar-card"
            style={{
              background: 'var(--theme-glass-bg)',
              border: `1px solid var(--theme-subtle-border)`,
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Colored top accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${jar.neonColor}, transparent)`,
                opacity: jar.percentage > 0 ? 1 : 0.3,
              }}
            />

            {/* Hover glow background */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 0% 50%, ${jar.neonColor}08 0%, transparent 70%)` }}
            />

            <div className="relative p-3 flex items-center gap-3">

              {/* Circle Progress + Emoji */}
              <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 54, height: 54 }}>
                <CircleProgress pct={jar.percentage} color={jar.neonColor} size={54} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg select-none">{jar.emoji}</span>
                </div>
              </div>

              {/* Name + Description + Amount */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      ref={editInputRef}
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(jar.id); if (e.key === 'Escape') cancelEdit(); }}
                      className="rounded-lg px-2 py-0.5 text-sm font-bold outline-none w-32"
                      style={{
                        background: 'var(--theme-subtle-bg)',
                        border: `1px solid ${jar.neonColor}60`,
                        color: 'var(--theme-text-primary)',
                      }}
                    />
                    <button onClick={() => commitEdit(jar.id)} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#10b98120', border: '1px solid #10b98155' }}>
                      <Check className="w-3 h-3 text-emerald-400" />
                    </button>
                    <button onClick={cancelEdit} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <X className="w-3 h-3 text-rose-400" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>{jar.name}</p>
                    <button
                      onClick={() => startEdit(jar)}
                      title="Sửa tên"
                      className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
                    >
                      <Pencil className="w-3 h-3" style={{ color: 'var(--theme-text-muted)' }} />
                    </button>
                  </div>
                )}
                <p className="text-[11px] mb-1" style={{ color: 'var(--theme-text-muted)' }}>{jar.description}</p>
                <p className="text-xs font-bold tabular-nums" style={{ color: jar.neonColor }}>
                  {formatCurrency(amount)}
                </p>
              </div>

              {/* Stepper controls + Percentage */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <p className="text-base font-black tabular-nums leading-none"
                   style={{ color: jar.neonColor, textShadow: `0 0 12px ${jar.neonColor}70` }}>
                  {jar.percentage}%
                </p>
                <div className="flex items-center gap-1">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => step(jar.id, -5)}
                    disabled={jar.percentage === 0}
                    className="w-6 h-6 rounded-md flex items-center justify-center transition-all disabled:opacity-30"
                    style={{
                      background: 'var(--theme-subtle-bg)',
                      border: '1px solid var(--theme-subtle-border)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = jar.neonColor + '60'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-subtle-border)'; }}
                  >
                    <Minus className="w-3 h-3" style={{ color: 'var(--theme-text-muted)' }} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => step(jar.id, 5)}
                    disabled={remaining <= 0 && jar.percentage < 100}
                    className="w-6 h-6 rounded-md flex items-center justify-center transition-all disabled:opacity-30"
                    style={{
                      background: jar.neonColor + '15',
                      border: `1px solid ${jar.neonColor}40`,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = jar.neonColor + '30'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = jar.neonColor + '15'; }}
                  >
                    <Plus className="w-3 h-3" style={{ color: jar.neonColor }} />
                  </motion.button>
                </div>
              </div>

            </div>

            {/* Bottom fill bar */}
            <div className="relative h-1 w-full" style={{ background: 'var(--theme-subtle-bg)' }}>
              <motion.div
                className="absolute left-0 top-0 h-full"
                animate={{ width: `${jar.percentage}%` }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                style={{
                  background: `linear-gradient(90deg, ${jar.neonColor}60, ${jar.neonColor})`,
                  boxShadow: `0 0 8px ${jar.neonColor}80`,
                }}
              />
            </div>
          </motion.div>
        );
      })}

      {/* Remaining badge */}
      <AnimatePresence>
        {remaining !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold"
            style={{
              background: remaining > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px dashed ${remaining > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: remaining > 0 ? '#10b981' : '#ef4444',
            }}
          >
            {remaining > 0
              ? `✦ Còn ${remaining}% chưa phân bổ — thêm vào lọ để tối ưu ngân sách`
              : `⚠ Đã phân bổ ${totalAllocated}% — vượt 100%!`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
