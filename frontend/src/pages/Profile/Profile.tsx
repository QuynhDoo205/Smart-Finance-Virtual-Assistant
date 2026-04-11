import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Home, Shield, Compass, Edit3, ArrowUpRight,
  Plus, Pencil, Trash2, X, Check, AlertTriangle, DollarSign,
  FileText, Tag, TrendingDown, Mail
} from 'lucide-react';
import authStore from '../../store/authStore';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
}

// ─── Initial Mock Data ─────────────────────────────────────────────────────────
const INITIAL_EXPENSES: FixedExpense[] = [
  { id: '1', name: 'Tiền thuê nhà',   amount: 2000000, category: 'Nhà ở' },
  { id: '2', name: 'Tiền điện / nước', amount: 500000,  category: 'Tiện ích' },
  { id: '3', name: 'Internet / 4G',   amount: 200000,  category: 'Tiện ích' },
  { id: '4', name: 'Netflix',          amount: 99000,   category: 'Giải trí' },
  { id: '5', name: 'Học phí tiếng Anh', amount: 800000, category: 'Học tập' },
];

const CATEGORY_OPTIONS = ['Nhà ở', 'Tiện ích', 'Giải trí', 'Học tập', 'Bảo hiểm', 'Khác'];

const CATEGORY_COLORS: Record<string, string> = {
  'Nhà ở':    'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'Tiện ích': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Giải trí': 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
  'Học tập':  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Bảo hiểm': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  'Khác':     'text-theme-text-muted bg-gray-500/10 border-gray-500/20',
};

// ─── ExpenseModal (Add / Edit) ────────────────────────────────────────────────
interface ModalProps {
  initial: Partial<FixedExpense>;
  onSave: (name: string, amount: number, category: string) => void;
  onClose: () => void;
}

function ExpenseModal({ initial, onSave, onClose }: ModalProps) {
  const amountInputId = useId();
  const [name, setName] = useState(initial.name ?? '');
  const [amountStr, setAmountStr] = useState(
    initial.amount ? new Intl.NumberFormat('vi-VN').format(initial.amount) : ''
  );
  const [category, setCategory] = useState(initial.category ?? 'Khác');

  const fmt = (v: string) => {
    const n = v.replace(/\D/g, '');
    return n === '' ? '' : new Intl.NumberFormat('vi-VN').format(Number(n));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(amountStr.replace(/\D/g, ''));
    if (!name.trim() || !amount) return;
    onSave(name.trim(), amount, category);
  };

  const isEditing = !!initial.id;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.93, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="w-full max-w-md relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(5,13,26,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 0 50px -15px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-theme-text-primary">
                {isEditing ? 'Chỉnh sửa Chi phí' : 'Thêm Chi phí Cố định'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-theme-text-muted hover:text-theme-text-primary hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-[11px] font-bold text-theme-text-muted uppercase tracking-widest block mb-1.5">Tên khoản phí</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted pointer-events-none" />
                <input
                  type="text" required autoFocus
                  placeholder="VD: Tiền thuê nhà"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-theme-text-primary placeholder-gray-600 text-sm outline-none transition-all"
                  style={{ background: 'rgba(6,20,40,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor={amountInputId} className="text-[11px] font-bold text-theme-text-muted uppercase tracking-widest block mb-1.5">Số tiền / tháng (VNĐ)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
                <input
                  id={amountInputId}
                  type="text" required
                  placeholder="0"
                  value={amountStr}
                  onChange={e => setAmountStr(fmt(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-theme-text-primary placeholder-gray-600 text-xl font-bold outline-none transition-all"
                  style={{ background: 'rgba(6,20,40,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] font-bold text-theme-text-muted uppercase tracking-widest block mb-1.5">Danh mục</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map(cat => (
                  <motion.button
                    key={cat} type="button"
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      category === cat
                        ? CATEGORY_COLORS[cat] ?? 'text-theme-text-primary bg-indigo-500/20 border-indigo-500/30'
                        : 'text-theme-text-muted border-white/5 hover:text-theme-text-muted hover:border-white/10'
                    }`}
                    style={{ background: category === cat ? undefined : 'rgba(6,20,40,0.6)' }}
                  >
                    <Tag className="w-3 h-3" /> {cat}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-white/8 text-theme-text-muted hover:text-theme-text-primary hover:border-white/15 transition-colors text-sm font-medium"
                style={{ background: 'rgba(6,20,40,0.5)' }}
              >
                Hủy
              </button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(99,102,241,0.55)' }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-theme-text-primary font-bold text-sm flex items-center justify-center gap-2"
                style={{ boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}
              >
                <Check className="w-4 h-4" />
                {isEditing ? 'Lưu thay đổi' : 'Thêm khoản phí'}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────
interface ConfirmProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteDialog({ name, onConfirm, onCancel }: ConfirmProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(5,13,26,0.97)',
          border: '1px solid rgba(239,68,68,0.2)',
          boxShadow: '0 0 40px -10px rgba(239,68,68,0.35)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-400 to-transparent" />
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-theme-text-primary font-bold text-lg mb-2">Xác nhận xóa</h3>
          <p className="text-theme-text-muted text-sm mb-1">Bạn có chắc chắn muốn xóa khoản phí</p>
          <p className="text-theme-text-primary font-semibold mb-6">"{name}"?</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-white/8 text-theme-text-muted hover:text-theme-text-primary transition-colors text-sm font-medium"
              style={{ background: 'rgba(6,20,40,0.5)' }}
            >
              Hủy bỏ
            </button>
            <motion.button
              onClick={onConfirm}
              whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(239,68,68,0.5)' }}
              whileTap={{ scale: 0.96 }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-theme-text-primary font-bold text-sm flex items-center justify-center gap-2"
              style={{ boxShadow: '0 0 15px rgba(239,68,68,0.3)' }}
            >
              <Trash2 className="w-4 h-4" /> Xóa
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Confirm Delete Account Modal ────────────────────────────────────────────────
interface ConfirmDeleteAccountProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteAccountModal({ onConfirm, onCancel }: ConfirmDeleteAccountProps) {
  const [confirmText, setConfirmText] = useState('');
  const isMatch = confirmText === 'CONFIRM DELETE';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(5,13,26,0.97)',
          border: '1px solid rgba(239,68,68,0.3)',
          boxShadow: '0 0 50px -10px rgba(239,68,68,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
        <div className="p-8">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-theme-text-primary font-extrabold text-2xl mb-3">Cảnh báo: Xóa tài khoản vĩnh viễn</h3>
          <p className="text-theme-text-muted text-sm mb-6 leading-relaxed">
            Hành động này <strong className="text-red-400">không thể hoàn tác</strong>. Toàn bộ dữ liệu tài chính, ngân sách, biểu đồ và cài đặt của bạn sẽ bị xóa vĩnh viễn khỏi toàn bộ hệ thống lưu trữ.
          </p>
          
          <div className="mb-6 space-y-2">
            <label className="text-[11px] font-bold text-theme-text-muted uppercase tracking-widest block">Để xác nhận, vui lòng gõ <span className="text-theme-text-primary">"CONFIRM DELETE"</span></label>
            <input
              type="text" autoFocus
              placeholder="CONFIRM DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-theme-text-primary placeholder-gray-600 text-sm font-mono outline-none transition-all"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(239,68,68,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(239,68,68,0.2)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-xl border border-white/10 text-theme-text-muted hover:text-theme-text-primary transition-colors text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              Giữ lại tài khoản
            </button>
            <motion.button
              disabled={!isMatch}
              onClick={onConfirm}
              whileHover={isMatch ? { scale: 1.02, boxShadow: '0 0 25px rgba(239,68,68,0.6)' } : {}}
              whileTap={isMatch ? { scale: 0.96 } : {}}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isMatch 
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-theme-text-primary cursor-pointer' 
                  : 'bg-red-500/10 text-red-500/50 cursor-not-allowed border border-red-500/10'
              }`}
            >
              <Trash2 className="w-4 h-4" /> Xác nhận xóa
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Profile Component ───────────────────────────────────────────────────
export default function Profile() {
  const [activeTab, setActiveTab] = useState<'expenses' | 'security'>('expenses');

  // Fixed expenses state
  const [expenses, setExpenses] = useState<FixedExpense[]>(INITIAL_EXPENSES);
  const [modalData, setModalData] = useState<Partial<FixedExpense> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FixedExpense | null>(null);

  // Security features state
  const user = authStore.getUser();
  const [userAuth] = useState({ 
    provider: user?.email.includes('gmail') ? 'google' : 'email', 
    email: user?.email || '' 
  });
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
  const totalFixed = expenses.reduce((s, e) => s + e.amount, 0);

  const openAddModal = () => setModalData({});
  const openEditModal = (exp: FixedExpense) => setModalData(exp);

  const handleSave = (name: string, amount: number, category: string) => {
    if (modalData?.id) {
      setExpenses(prev => prev.map(e => e.id === modalData.id ? { ...e, name, amount, category } : e));
    } else {
      setExpenses(prev => [...prev, { id: Math.random().toString(36).slice(2), name, amount, category }]);
    }
    setModalData(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setExpenses(prev => prev.filter(e => e.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVars = {
    hidden: { opacity: 0, scale: 0.96 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 220, damping: 22 } },
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8 relative pb-20">

      {/* Ambient blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* ── Hero Card ── */}
      <motion.div variants={itemVars} className="group relative rounded-[2.5rem] overflow-hidden p-px bg-gradient-to-br from-white/10 to-transparent shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" />
        <div className="relative bg-[#0F172A]/90 backdrop-blur-3xl rounded-[2.3rem] p-8 md:p-12 border border-white/5 flex flex-col md:flex-row items-center md:items-start gap-8 overflow-hidden">
          <Compass className="absolute -bottom-10 -right-10 w-64 h-64 text-theme-text-primary/[0.02] -rotate-12 group-hover:rotate-12 transition-transform duration-[10s]" />
          <div className="relative">
            <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-5xl font-extrabold text-theme-text-primary shadow-[0_0_40px_rgba(99,102,241,0.4)] rotate-3 hover:rotate-0 transition-transform duration-300">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <button className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#1E293B] border-[3px] border-[#0F172A] rounded-full flex items-center justify-center text-theme-text-muted hover:text-theme-text-primary hover:bg-indigo-500 transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center md:text-left flex-1 relative z-10 pt-2">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <h1 className="text-4xl font-extrabold text-theme-text-primary tracking-tight">{user?.full_name || 'Người dùng'}</h1>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                <Shield className="w-3 h-3" /> Pro
              </span>
            </div>
            <p className="text-lg text-theme-text-muted mb-6 font-medium">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
              {[
                { label: 'Tài khoản từ', value: '04/2026' },
                { label: 'Số huy hiệu', value: '12 Badges' },
                { label: 'Chi phí cố định', value: `${fmt(totalFixed)}đ/tháng` },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-xs text-theme-text-muted uppercase tracking-wider font-semibold">{stat.label}</span>
                  <span className="text-theme-text-primary font-medium flex items-center gap-1">{stat.value} <ArrowUpRight className="w-3 h-3 text-theme-text-muted" /></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sidebar Nav */}
        <motion.div variants={itemVars} className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {[
            { id: 'expenses' as const, label: 'Chi phí Cố định', icon: Home, gradient: 'from-sky-500 to-indigo-500', glow: 'rgba(99,102,241,0.2)' },
            { id: 'security' as const, label: 'Bảo mật & Access', icon: Key, gradient: 'from-purple-500 to-fuchsia-500', glow: 'rgba(168,85,247,0.2)' },
          ].map(({ id, label, icon: Icon, gradient, glow }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              whileHover={{ scale: activeTab === id ? 1 : 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl w-full font-medium transition-all duration-300 text-left whitespace-nowrap ${
                activeTab === id
                  ? `bg-gradient-to-r ${gradient} text-theme-text-primary`
                  : 'text-theme-text-muted hover:text-theme-text-primary bg-[#1E293B]/50 hover:bg-[#1E293B] border border-transparent hover:border-white/5'
              }`}
              style={activeTab === id ? { boxShadow: `0 0 22px ${glow}` } : {}}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm tracking-wide">{label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">

            {/* ════════════ TAB: FIXED EXPENSES ════════════ */}
            {activeTab === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(5,13,26,0.80)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 0 50px -18px rgba(56,189,248,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent" />

                <div className="p-8">
                  {/* Section header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h2 className="text-2xl font-bold text-theme-text-primary">Chi phí Cố định Hàng tháng</h2>
                      <p className="text-theme-text-muted text-sm mt-1">
                        Thay đổi danh sách này sẽ cập nhật trực tiếp vào ngân sách AI của bạn.
                      </p>
                    </div>
                    <motion.button
                      onClick={openAddModal}
                      whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(56,189,248,0.5)' }}
                      whileTap={{ scale: 0.96 }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-theme-text-primary text-sm font-bold flex-shrink-0"
                      style={{ boxShadow: '0 0 18px rgba(56,189,248,0.35)' }}
                    >
                      <Plus className="w-4 h-4" /> Thêm mới
                    </motion.button>
                  </div>

                  {/* Summary bar */}
                  <motion.div
                    key={totalFixed}
                    initial={{ scale: 1.02 }} animate={{ scale: 1 }}
                    className="flex items-center justify-between p-4 rounded-xl mb-6 mt-5"
                    style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.12)' }}
                  >
                    <div className="flex items-center gap-2 text-theme-text-muted text-sm">
                      <TrendingDown className="w-4 h-4 text-sky-400" />
                      Tổng chi phí cố định tháng này
                    </div>
                    <span className="text-xl font-extrabold text-sky-400">{fmt(totalFixed)}<span className="text-sm font-normal text-sky-600 ml-1">đ</span></span>
                  </motion.div>

                  {/* Expense list */}
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {expenses.map(exp => {
                        const catColor = CATEGORY_COLORS[exp.category] ?? CATEGORY_COLORS['Khác'];
                        return (
                          <motion.div
                            key={exp.id}
                            layout
                            initial={{ opacity: 0, y: -14, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92, height: 0, marginBottom: 0 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                            className="group overflow-hidden"
                          >
                            <motion.div
                              whileHover={{ x: 3, borderColor: 'rgba(255,255,255,0.12)' }}
                              className="flex items-center gap-4 p-4 rounded-xl transition-colors"
                              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                              {/* Icon */}
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${catColor}`}>
                                <DollarSign className="w-5 h-5" />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-theme-text-primary">{exp.name}</p>
                                <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${catColor}`}>
                                  <Tag className="w-2.5 h-2.5" /> {exp.category}
                                </span>
                              </div>

                              {/* Amount */}
                              <span className="text-base font-bold text-theme-text-primary mr-2 flex-shrink-0">
                                {fmt(exp.amount)}<span className="text-xs font-normal text-theme-text-muted ml-0.5">đ</span>
                              </span>

                              {/* Actions — visible on hover */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <motion.button
                                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                  onClick={() => openEditModal(exp)}
                                  className="p-2 rounded-lg text-theme-text-muted hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Pencil className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                  onClick={() => setDeleteTarget(exp)}
                                  className="p-2 rounded-lg text-theme-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {expenses.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-14">
                        <p className="text-4xl mb-3">📋</p>
                        <p className="text-theme-text-muted text-sm">Chưa có khoản phí cố định nào.</p>
                        <button onClick={openAddModal} className="mt-4 text-sky-400 text-sm hover:text-sky-300 underline underline-offset-4 transition-colors">
                          Thêm khoản đầu tiên →
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════════ TAB: SECURITY ════════════ */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="glass-panel p-8 md:p-10 rounded-[2rem] relative overflow-hidden flex flex-col items-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full" />
                
                <div className="w-full max-w-xl flex flex-col">
                  <h2 className="text-2xl font-bold text-theme-text-primary mb-2 text-center">Thông tin &amp; Bảo mật</h2>
                  <p className="text-theme-text-muted mb-8 text-sm text-center">Tài khoản của bạn được bảo vệ bằng mã hóa cấp cao. Hãy luôn theo dõi thông tin xác thực bên dưới.</p>

                  {/* Authentication Provider Display */}
                  <div className="mb-8 p-5 rounded-2xl border border-white/5 w-full" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                     <p className="text-[11px] font-bold text-theme-text-muted uppercase tracking-widest mb-3">Phương thức đăng nhập hiện tại</p>
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] text-theme-text-primary">
                          {userAuth.provider === 'google' ? (
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"/></svg>
                          ) : (
                            <Mail className="w-5 h-5" />
                          )}
                       </div>
                       <div>
                         <p className="text-sm text-theme-text-muted font-medium">Bạn đang đăng nhập bằng: <span className="text-theme-text-primary font-bold capitalize">{userAuth.provider}</span></p>
                         <p className="text-xs text-fuchsia-400 mt-1 font-mono tracking-tight">{userAuth.email}</p>
                       </div>
                     </div>
                  </div>

                  <div className="space-y-5 w-full mb-8">
                    {[
                      { label: 'Mật khẩu hiện tại', icon: Key, color: 'text-theme-text-muted', focus: 'rgba(255,255,255,0.2)' },
                      { label: 'Mật khẩu mới', icon: Shield, color: 'text-fuchsia-400', focus: 'rgba(217,70,239,0.45)' },
                    ].map(({ label, icon: Icon, color, focus }) => (
                      <div key={label} className="space-y-1.5">
                        <label className="text-[11px] font-bold text-theme-text-muted uppercase tracking-widest">{label}</label>
                        <div className="relative">
                          <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${color} pointer-events-none`} />
                          <input
                            type="password"
                            className="w-full bg-[#0F172A] border border-white/5 rounded-2xl px-4 py-4 pl-12 text-lg text-theme-text-primary placeholder-gray-600 focus:outline-none transition-all font-mono"
                            placeholder="••••••••"
                            onFocus={e => { e.target.style.borderColor = focus; e.target.style.boxShadow = `0 0 0 3px ${focus}33`; }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.05)'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-6 border-t border-white/5 w-full">
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(217,70,239,0.45)' }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-2 px-8 py-4 w-full md:w-auto bg-gradient-to-r from-purple-600 to-fuchsia-500 text-theme-text-primary font-bold rounded-xl"
                      style={{ boxShadow: '0 0 20px rgba(217,70,239,0.3)' }}
                    >
                      <Key className="w-5 h-5" /> Đổi mật khẩu
                    </motion.button>
                  </div>

                  {/* Danger Zone */}
                  <div className="mt-12 pt-8 border-t border-red-500/20 w-full overflow-hidden relative group">
                    <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl" style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                      <div>
                        <h3 className="text-lg font-bold text-red-400 mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Danger Zone</h3>
                        <p className="text-theme-text-muted text-sm">Đóng vĩnh viễn tài khoản và mọi dữ liệu.</p>
                      </div>
                      <motion.button
                        onClick={() => setShowDeleteAccount(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-5 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm border border-red-500/20 hover:bg-red-500 hover:text-theme-text-primary transition-colors flex-shrink-0 whitespace-nowrap"
                        style={{ boxShadow: '0 0 15px rgba(239,68,68,0.1)' }}
                      >
                        Xóa tài khoản
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals (portal via AnimatePresence) ── */}
      <AnimatePresence>
        {modalData !== null && (
          <ExpenseModal
            key="expense-modal"
            initial={modalData}
            onSave={handleSave}
            onClose={() => setModalData(null)}
          />
        )}
        {deleteTarget !== null && (
          <ConfirmDeleteDialog
            key="confirm-delete"
            name={deleteTarget.name}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
        {showDeleteAccount && (
          <ConfirmDeleteAccountModal
            key="confirm-delete-account"
            onConfirm={() => {
              // Usually calls an API and logs out. For now, we simulate close.
              setShowDeleteAccount(false);
              // navigate('/login');
            }}
            onCancel={() => setShowDeleteAccount(false)}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
}
