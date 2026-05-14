import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, X, AlertTriangle } from 'lucide-react';

export interface Jar {
  id: string;
  name: string;
  emoji: string;
  percentage: number;
  color: string;
  neonColor: string;
  locked: boolean; // kept for type compatibility
  description: string;
}

interface LinkedSlidersProps {
  jars: Jar[];
  totalBudget: number;
  onJarsChange: (jars: Jar[]) => void;
  onWarning?: (msg: string) => void;
  formatCurrency: (val: number) => string;
}

export default function LinkedSliders({ jars, totalBudget, onJarsChange, onWarning, formatCurrency }: LinkedSlidersProps) {

  /* ── Inline edit-name state ─────────────────────────────────────── */
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  /* ── UX State for Zero-Sum Constraint ───────────────────────────── */
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const startEdit   = (jar: Jar) => { setEditingId(jar.id); setEditingName(jar.name); };
  const cancelEdit  = ()         => { setEditingId(null);   setEditingName(''); };
  const commitEdit  = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed) onJarsChange(jars.map(j => j.id === id ? { ...j, name: trimmed } : j));
    cancelEdit();
  };

  /* ── Zero-Sum Stepper Logic ────────────────────────────────────────
   *  Slider steps by 10%. User must manually decrease before increasing.
   *  If increasing breaks the 100% total, block it, shake, show toast.
   * ───────────────────────────────────────────────────────────────── */
  const handleSliderChange = (targetId: string, rawValue: number) => {
    // Snap to steps of 5 for cleaner numbers
    const steppedValue = Math.round(rawValue / 5) * 5;
    const newPct = Math.max(0, Math.min(100, steppedValue));
    const targetJar = jars.find(j => j.id === targetId);
    
    if (!targetJar || targetJar.percentage === newPct) return;
    
    const delta = newPct - targetJar.percentage;
    const currentTotal = Math.round(jars.reduce((s, j) => s + j.percentage, 0));

    // If decreasing, always allow
    if (delta < 0) {
      onJarsChange(jars.map(j => j.id === targetId ? { ...j, percentage: newPct } : j));
      return;
    }

    // If increasing
    if (currentTotal + delta <= 100) {
      onJarsChange(jars.map(j => j.id === targetId ? { ...j, percentage: newPct } : j));
    } else {
      // Snap to max remaining instead of just blocking
      const maxPossible = 100 - (currentTotal - targetJar.percentage);
      if (maxPossible > targetJar.percentage) {
        onJarsChange(jars.map(j => j.id === targetId ? { ...j, percentage: maxPossible } : j));
      } else {
        setShakingId(targetId);
        onWarning?.("Vui lòng giảm hũ khác trước khi tăng hũ này.");
        setTimeout(() => setShakingId(null), 500);
      }
    }
  };

  return (
    <div className="space-y-3">

      {/* Individual jar sliders */}
      {jars.map((jar, index) => {
        const amount         = Math.round((totalBudget * jar.percentage) / 100);
        const isEditingThis  = editingId === jar.id;

        return (
          <motion.div
            key={jar.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ 
              opacity: 1, 
              x: shakingId === jar.id ? [0, -8, 8, -6, 6, -4, 4, 0] : 0 
            }}
            transition={{ 
              opacity: { delay: index * 0.05 },
              x: shakingId === jar.id 
                ? { duration: 0.4 } 
                : { type: 'spring', stiffness: 320, damping: 26, delay: index * 0.05 } 
            }}
            className="neon-jar-card p-5 group"
            style={{ borderColor: 'var(--theme-border)', boxShadow: 'var(--theme-border-glow)' }}
          >
            {/* Left neon stripe */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
              style={{ background: `linear-gradient(to bottom, ${jar.neonColor}cc, transparent)` }}
            />

            {/* Header: emoji + name + percentage */}
            <div className="flex items-center justify-between mb-3 pl-2">

              {/* Left — emoji + editable name */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-2xl flex-shrink-0">{jar.emoji}</span>
                <div className="min-w-0 flex-1">
                  {isEditingThis ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={editInputRef}
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(jar.id); if (e.key === 'Escape') cancelEdit(); }}
                        className="rounded-lg px-2 py-0.5 text-sm font-bold outline-none w-36"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: `1px solid ${jar.neonColor}60`,
                          color: 'var(--theme-text-primary)',
                          boxShadow: `0 0 8px ${jar.neonColor}30`,
                        }}
                      />
                      <button onClick={() => commitEdit(jar.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#10b98120', border: '1px solid #10b98155' }}>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button onClick={cancelEdit} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <X className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--theme-text-primary)' }}>{jar.name}</p>
                      <button
                        onClick={() => startEdit(jar)}
                        title="Sửa tên"
                        className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                        style={{ border: '1px solid var(--theme-border)' }}
                        onMouseEnter={e => {
                          const b = e.currentTarget as HTMLButtonElement;
                          b.style.borderColor = jar.neonColor + '80';
                          b.style.boxShadow   = `0 0 8px ${jar.neonColor}40`;
                          b.style.background  = jar.neonColor + '18';
                        }}
                        onMouseLeave={e => {
                          const b = e.currentTarget as HTMLButtonElement;
                          b.style.borderColor = 'var(--theme-border)';
                          b.style.boxShadow   = 'none';
                          b.style.background  = 'transparent';
                        }}
                      >
                        <Pencil className="w-3 h-3" style={{ color: 'var(--theme-text-muted)' }} />
                      </button>
                    </div>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{jar.description}</p>
                </div>
              </div>

              {/* Right — percentage + amount */}
              <div className="flex-shrink-0 text-right ml-4">
                <p
                  className="font-extrabold text-xl tabular-nums leading-none"
                  style={{ color: jar.neonColor, textShadow: `0 0 12px ${jar.neonColor}70` }}
                >
                  {jar.percentage}%
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  {formatCurrency(amount)}
                </p>
              </div>
            </div>

            {/* Slider track */}
            <div className="pl-2 pr-1">
              <div className="relative h-6 flex items-center">
                {/* Background */}
                <div className="absolute inset-x-0 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                {/* Animated fill */}
                <motion.div
                  className="absolute left-0 h-1.5 rounded-full pointer-events-none"
                  animate={{ width: `${jar.percentage}%` }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  style={{ background: `linear-gradient(90deg, ${jar.neonColor}70, ${jar.neonColor})` }}
                />
                <input
                  type="range"
                  min={0} max={100} step={10}
                  value={jar.percentage}
                  onChange={e => handleSliderChange(jar.id, parseInt(e.target.value))}
                  className="neon-slider relative z-10"
                  style={{ background: 'transparent' } as React.CSSProperties}
                />
              </div>
              {/* Discrete Ticks underneath */}
              <div className="flex justify-between mt-1 px-1 relative -top-1 pointer-events-none">
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(tick => (
                  <div key={tick} className="flex flex-col items-center">
                    <div 
                      className="w-0.5 h-1.5 rounded-full transition-colors duration-300" 
                      style={{ 
                        background: jar.percentage >= tick ? jar.neonColor : 'rgba(255,255,255,0.1)',
                        boxShadow: jar.percentage >= tick ? `0 0 6px ${jar.neonColor}` : 'none'
                      }} 
                    />
                    {tick % 20 === 0 && (
                      <span className="text-[10px] mt-0.5 opacity-50 font-bold" style={{ color: jar.percentage >= tick ? jar.neonColor : 'var(--theme-text-muted)' }}>
                        {tick}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      })}

    </div>
  );
}
