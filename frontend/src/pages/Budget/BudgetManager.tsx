import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Lock, BrainCircuit, RefreshCw, Save, Plus, Sparkles, ChevronRight } from 'lucide-react';
import LinkedSliders, { type Jar } from './components/LinkedSliders';
import NeonPieChart from './components/NeonPieChart';

/* ── Mock fixed expenses (LOCKED – cannot be touched by sliders) ── */
const FIXED = [
  { id: 'rent',  name: 'Tiền nhà trọ', emoji: '🏠', amount: 2_000_000 },
  { id: 'elec',  name: 'Điện nước',    emoji: '⚡', amount: 450_000  },
  { id: 'phone', name: 'Điện thoại',   emoji: '📱', amount: 200_000  },
];

/* ── Initial jars (% of availableBudget, must sum to 100) ── */
const INIT_JARS: Jar[] = [
  { id:'1', name:'Thiết yếu',  emoji:'🛒', percentage:40, locked:false, color:'#0EA5E9', neonColor:'#22d3ee', description:'Ăn uống, đi lại' },
  { id:'2', name:'Tiết kiệm',  emoji:'🏦', percentage:30, locked:false, color:'#10B981', neonColor:'#10b981', description:'Quỹ khẩn cấp & tương lai' },
  { id:'3', name:'Phát triển', emoji:'📚', percentage:10, locked:false, color:'#8B5CF6', neonColor:'#a855f7', description:'Học tập, sách, kỹ năng' },
  { id:'4', name:'Hưởng thụ',  emoji:'🎮', percentage:10, locked:false, color:'#F59E0B', neonColor:'#fbbf24', description:'Giải trí, cà phê' },
  { id:'5', name:'Đầu tư',     emoji:'📈', percentage:10, locked:false, color:'#EC4899', neonColor:'#ff00c8', description:'Cổ phiếu, crypto' },
];

const AI_PRESETS = [
  [{id:'1',p:50},{id:'2',p:20},{id:'3',p:10},{id:'4',p:10},{id:'5',p:10}],
  [{id:'1',p:40},{id:'2',p:30},{id:'3',p:10},{id:'4',p:10},{id:'5',p:10}],
  [{id:'1',p:60},{id:'2',p:20},{id:'3',p:0},{id:'4',p:10},{id:'5',p:10}],
];

const fmtVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const CHARS = '01アイウエオカキク'.split('');
const rChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

export default function BudgetManager() {
  const [income, setIncome]           = useState(10_000_000);
  const [editingIncome, setEditIncome]= useState(false);
  const [incomeInput, setIncomeInput] = useState('10000000');
  const [jars, setJars]               = useState<Jar[]>(INIT_JARS);
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiIdx, setAiIdx]             = useState(0);
  const [saved, setSaved]             = useState(false);

  /* Zone 1 derived */
  const totalFixed     = FIXED.reduce((s, e) => s + e.amount, 0);
  const available      = Math.max(0, income - totalFixed);

  /* Zone 3 derived */
  const allocated      = jars.reduce((s, j) => s + j.percentage, 0);
  const unallocated    = 100 - allocated;
  const isBalanced     = unallocated === 0;
  const isOver         = unallocated < 0;

  /* Pool display helpers */
  const poolColor  = isBalanced ? 'var(--theme-neon-primary)' : isOver ? '#ef4444' : '#f59e0b';
  const poolBg     = isBalanced ? 'rgba(0,245,255,0.07)' : isOver ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.08)';
  const poolBorder = isBalanced ? 'rgba(0,245,255,0.25)' : isOver ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.22)';

  /* AI suggestion */
  const handleAI = useCallback(() => {
    setAiLoading(true);
    const next = (aiIdx + 1) % AI_PRESETS.length;
    setTimeout(() => {
      const preset = AI_PRESETS[next];
      setJars(prev => prev.map(j => { const p = preset.find(x => x.id === j.id); return p ? { ...j, percentage: p.p } : j; }));
      setAiIdx(next);
      setAiLoading(false);
    }, 1800);
  }, [aiIdx]);

  /* Save */
  const handleSave = () => {
    if (!isBalanced) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  /* Income commit */
  const commitIncome = () => {
    const v = parseInt(incomeInput.replace(/\D/g, ''), 10);
    if (!isNaN(v) && v > 0) setIncome(v);
    setEditIncome(false);
  };

  const container = { hidden: { opacity:0 }, show: { opacity:1, transition: { staggerChildren: 0.07 } } };
  const card      = { hidden: { opacity:0, y:16 }, show: { opacity:1, y:0, transition: { type:'spring' as const, stiffness:280, damping:24 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 max-w-7xl mx-auto pb-20">

      {/* ════════════════════════════════════════════════════════
          ZONE 1 – Thu nhập & Phí cố định (Story 3)
      ════════════════════════════════════════════════════════ */}
      <motion.section variants={card} className="glass-panel rounded-2xl overflow-hidden">
        {/* Section label */}
        <div className="px-5 py-2.5 flex items-center gap-2"
          style={{ borderBottom: '1px solid var(--theme-border)', background: 'var(--theme-neon-primary)08' }}>
          <Wallet className="w-4 h-4" style={{ color: 'var(--theme-neon-primary)' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--theme-neon-primary)' }}>
            Khu vực 1 · Thu nhập & Phí cố định
          </span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Total income (editable) */}
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--theme-text-muted)' }}>
              Tổng thu nhập / tháng
            </p>
            {editingIncome ? (
              <input type="number" autoFocus
                className="glass-input px-3 py-2 text-xl font-extrabold rounded-xl w-full"
                style={{ color: 'var(--theme-neon-primary)' }}
                value={incomeInput}
                onChange={e => setIncomeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && commitIncome()}
                onBlur={commitIncome}
              />
            ) : (
              <button onClick={() => { setIncomeInput(String(income)); setEditIncome(true); }} className="group flex items-start gap-2 text-left">
                <span className="text-2xl font-extrabold neon-text">{fmtVND(income)}</span>
                <span className="mt-1 text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'var(--theme-neon-primary)20', color: 'var(--theme-neon-primary)' }}>✎ Sửa</span>
              </button>
            )}
          </div>

          {/* Fixed expenses – LOCKED */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lock className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#ef4444' }}>Phí cố định (đã khóa)</p>
            </div>
            <div className="space-y-1.5">
              {FIXED.map(e => (
                <div key={e.id} className="flex justify-between items-center px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{e.emoji} {e.name}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: '#ef4444' }}>-{fmtVND(e.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1.5 px-1">
              <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Tổng phí cố định</span>
              <span className="text-xs font-extrabold" style={{ color: '#ef4444' }}>-{fmtVND(totalFixed)}</span>
            </div>
          </div>

          {/* Available budget highlight */}
          <div className="flex flex-col justify-center items-center rounded-2xl p-5 text-center"
            style={{ background: 'linear-gradient(135deg,var(--theme-neon-primary)12,var(--theme-neon-accent)08)', border: '1px solid var(--theme-neon-primary)30' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>
              💰 Số tiền khả dụng để chia lọ
            </p>
            <p className="text-3xl font-extrabold neon-text">{fmtVND(available)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              = {fmtVND(income)} − {fmtVND(totalFixed)}
            </p>
          </div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════════════════
          QUỸ CHƯA PHÂN BỔ – Real-time counter
      ════════════════════════════════════════════════════════ */}
      <motion.div
        variants={card}
        animate={isOver ? { x: [0,-4,4,-4,4,0] } : {}}
        transition={isOver ? { duration:0.5, repeat:Infinity, repeatDelay:2 } : {}}
        className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
        style={{ background: poolBg, border: `1px solid ${poolBorder}`, boxShadow: isBalanced ? '0 0 20px rgba(0,245,255,0.1)' : undefined }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: isBalanced ? 'rgba(0,245,255,0.15)' : isOver ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)' }}>
            {isBalanced ? '✅' : isOver ? '🚨' : '💡'}
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: poolColor, textShadow: isBalanced ? '0 0 8px var(--theme-neon-primary)' : undefined }}>
              {isBalanced
                ? 'Phân bổ hoàn hảo! Kế hoạch sẵn sàng để lưu.'
                : isOver
                  ? `Vượt ngân sách ${Math.abs(unallocated)}% — Hãy giảm bớt một số lọ.`
                  : `Quỹ chưa phân bổ: còn ${unallocated}%`
              }
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {isBalanced
                ? `Toàn bộ ${fmtVND(available)} đã được phân bổ`
                : isOver
                  ? 'Tổng % đang vượt quá 100%'
                  : `≈ ${fmtVND(Math.round(available * Math.abs(unallocated) / 100))} chưa được dùng`
              }
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-4xl font-extrabold tabular-nums leading-none transition-colors duration-300"
            style={{ color: poolColor, textShadow: isBalanced ? '0 0 20px var(--theme-neon-primary)' : undefined }}>
            {allocated}%
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {isBalanced ? '= 100% ✓' : `/ 100% (còn thiếu ${unallocated}%)`}
          </p>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════
          ZONE 2 + 3 – AI & Sliders  (Story 1 + Story 2)
      ════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* Left: Zone 3 – Sliders */}
        <motion.div variants={card} className="xl:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
                🫙 Khu vực 3 · Điều chỉnh Lọ Chi Tiêu
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                Kéo tự do · Quỹ dư theo dõi phía trên
              </p>
            </div>
            <motion.button onClick={() => setJars(prev => [...prev, {
              id: Date.now().toString(), name:'Lọ mới', emoji:'🫙',
              percentage:0, locked:false, color:'#64748b', neonColor:'#94a3b8', description:'Chưa đặt tên'
            }])}
              whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background:'var(--theme-glass-bg)', border:'1px solid var(--theme-border)', color:'var(--theme-text-muted)' }}>
              <Plus className="w-3.5 h-3.5" /> Thêm lọ
            </motion.button>
          </div>

          {/* AI loading overlay */}
          <AnimatePresence>
            {aiLoading && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="mb-3 rounded-2xl p-6 flex flex-col items-center gap-3 relative overflow-hidden"
                style={{ background:'var(--theme-glass-bg)', border:'1px solid var(--theme-ai-color)40', minHeight:120 }}>
                <div className="matrix-scan-line" />
                <motion.div animate={{ rotate:360 }} transition={{ duration:1.5, repeat:Infinity, ease:'linear' }}
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background:`conic-gradient(var(--theme-ai-color),var(--theme-neon-accent),var(--theme-ai-color))`, padding:2 }}>
                  <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background:'var(--theme-bg-deep)' }}>
                    <BrainCircuit className="w-5 h-5" style={{ color:'var(--theme-ai-color)' }} />
                  </div>
                </motion.div>
                <p className="font-bold text-sm" style={{ color:'var(--theme-ai-color)' }}>AI đang phân tích thói quen chi tiêu…</p>
                <div className="flex gap-2 font-mono text-xs" style={{ color:'var(--theme-ai-color)80' }}>
                  {Array.from({length:7}).map((_,i) => (
                    <motion.span key={i} animate={{ opacity:[0,1,0] }} transition={{ duration:0.4, delay:i*0.07, repeat:Infinity }}>
                      {rChar()}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <LinkedSliders jars={jars} totalBudget={available} onJarsChange={setJars} formatCurrency={fmtVND} />
        </motion.div>

        {/* Right: Zone 2 – AI + Pie */}
        <motion.div variants={card} className="xl:col-span-5 space-y-4">
          {/* Zone 2 – AI suggestion */}
          <div className="glass-panel p-4 rounded-2xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--theme-text-muted)' }}>
              Khu vực 2 · AI Gợi ý Phân bổ
            </p>
            <motion.button onClick={handleAI} disabled={aiLoading}
              whileHover={!aiLoading ? { scale:1.02 } : {}} whileTap={!aiLoading ? { scale:0.97 } : {}}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm"
              style={{
                background: aiLoading ? 'var(--theme-glass-bg)' : 'linear-gradient(135deg,var(--theme-ai-color),var(--theme-neon-accent))',
                border:`1px solid var(--theme-ai-color)50`,
                color: aiLoading ? 'var(--theme-ai-color)' : '#000',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
              }}>
              {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
              {aiLoading ? 'AI đang tính...' : 'AI Gợi ý Phân bổ'}
              {!aiLoading && <Sparkles className="w-3.5 h-3.5" />}
            </motion.button>
            <p className="text-xs text-center mt-2" style={{ color:'var(--theme-text-muted)' }}>
              Phân bổ tối ưu trên {fmtVND(available)} khả dụng
            </p>
          </div>

          <NeonPieChart jars={jars} totalBudget={available} formatCurrency={fmtVND} />

          {/* Compact jar amounts */}
          <div className="space-y-1.5">
            {jars.map(jar => {
              const amount = Math.round(available * jar.percentage / 100);
              return (
                <motion.div key={jar.id} layout
                  className="neon-jar-card px-4 py-2.5 flex items-center justify-between gap-3"
                  style={{ borderColor: jar.neonColor + '28' }} whileHover={{ scale:1.01 }}>
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full" style={{ background: jar.neonColor }} />
                  <div className="flex items-center gap-2 pl-1.5">
                    <span className="text-sm">{jar.emoji}</span>
                    <span className="text-sm font-semibold truncate" style={{ color:'var(--theme-text-primary)' }}>{jar.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right flex-shrink-0">
                    <span className="text-xs tabular-nums" style={{ color:'var(--theme-text-muted)' }}>{fmtVND(amount)}</span>
                    <span className="text-sm font-extrabold w-9 tabular-nums" style={{ color:jar.neonColor, textShadow:`0 0 8px ${jar.neonColor}60` }}>
                      {jar.percentage}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════
          LƯU NGÂN SÁCH – locked until unallocated === 0
      ════════════════════════════════════════════════════════ */}
      <motion.div variants={card} className="flex justify-end">
        <motion.button onClick={handleSave} disabled={!isBalanced}
          whileHover={isBalanced ? { scale:1.04 } : {}} whileTap={isBalanced ? { scale:0.96 } : {}}
          className="flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300"
          style={{
            background: isBalanced ? 'linear-gradient(135deg,var(--theme-neon-primary),var(--theme-neon-accent))' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isBalanced ? 'var(--theme-neon-primary)60' : 'rgba(255,255,255,0.08)'}`,
            color: isBalanced ? '#000' : 'rgba(255,255,255,0.2)',
            cursor: isBalanced ? 'pointer' : 'not-allowed',
            boxShadow: isBalanced ? '0 0 28px var(--theme-neon-primary)50' : 'none',
          }}
          title={isBalanced ? 'Lưu ngân sách' : `Cần đủ 100% (còn ${unallocated > 0 ? unallocated + '% dư' : Math.abs(unallocated) + '% vượt'})`}
        >
          <Save className="w-4 h-4" />
          <span>{isBalanced ? 'Lưu Ngân Sách' : `Chờ đủ 100% (đang ${allocated}%)`}</span>
          {isBalanced && <ChevronRight className="w-4 h-4" />}
        </motion.button>
      </motion.div>

      {/* Save Toast */}
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity:0,y:24,scale:0.9 }} animate={{ opacity:1,y:0,scale:1 }} exit={{ opacity:0,y:24,scale:0.9 }}
            className="fixed bottom-24 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{ background:'var(--theme-glass-bg)', border:'1px solid var(--theme-neon-primary)50', backdropFilter:'blur(20px)', boxShadow:'0 0 20px var(--theme-neon-primary)30' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:'var(--theme-neon-primary)', boxShadow:'0 0 12px var(--theme-neon-primary)' }}>
              <Save className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color:'var(--theme-text-primary)' }}>Ngân sách đã được lưu!</p>
              <p className="text-xs" style={{ color:'var(--theme-text-muted)' }}>Tháng 4/2026 · {fmtVND(available)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
