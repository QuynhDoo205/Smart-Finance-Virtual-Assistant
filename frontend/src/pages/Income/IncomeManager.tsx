import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Trash2, CheckCircle2, AlertCircle, Info, Settings, Wallet, Banknote, Edit3, TrendingUp, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { incomeApi, transactionsApi } from "../../utils/api";
import { calculateMonthlyForecast } from "../../utils/salaryCalculator";

type IncomeType = "fixed" | "variable" | "scheduled";
type SourceCategory = "salary" | "allowance" | "other";

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
  const getLocalDateStr = (d: Date | string = new Date()) => {
    let date: Date;
    if (typeof d === 'string') {
      if (d.includes('T')) {
        date = new Date(d);
      } else {
        const [y, m, d_part] = d.split('-').map(Number);
        date = new Date(y, m - 1, d_part);
      }
    } else {
      date = d;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [date, setDate] = useState(getLocalDateStr());
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string; type: 'record' | 'source' } | null>(null);

  const todayStr = getLocalDateStr();

  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  // --- Modal: Add Source ---
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceType, setNewSourceType] = useState<IncomeType>("variable");
  const [newSourceCategory, setNewSourceCategory] = useState<SourceCategory>("other");
  const [newSourceAmount, setNewSourceAmount] = useState("");
  const [newSourceRate, setNewSourceRate] = useState("");
  const [newWorkSchedule, setNewWorkSchedule] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);

  // Load data from Backend
  useEffect(() => {
    const loadData = async () => {
      try {
        const [srcRes, transRes] = await Promise.all([
          incomeApi.getSources(),
          transactionsApi.list(50),
        ]);

        if (srcRes.success) {
          const mappedSources: IncomeSource[] = srcRes.data.sources.map(
            (s: any) => ({
              id: s.id.toString(),
              name: s.ten_nguon,
              type: s.loai_nguon,
              sourceType: s.loai_danh_muc as SourceCategory,
              expectedAmount: s.so_tien_du_kien
                ? parseFloat(s.so_tien_du_kien.toString())
                : undefined,
              hourlyRate: s.luong_theo_gio
                ? parseFloat(s.luong_theo_gio.toString())
                : undefined,
              workSchedule: s.lich_lam_viec,
            }),
          );
          setSources(mappedSources);
        }

        if (transRes.success) {
          const mappedRecords: IncomeRecord[] = transRes.data.transactions
            .filter(
              (t: any) =>
                t.type === "income" || t.loai_giao_dich === "thu_nhap",
            )
            .map((t: any) => ({
              id: t.id.toString(),
              sourceId: "1",
              amount: parseFloat(t.so_tien || t.amount),
              date: t.ngay_giao_dich || t.transaction_date,
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setRecords(mappedRecords);
        }
      } catch (err) {
        console.error("Failed to load income data:", err);
      }
    };
    loadData();
  }, []);

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN").format(val);
  const parseFormattedNumber = (str: string) => Number(str.replace(/\D/g, ""));

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
  ) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setter(rawValue);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      setNotification({ type: 'error', message: 'Vui lòng nhập số tiền' });
      return;
    }
    if (!sourceId) {
      setNotification({ type: 'error', message: 'Bạn chưa chọn Nguồn tiền (VD: Lương, Thưởng...)' });
      setIsSelectOpen(true); // Tự động mở để nhắc người dùng
      return;
    }

    try {
      const numericAmount = parseFormattedNumber(amount);
      const source = sources.find((s) => s.id === sourceId);

      const res = await transactionsApi.create({
        title: source?.name || "Thu nhập",
        amount: numericAmount,
        type: "thu_nhap",
        categoryId: 1,
        date: date,
        note: `Thu nhập ghi từ ${source?.name}`,
      });

      if (res.success) {
        setRecords((prev) => [
          {
            id: res.data.transaction.id.toString(),
            sourceId,
            amount: numericAmount,
            date,
          },
          ...prev,
        ]);
        setAmount("");
      }
    } catch (err) {
      console.error("Record income failed:", err);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { id, type } = confirmDelete;

    try {
      if (type === 'record') {
        const res = await transactionsApi.delete(parseInt(id));
        if (res.success) {
          setRecords((prev) => prev.filter((r) => r.id !== id));
          setNotification({ type: 'success', message: 'Đã xóa giao dịch thành công' });
        }
      } else {
        const res = await incomeApi.deleteSource(parseInt(id));
        if (res.success) {
          setSources((prev) => prev.filter((s) => s.id !== id));
          setNotification({ type: 'success', message: 'Đã gỡ bỏ nguồn thu này' });
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setNotification({ type: 'error', message: 'Lỗi khi thực hiện xóa' });
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleDeleteRecord = (record: IncomeRecord) => {
    const sourceName = sources.find(s => s.id === record.sourceId)?.name || 'Khoản thu này';
    setConfirmDelete({ id: record.id, title: sourceName, type: 'record' });
  };

  const resetSourceForm = () => {
    setNewSourceName("");
    setNewSourceType("variable");
    setNewSourceCategory("other");
    setNewSourceAmount("");
    setNewSourceRate("");
    setNewWorkSchedule([0, 0, 0, 0, 0, 0, 0]);
    setEditingSource(null);
  };

  const handleEditSource = (source: IncomeSource) => {
    setEditingSource(source);
    setNewSourceName(source.name);
    setNewSourceType(source.type);
    setNewSourceCategory(source.sourceType);
    setNewSourceAmount(source.expectedAmount ? formatCurrency(source.expectedAmount) : "");
    setNewSourceRate(source.hourlyRate ? formatCurrency(source.hourlyRate) : "");
    setNewWorkSchedule(source.workSchedule || [0, 0, 0, 0, 0, 0, 0]);
    setShowAddSourceModal(true);
  };

  const handleSaveSource = async () => {
    if (!newSourceName) return;
    const sourceData = {
      name: newSourceName,
      type: newSourceType,
      category: newSourceCategory,
      expectedAmount:
        newSourceType === "fixed"
          ? parseFormattedNumber(newSourceAmount)
          : null,
      hourlyRate:
        newSourceType === "scheduled"
          ? parseFormattedNumber(newSourceRate)
          : null,
      schedule: newSourceType === "scheduled" ? newWorkSchedule : null,
    };

    try {
      const res = await (incomeApi as any).createSource(sourceData);
      if (res.success) {
        const s = res.data.source;
        const newSource: IncomeSource = {
          id: s.id.toString(),
          name: s.ten_nguon,
          type: s.loai_nguon,
          sourceType: s.loai_danh_muc as SourceCategory,
          expectedAmount: s.so_tien_du_kien
            ? parseFloat(s.so_tien_du_kien.toString())
            : undefined,
          hourlyRate: s.luong_theo_gio
            ? parseFloat(s.luong_theo_gio.toString())
            : undefined,
          workSchedule: s.lich_lam_viec,
        };
        setSources((prev) => [
          ...prev.filter((x) => x.id !== newSource.id),
          newSource,
        ]);
        setNotification({ type: 'success', message: `Đã lưu nguồn thu: ${newSourceName}` });
        setShowAddSourceModal(false);
        resetSourceForm();
      }
    } catch (err) {
      console.error("Save source failed:", err);
      setNotification({ type: 'error', message: 'Không thể lưu nguồn thu. Vui lòng thử lại.' });
    }
  };

  const handleDeleteSource = (id: string) => {
    const source = sources.find(s => s.id === id);
    if (source) {
      setConfirmDelete({ id, title: source.name, type: 'source' });
    }
  };

  // --- Derived State ---
  const actualIncomeThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return records
      .filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records]);
  const totalForecasted = useMemo(
    () =>
      sources.reduce((sum, s) => {
        if (s.type === "scheduled" && s.workSchedule && s.hourlyRate) {
          return sum + calculateMonthlyForecast(s.workSchedule, s.hourlyRate);
        }
        return sum + (s.expectedAmount ?? 0);
      }, 0),
    [sources],
  );



  return (
    <motion.div
      variants={containerVars}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-5xl mx-auto pb-20 p-6"
    >
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 min-w-[300px] ${
              notification.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 
              notification.type === 'error' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 
              'bg-blue-500/20 border-blue-500/30 text-blue-400'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${
              notification.type === 'success' ? 'bg-emerald-500/20' : 
              notification.type === 'error' ? 'bg-rose-500/20' : 
              'bg-blue-500/20'
            }`}>
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {notification.type === 'info' && <Info className="w-4 h-4" />}
            </div>
            <p className="text-sm font-bold tracking-wide">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={itemVars}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-theme-text-primary mb-2">
            Quản lý Thu nhập
          </h1>
          <p className="text-theme-text-muted">
            Ghi nhận các khoản thu nhập và theo dõi dự báo tài chính.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          variants={itemVars}
          className="glass-panel p-6 rounded-[24px] relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-12 -mt-12" />
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-theme-text-muted font-bold text-[10px] uppercase tracking-widest mb-1">
                Thu nhập dự tính (Cả tháng)
              </h3>
              <div className="text-2xl font-black text-theme-text-primary tracking-tight">
                {formatCurrency(totalForecasted)} <span className="text-sm text-theme-text-muted font-normal uppercase">vnđ</span>
              </div>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((actualIncomeThisMonth / (totalForecasted || 1)) * 100, 100)}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
              />
            </div>
            <span className="text-[10px] font-bold text-emerald-400">
              {Math.round((actualIncomeThisMonth / (totalForecasted || 1)) * 100)}%
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={itemVars}
          className="glass-panel p-6 rounded-[24px] relative overflow-hidden group hover:border-sky-500/30 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl -mr-12 -mt-12" />
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-theme-text-muted font-bold text-[10px] uppercase tracking-widest mb-1">
                Tiền mặt đã nhận (Tháng {new Date().getMonth() + 1})
              </h3>
              <div className="text-2xl font-black text-sky-400 tracking-tight">
                {formatCurrency(actualIncomeThisMonth)} <span className="text-sm text-theme-text-muted font-normal uppercase">vnđ</span>
              </div>
            </div>
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
              <Wallet className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-theme-text-muted italic">
            * Số tiền bạn đã thực sự nhập vào ngân sách.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          variants={itemVars}
          className="glass-panel p-6 rounded-[32px] shadow-xl relative border border-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-theme-text-primary flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <Banknote className="w-5 h-5 text-emerald-400" />
              </div>
              Ghi nhận Thu nhập
            </h2>
          </div>

          <form className="space-y-5" onSubmit={handleAddRecord}>
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest ml-1">Chọn nguồn tiền</label>
              
              {/* Custom Select Wrapper */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                  className={`glass-input w-full py-3 px-4 text-sm font-bold flex items-center justify-between group transition-all duration-300 ${isSelectOpen ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20' : ''}`}
                >
                  <span className={sourceId ? 'text-theme-text-primary' : 'text-white/20'}>
                    {sourceId ? (sources.find(s => s.id === sourceId)?.name) : '-- Chọn nguồn tiền --'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-theme-text-muted transition-transform duration-300 ${isSelectOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                </button>

                <AnimatePresence>
                  {isSelectOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSelectOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 0, scale: 0.95 }}
                        animate={{ opacity: 1, y: 8, scale: 1 }}
                        exit={{ opacity: 0, y: 0, scale: 0.95 }}
                        className="absolute top-full left-0 w-full z-20 bg-[#1e293b] border border-white/20 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden py-2"
                      >
                        {sources.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-theme-text-muted italic">Chưa có nguồn tiền nào</div>
                        ) : (
                          sources.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSourceId(s.id);
                                setIsSelectOpen(false);
                              }}
                              className={`w-full px-4 py-3 text-left text-sm font-bold transition-all hover:bg-emerald-500/20 flex items-center justify-between group ${sourceId === s.id ? 'bg-emerald-500/30 text-emerald-400' : 'text-theme-text-muted hover:text-theme-text-primary'}`}
                            >
                              <div className="flex flex-col">
                                <span>{s.name}</span>
                                <span className="text-[10px] opacity-50 font-medium">Dự kiến: {formatCurrency(s.expectedAmount || 0)}đ</span>
                              </div>
                              {sourceId === s.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </button>
                          ))
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest ml-1">Số tiền thực nhận (đ)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => handleAmountChange(e, setAmount)}
                  className="w-full pl-5 pr-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-2xl font-black text-theme-text-primary outline-none focus:border-emerald-500/30 transition-all placeholder:text-white/10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-theme-text-muted">đ</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest ml-1">Ngày nhận</label>
              <input 
                type="date" 
                className="glass-input w-full py-3 px-4 font-bold text-sm" 
                value={date} 
                max={todayStr}
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-widest">
              Xác nhận nhận tiền
            </button>
          </form>
        </motion.div>

        <motion.div variants={itemVars} className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-theme-text-primary">
                Nguồn tiền của bạn
              </h3>
              <button
                onClick={() => { resetSourceForm(); setShowAddSourceModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-[10px] font-bold transition-all"
              >
                <Plus className="w-3 h-3" />
                Thêm nguồn
              </button>
            </div>
            <div className="space-y-2 mb-8">
              {sources.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-emerald-500/20 transition-all">
                  <div>
                    <p className="text-xs font-bold text-theme-text-primary">{s.name}</p>
                    <p className="text-[9px] text-theme-text-muted">
                      {s.type === 'fixed' ? 'Cố định' : s.type === 'variable' ? 'Linh hoạt' : 'Theo lịch'} • {formatCurrency(s.expectedAmount || 0)}đ
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEditSource(s)} className="p-1.5 hover:bg-white/10 rounded-lg text-theme-text-muted hover:text-emerald-400"><Edit3 className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteSource(s.id)} className="p-1.5 hover:bg-rose-500/15 rounded-lg text-theme-text-muted hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-base font-black text-theme-text-primary mb-4">
              Lịch sử Giao dịch
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {records.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-theme-text-muted text-xs font-medium">Chưa có lịch sử thu nhập</p>
                </div>
              )}
              {records.map((record) => (
                <motion.div
                  layout
                  key={record.id}
                  className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-theme-text-primary">
                        {sources.find((s) => s.id === record.sourceId)?.name || "Thu nhập"}
                      </p>
                      <p className="text-[9px] font-bold text-theme-text-muted">{getLocalDateStr(record.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-emerald-400">
                      +{formatCurrency(record.amount)}<span className="text-[10px] font-normal ml-0.5 uppercase">đ</span>
                    </span>
                    <button 
                      onClick={() => handleDeleteRecord(record)}
                      className="p-1.5 hover:bg-rose-500/20 rounded-lg text-theme-text-muted hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAddSourceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel w-full max-w-lg p-8 rounded-3xl relative"
            >
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="absolute right-6 top-6 p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-theme-text-muted" />
              </button>
              <h2 className="text-2xl font-bold text-theme-text-primary mb-6">{editingSource ? 'Sửa Nguồn Thu' : 'Đăng ký Nguồn Thu'}</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  className="glass-input w-full"
                  placeholder="Tên nguồn tiền (VD: Lương chính, Freelance...)"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "fixed", label: "Cố định" },
                    { id: "variable", label: "Linh hoạt" },
                    { id: "scheduled", label: "Theo lịch" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setNewSourceType(t.id as IncomeType)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${newSourceType === t.id ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-inner shadow-emerald-500/10" : "bg-white/5 border-white/10 text-theme-text-muted hover:bg-white/10"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl">
                  <p className="text-[10px] text-emerald-400 font-medium leading-relaxed">
                    {newSourceType === 'fixed' && "• Dùng cho lương cố định, tiền nhà... thu nhập đều đặn mỗi tháng."}
                    {newSourceType === 'variable' && "• Dùng cho thưởng, freelance, bán hàng... thu nhập không cố định."}
                    {newSourceType === 'scheduled' && "• Dùng cho công việc làm thêm tính theo giờ hoặc theo ca."}
                  </p>
                </div>

                {newSourceType === "fixed" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-theme-text-muted ml-1 uppercase">Số tiền nhận mỗi tháng</label>
                    <input
                      type="text"
                      className="glass-input w-full"
                      placeholder="VD: 10.000.000"
                      value={newSourceAmount}
                      onChange={(e) => handleAmountChange(e, setNewSourceAmount)}
                      onBlur={() => { if (newSourceAmount) setNewSourceAmount(formatCurrency(parseFormattedNumber(newSourceAmount))); }}
                    />
                  </div>
                )}

                {newSourceType === "scheduled" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-theme-text-muted ml-1 uppercase">Mức lương mỗi giờ</label>
                    <input
                      type="text"
                      className="glass-input w-full"
                      placeholder="VD: 50.000"
                      value={newSourceRate}
                      onChange={(e) => handleAmountChange(e, setNewSourceRate)}
                      onBlur={() => { if (newSourceRate) setNewSourceRate(formatCurrency(parseFormattedNumber(newSourceRate))); }}
                    />
                  </div>
                )}
                <button
                  onClick={handleSaveSource}
                  className="btn-primary w-full mt-6"
                >
                  Lưu nguồn thu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- Custom Confirmation Modal --- */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="glass-panel w-full max-w-sm p-8 rounded-[32px] relative z-10 border border-white/10 shadow-2xl overflow-hidden"
              style={{ background: 'rgba(15, 23, 42, 0.85)' }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0" />
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-2">
                  <Trash2 className="w-8 h-8 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-theme-text-primary mb-2">Xác nhận xóa?</h3>
                  <p className="text-sm text-theme-text-muted leading-relaxed">
                    Bạn có chắc chắn muốn xóa <span className="text-rose-400 font-bold">{confirmDelete.type === 'source' ? 'nguồn thu' : 'khoản thu'}</span> <span className="text-rose-400 font-bold">"{confirmDelete.title}"</span>?
                  </p>
                  {confirmDelete.type === 'source' && (
                    <p className="mt-4 p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-theme-text-muted italic">
                      * Lưu ý: Lịch sử tiền mặt đã nhận từ nguồn này vẫn sẽ được giữ lại để đảm bảo số dư ngân sách của bạn không bị sai lệch.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 w-full mt-6">
                  <button onClick={() => setConfirmDelete(null)} className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-theme-text-muted font-bold text-sm hover:bg-white/10 transition-all">Hủy bỏ</button>
                  <button onClick={() => executeDelete()} className="px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 transition-all">Xác nhận xóa</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.div
        variants={itemVars}
        className="glass-panel p-6 rounded-[24px] border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />
        <h3 className="text-base font-black text-theme-text-primary mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          Giải thích thuật ngữ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-emerald-400 font-black text-[9px] uppercase tracking-widest">Thu nhập dự tính là gì?</h4>
            <p className="text-[11px] text-theme-text-muted leading-relaxed">
              Đây là số tiền <b>bạn mong đợi</b> nhận được (Ví dụ: Lương cố định 10tr). Nó giúp bạn lập kế hoạch chi tiêu trước khi có tiền mặt.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sky-400 font-black text-[9px] uppercase tracking-widest">Tiền mặt thực tế là gì?</h4>
            <p className="text-[11px] text-theme-text-muted leading-relaxed">
              Đây là số tiền <b>thực sự đã vào túi</b> bạn. Khi nhận tiền, bạn hãy "Ghi nhận" để số dư ngân sách được cập nhật chính xác.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
