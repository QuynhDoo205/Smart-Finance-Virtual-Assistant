import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet, Calendar, DollarSign, TrendingUp, Settings, Trash2, X, Filter, Zap, Pencil } from 'lucide-react';
import { calculateMonthlyForecast, getMonthlyHours } from '../../utils/salaryCalculator';

type IncomeType = 'fixed' | 'variable' | 'scheduled';
type SourceCategory = 'salary' | 'allowance' | 'other';

interface IncomeSource {
  id: string;
  name: string;
  type: IncomeType;
  sourceType: SourceCategory;
  expectedAmount?: number;
  hourlyRate?: number;
  workSchedule?: number[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}

interface IncomeRecord {
  id: string;
  sourceId: string;
  amount: number;
  date: string;
}

export default function IncomeManager() {
  const [amount, setAmount] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [sources, setSources] = useState<IncomeSource[]>([
    { id: '1', name: 'Lương công ty', type: 'fixed', sourceType: 'salary', expectedAmount: 15000000 },
    { id: '2', name: 'Làm Freelance', type: 'variable', sourceType: 'other' },
    { id: '3', name: 'Đầu tư lợi nhuận', type: 'variable', sourceType: 'other' },
    { id: '4', name: 'Gia đình hỗ trợ', type: 'fixed', sourceType: 'allowance', expectedAmount: 2000000 },
  ]);

  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [filterCategory, setFilterCategory] = useState<'all' | SourceCategory>('all');

  // --- Modal: Add Source ---
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState<IncomeType>('variable');
  const [newSourceCategory, setNewSourceCategory] = useState<SourceCategory>('other');
  const [newSourceAmount, setNewSourceAmount] = useState('');
  const [newSourceRate, setNewSourceRate] = useState('');
  const [newWorkSchedule, setNewWorkSchedule] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [activeDays, setActiveDays] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);

  // --- Modal: Quick Add (controlled input — no DOM access) ---
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddAmount, setQuickAddAmount] = useState('');

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  const parseFormattedNumber = (str: string) => Number(str.replace(/\D/g, ''));

  const handleAmountChange = (value: string, setter: (val: string) => void) => {
    const numeric = value.replace(/\D/g, '');
    setter(numeric === '' ? '' : formatCurrency(Number(numeric)));
  };

  const addRecord = (srcId: string, amt: number, recDate: string) => {
    setRecords(prev => [
      { id: Math.random().toString(), sourceId: srcId, amount: amt, date: recDate },
      ...prev,
    ]);
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !sourceId) return;
    addRecord(sourceId, parseFormattedNumber(amount), date);
    setAmount('');
  };

  const openQuickAddModal = (sourceName: string, defaultAmount: number) => {
    setQuickAddName(sourceName);
    setQuickAddAmount(formatCurrency(defaultAmount));
    setShowQuickAddModal(true);
  };

  const confirmQuickAdd = () => {
    const numericAmount = parseFormattedNumber(quickAddAmount);
    if (!numericAmount) return;

    let source = sources.find(s => s.name === quickAddName);
    if (!source) {
      source = { id: Math.random().toString(), name: quickAddName, type: 'variable', sourceType: 'other' };
      setSources(prev => [...prev, source!]);
    }

    addRecord(source.id, numericAmount, new Date().toISOString().split('T')[0]);
    setShowQuickAddModal(false);
  };

  const resetSourceForm = () => {
    setNewSourceName('');
    setNewSourceType('variable');
    setNewSourceCategory('other');
    setNewSourceAmount('');
    setNewSourceRate('');
    setNewWorkSchedule([0, 0, 0, 0, 0, 0, 0]);
    setActiveDays([false, false, false, false, false, false, false]);
    setEditingSource(null);
  };

  const openEditSourceModal = (source: IncomeSource) => {
    setEditingSource(source);
    setNewSourceName(source.name);
    setNewSourceType(source.type);
    setNewSourceCategory(source.sourceType);
    setNewSourceAmount(source.expectedAmount ? formatCurrency(source.expectedAmount) : '');
    setNewSourceRate(source.hourlyRate ? formatCurrency(source.hourlyRate) : '');
    setNewWorkSchedule(source.workSchedule ?? [0, 0, 0, 0, 0, 0, 0]);
    setActiveDays(source.workSchedule ? source.workSchedule.map(h => h > 0) : [false, false, false, false, false, false, false]);
    setShowAddSourceModal(true);
  };

  const handleSaveSource = () => {
    if (!newSourceName) return;

    const sourceData: Omit<IncomeSource, 'id'> = {
      name: newSourceName,
      type: newSourceType,
      sourceType: newSourceCategory,
      expectedAmount: newSourceType === 'fixed'
        ? parseFormattedNumber(newSourceAmount)
        : newSourceType === 'scheduled'
        ? calculateMonthlyForecast(newWorkSchedule, parseFormattedNumber(newSourceRate))
        : undefined,
      hourlyRate: newSourceType === 'scheduled' ? parseFormattedNumber(newSourceRate) : undefined,
      workSchedule: newSourceType === 'scheduled' ? newWorkSchedule : undefined,
    };

    if (editingSource) {
      setSources(prev => prev.map(s => s.id === editingSource.id ? { ...s, ...sourceData } : s));
    } else {
      setSources(prev => [...prev, { id: Math.random().toString(), ...sourceData }]);
    }

    setShowAddSourceModal(false);
    resetSourceForm();
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    if (sourceId === id) setSourceId('');
  };

  // --- Derived State ---

  const actualIncomeThisMonth = useMemo(
    () => records.reduce((sum, r) => sum + r.amount, 0),
    [records]
  );

  const totalForecasted = useMemo(
    () => sources.reduce((sum, s) => {
      if (s.type === 'scheduled' && s.workSchedule && s.hourlyRate) {
        return sum + calculateMonthlyForecast(s.workSchedule, s.hourlyRate);
      }
      return sum + (s.expectedAmount ?? 0);
    }, 0),
    [sources]
  );

  const filteredSources = useMemo(() => {
    if (filterCategory === 'all') return sources;
    return sources.filter(s => s.sourceType === filterCategory);
  }, [sources, filterCategory]);

  const filteredRecords = useMemo(() => {
    if (filterCategory === 'all') return records;
    return records.filter(r => sources.find(s => s.id === r.sourceId)?.sourceType === filterCategory);
  }, [records, sources, filterCategory]);

  const salaryForecast = useMemo(
    () => sources
      .filter(s => s.sourceType === 'salary')
      .reduce((sum, s) =>
        sum + (s.type === 'scheduled' && s.workSchedule && s.hourlyRate
          ? calculateMonthlyForecast(s.workSchedule, s.hourlyRate)
          : (s.expectedAmount ?? 0)),
        0),
    [sources]
  );

  const allowanceForecast = useMemo(
    () => sources
      .filter(s => s.sourceType === 'allowance')
      .reduce((sum, s) => sum + (s.expectedAmount ?? 0), 0),
    [sources]
  );

  const otherIncomeTotal = useMemo(
    () => records
      .filter(r => sources.find(s => s.id === r.sourceId)?.sourceType === 'other')
      .reduce((sum, r) => sum + r.amount, 0),
    [records, sources]
  );

  const getCategoryName = (cat: SourceCategory) => {
    if (cat === 'salary') return 'Lương / Việc làm';
    if (cat === 'allowance') return 'Trợ cấp';
    return 'Linh tinh / Khác';
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-8 max-w-5xl mx-auto pb-20">

      {/* Header */}
      <motion.div variants={itemVars} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Quản lý Thu nhập</h1>
          <p className="text-gray-400">Ghi nhận các khoản thu nhập cố định và biến đổi. Phân tách rạch ròi các luồng tiền.</p>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVars} className="glass-panel p-6 rounded-3xl border-t-emerald-500/30">
          <h3 className="text-gray-400 font-medium mb-1 flex items-center justify-between">
            Dự báo Tổng Thu (Tháng này)
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </h3>
          <div className="text-3xl font-bold text-white mt-2">
            {formatCurrency(totalForecasted)} đ
          </div>
          <p className="text-sm text-gray-500 mt-4 leading-relaxed">
            AI dự báo dựa trên {sources.filter(s => s.type === 'fixed').length} khoản cố định &amp; {sources.filter(s => s.type === 'scheduled').length} lịch làm việc part-time.
          </p>
        </motion.div>

        <motion.div variants={itemVars} className="glass-panel p-6 rounded-3xl border-t-sky-500/30">
          <h3 className="text-gray-400 font-medium mb-1">Thực thu (Đã nhận)</h3>
          <div className="text-3xl font-bold text-sky-400 mt-2">
            {formatCurrency(actualIncomeThisMonth)} đ
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 bg-gray-700/50 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((actualIncomeThisMonth / (totalForecasted || 1)) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 font-bold">{Math.round((actualIncomeThisMonth / (totalForecasted || 1)) * 100)}%</span>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="glass-panel p-6 rounded-3xl md:col-span-2 lg:col-span-1 flex flex-col justify-center">
          <h3 className="text-white font-bold mb-4 flex items-center justify-between">Phân loại Luồng tiền <Filter className="w-4 h-4 text-gray-400" /></h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Lương</span>
              <span className="text-white font-medium">{formatCurrency(salaryForecast)} đ</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-amber-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400" /> Trợ cấp</span>
              <span className="text-white font-medium">{formatCurrency(allowanceForecast)} đ</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-400" /> Khác (thực tế)</span>
              <span className="text-white font-medium">{formatCurrency(otherIncomeTotal)} đ</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <motion.div variants={itemVars} className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'salary', label: 'Lương / Job' },
          { id: 'allowance', label: 'Trợ cấp' },
          { id: 'other', label: 'Khác' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id as 'all' | SourceCategory)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              filterCategory === tab.id
                ? 'bg-white text-black'
                : 'bg-[#1F2937]/50 text-gray-400 hover:bg-[#1F2937] hover:text-white border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Form: Ghi nhận thu nhập thực tế */}
        <motion.div variants={itemVars} className="glass-panel p-8 rounded-3xl relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Plus className="w-6 h-6 text-emerald-400" />
            Ghi nhận thu nhập thực tế
          </h2>

          <form className="space-y-6" onSubmit={handleAddRecord}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Nguồn tiền (Đã lọc)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Wallet className="h-5 w-5 text-gray-500" />
                </div>
                <select
                  className="glass-input pl-11 appearance-none cursor-pointer"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  required
                >
                  <option value="" disabled className="bg-[#1F2937] text-gray-500">-- Chọn nguồn thu --</option>
                  {filteredSources.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#1F2937] text-white">
                      {s.name} ({getCategoryName(s.sourceType)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Số tiền nhận được (VNĐ)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
                <input
                  type="text"
                  required
                  className="glass-input pl-11 text-xl font-bold text-white"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value, setAmount)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Ngày ghi sổ</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="date"
                  required
                  className="glass-input pl-11 !text-gray-300"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full !bg-gradient-to-r !from-emerald-500 !to-teal-400 !shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-4">
              Cộng vào Ngân sách Tháng
            </button>

            <div className="pt-4 border-t border-white/5 mt-6">
              <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Thu nhập phụ (Thêm nhanh)
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="px-3 py-1.5 rounded-lg bg-[#1F2937]/50 border border-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/10 transition-colors" onClick={() => openQuickAddModal('Thưởng nóng', 1000000)}>+ Thưởng (1M)</button>
                <button type="button" className="px-3 py-1.5 rounded-lg bg-[#1F2937]/50 border border-sky-500/20 text-sky-400 text-sm hover:bg-sky-500/10 transition-colors" onClick={() => openQuickAddModal('Được cho tặng', 500000)}>+ Phụ cấp thêm (500k)</button>
                <button type="button" className="px-3 py-1.5 rounded-lg bg-[#1F2937]/50 border border-fuchsia-500/20 text-fuchsia-400 text-sm hover:bg-fuchsia-500/10 transition-colors" onClick={() => openQuickAddModal('Bán đồ cũ', 200000)}>+ Bán đồ</button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Quản lý Nguồn thu & Lịch sử */}
        <motion.div variants={itemVars} className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                Nguồn Thu &amp; Lịch sử
              </h3>
              <button
                onClick={() => setShowAddSourceModal(true)}
                className="text-emerald-400 text-sm font-semibold hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Nguồn thu
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar mb-6">
              {filteredSources.map(s => (
                <div key={s.id} className="group flex items-center justify-between p-3 rounded-2xl bg-[#1F2937]/30 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      s.sourceType === 'salary' ? 'bg-emerald-500/10 text-emerald-400' :
                      s.sourceType === 'allowance' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-sky-500/10 text-sky-400'
                    }`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{s.name} <span className="text-[10px] uppercase bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 ml-1">{s.sourceType}</span></h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        {s.type === 'fixed' && (
                          <><Calendar className="w-3 h-3" /> Cố định: {s.expectedAmount ? `${formatCurrency(s.expectedAmount)}đ` : ''}</>
                        )}
                        {s.type === 'scheduled' && s.workSchedule && (
                          <><Calendar className="w-3 h-3" /> Lịch: {getMonthlyHours(s.workSchedule)}giờ/tháng x {formatCurrency(s.hourlyRate ?? 0)}đ</>
                        )}
                        {s.type === 'variable' && 'Biến đổi (Không Cố định)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditSourceModal(s)}
                      className="p-2 text-gray-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-sky-500/10"
                      title="Sửa nguồn thu"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSource(s.id)}
                      className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-red-500/10"
                      title="Xóa nguồn thu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredSources.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Không có nguồn thu nào thuộc danh mục này.</p>}
            </div>

            <div className="pt-6 border-t border-white/5">
              <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Biến động thực tế (Tháng này)
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                  {filteredRecords.length === 0 && <p className="text-sm text-gray-500">Chưa có ghi nhận thực tế.</p>}
                  {filteredRecords.map(r => {
                    const source = sources.find(s => s.id === r.sourceId);
                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex justify-between items-center p-3 rounded-2xl bg-gradient-to-r from-[#1F2937]/50 to-[#111827]/50 border border-white/5 hover:border-emerald-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors uppercase">
                              {source?.name ?? 'Không rõ nguồn'} {source?.sourceType && <span className="text-[10px] text-gray-500 lowercase ml-1">({source.sourceType})</span>}
                            </p>
                            <p className="text-xs text-gray-500">{r.date}</p>
                          </div>
                        </div>
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">+{formatCurrency(r.amount)}đ</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* MODALS */}

      {/* Modal: Quick Add (controlled input) */}
      <AnimatePresence>
        {showQuickAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 rounded-3xl w-full max-w-sm relative !bg-[#111827] border-emerald-500/30"
            >
              <button onClick={() => setShowQuickAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">Thêm Nhanh</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Khoản thu nhập</p>
                  <p className="text-white font-semibold">{quickAddName} <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Khác (Other)</span></p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Số tiền (VNĐ)</label>
                  <input
                    type="text"
                    className="glass-input w-full text-xl font-bold text-emerald-400 bg-black/30"
                    value={quickAddAmount}
                    onChange={(e) => handleAmountChange(e.target.value, setQuickAddAmount)}
                  />
                </div>
                <div className="pt-2">
                  <button
                    onClick={confirmQuickAdd}
                    className="btn-primary w-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    Xác nhận cộng vào {formatCurrency(actualIncomeThisMonth)}đ
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Add Source */}
      <AnimatePresence>
        {showAddSourceModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 rounded-3xl w-full max-w-md relative my-8"
            >
              <button
                onClick={() => { setShowAddSourceModal(false); resetSourceForm(); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-xl font-bold text-white mb-6">{editingSource ? 'Chỉnh sửa Nguồn Thu' : 'Đăng ký Nguồn Thu Mới'}</h2>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-gray-300 block mb-1">Tên nguồn tiền (VD: Tiền làm bếp)</label>
                  <input
                    type="text"
                    className="glass-input w-full"
                    placeholder="Tên công ty hoặc job"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-300 block mb-2">Phân loại Dòng tiền (Source Type)</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'salary', label: 'Lương / Đi làm' },
                      { id: 'allowance', label: 'Trợ cấp' },
                      { id: 'other', label: 'Linh tinh' },
                    ].map(cat => (
                      <button
                        key={cat.id} type="button"
                        onClick={() => setNewSourceCategory(cat.id as SourceCategory)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                          newSourceCategory === cat.id
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-300 block mb-2">Tần suất làm việc (Income Type)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button type="button" onClick={() => setNewSourceType('fixed')} className={`p-2 lg:p-3 rounded-xl border flex items-center justify-center gap-2 transition-colors text-xs lg:text-sm ${newSourceType === 'fixed' ? 'bg-primary-500/20 border-primary-500/50 text-primary-400' : 'bg-[#1F2937]/50 border-white/5 text-gray-400 hover:border-white/10'}`}>Cố định</button>
                    <button type="button" onClick={() => setNewSourceType('scheduled')} className={`p-2 lg:p-3 rounded-xl border flex items-center justify-center gap-2 transition-colors text-xs lg:text-sm ${newSourceType === 'scheduled' ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-[#1F2937]/50 border-white/5 text-gray-400 hover:border-white/10'}`}>Theo lịch (Job)</button>
                    <button type="button" onClick={() => setNewSourceType('variable')} className={`p-2 lg:p-3 rounded-xl border flex items-center justify-center gap-2 transition-colors text-xs lg:text-sm ${newSourceType === 'variable' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-[#1F2937]/50 border-white/5 text-gray-400 hover:border-white/10'}`}>Biến đổi (RV)</button>
                  </div>
                </div>

                {newSourceType === 'fixed' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 overflow-hidden pt-2 border-t border-white/5">
                    <div>
                      <label className="text-sm font-semibold text-gray-300 block mb-1">Số tiền cố định nhận mỗi tháng (VNĐ)</label>
                      <input
                        type="text"
                        className="glass-input w-full text-lg font-bold"
                        placeholder="0"
                        value={newSourceAmount}
                        onChange={(e) => handleAmountChange(e.target.value, setNewSourceAmount)}
                      />
                    </div>
                  </motion.div>
                )}

                {newSourceType === 'scheduled' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 overflow-hidden pt-2 border-t border-white/5">
                    <div>
                      <label className="text-sm font-semibold text-gray-300 block mb-3">1. Chọn các ngày đi làm trong tuần</label>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((dayName, idx) => (
                          <button
                            key={idx} type="button"
                            onClick={() => {
                              const newActive = [...activeDays];
                              newActive[idx] = !newActive[idx];
                              setActiveDays(newActive);
                              if (!newActive[idx]) {
                                const newSched = [...newWorkSchedule];
                                newSched[idx] = 0;
                                setNewWorkSchedule(newSched);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                              activeDays[idx] ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)] border border-sky-400' : 'bg-[#1F2937]/50 text-gray-400 border border-white/5 hover:border-white/10'
                            }`}
                          >
                            {dayName}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeDays.some(d => d) && (
                      <div className="space-y-3 bg-[#111827]/50 p-4 rounded-2xl border border-white/5">
                        <label className="text-sm font-semibold text-sky-400 block mb-2">2. Số giờ làm mỗi ca</label>
                        {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((dayName, idx) => (
                          activeDays[idx] && (
                            <div key={idx} className="flex items-center justify-between bg-[#1F2937]/30 p-2 rounded-xl border border-white/5">
                              <span className="text-sm font-medium text-gray-300 pl-2">{dayName}</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number" min="0.5" step="0.5"
                                  className="glass-input w-24 text-center py-1.5 text-white"
                                  placeholder="VD: 4"
                                  value={newWorkSchedule[idx] || ''}
                                  onChange={(e) => {
                                    const newSched = [...newWorkSchedule];
                                    newSched[idx] = Number(e.target.value);
                                    setNewWorkSchedule(newSched);
                                  }}
                                />
                                <span className="text-sm text-gray-500 pr-2">giờ</span>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-semibold text-gray-300 block mb-1">3. Mức lương / giờ (VNĐ)</label>
                      <input
                        type="text"
                        className="glass-input w-full text-lg font-bold"
                        placeholder="VD: 25000"
                        value={newSourceRate}
                        onChange={(e) => handleAmountChange(e.target.value, setNewSourceRate)}
                      />
                    </div>

                    {newWorkSchedule.some(h => h > 0) && newSourceRate && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                        <div className="mt-0.5 p-1 bg-emerald-500/20 rounded-lg text-emerald-400">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-300 mb-1">Hệ thống đếm được tổng <strong>{getMonthlyHours(newWorkSchedule)} giờ</strong> làm việc trong tháng này.</p>
                          <p className="text-emerald-400 font-bold">Dự báo lương sẽ nhận: {formatCurrency(calculateMonthlyForecast(newWorkSchedule, parseFormattedNumber(newSourceRate)))} đ</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <button
                  onClick={handleSaveSource}
                  disabled={!newSourceName || (newSourceType === 'fixed' && !newSourceAmount)}
                  className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingSource ? 'Lưu thay đổi' : 'Xác nhận Nguồn Thu'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
