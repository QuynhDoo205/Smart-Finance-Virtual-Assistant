import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Trash2, CheckCircle2, AlertCircle, Info, Settings, Wallet, Banknote, Edit3, TrendingUp, ChevronDown, HelpCircle, Gift, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { dashboardApi, incomeApi, transactionsApi, userApi } from "../../utils/api";
import { calculateMonthlyForecast } from "../../utils/salaryCalculator";
import { numberToVietnameseWords } from "../../utils/numberToWords";

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
  category?: SourceCategory;
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
  const [sourceId, setSourceId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedRecordCategory, setSelectedRecordCategory] = useState<SourceCategory>("salary");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string; type: 'record' | 'source' } | null>(null);

  const todayStr = getLocalDateStr();
  const [globalFilter, setGlobalFilter] = useState<'all' | SourceCategory>('all');

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
  const [historyFilter, setHistoryFilter] = useState<"all" | SourceCategory>("all");
  const [wordsPreview, setWordsPreview] = useState("");
  const [modalWordsPreview, setModalWordsPreview] = useState("");

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
  const [showLogicInfo, setShowLogicInfo] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);

  // Load data from Backend
  useEffect(() => {
    const loadData = async () => {
      try {
        const [srcRes, transRes] = await Promise.all([
          incomeApi.getSources(),
          transactionsApi.list(50),
        ]);

        let mappedSources: IncomeSource[] = [];
        if (srcRes.success) {
          mappedSources = srcRes.data.sources.map(
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
            .map((t: any) => {
              // Tìm sourceId từ note hoặc title nếu có (format: "Thu nhập từ [Tên Nguồn]")
              const note = t.ghi_chu || t.note || "";
              const matchedSource = mappedSources.find(s => note.includes(s.name) || (t.tieu_de || t.title || "").includes(s.name));
              
              // Xác định loại dựa trên note [salary], [allowance], [other]...
              let type: SourceCategory | undefined = undefined;
              if (note.includes('[salary]')) type = 'salary';
              else if (note.includes('[allowance]')) type = 'allowance';
              else if (note.includes('[other]')) type = 'other';
              
              // Nếu không có tag cụ thể, lấy loại của nguồn tiền tương ứng
              if (!type && matchedSource) {
                type = matchedSource.sourceType;
              }

              return {
                id: t.id.toString(),
                sourceId: matchedSource ? matchedSource.id : "other",
                amount: parseFloat(t.so_tien || t.amount),
                date: t.ngay_giao_dich || t.transaction_date,
                category: type || 'other'
              };
            })
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
    if (setter === setAmount) {
      setWordsPreview(rawValue ? numberToVietnameseWords(parseInt(rawValue)) : "");
    } else if (setter === setNewSourceAmount || setter === setNewSourceRate) {
      setModalWordsPreview(rawValue ? numberToVietnameseWords(parseInt(rawValue)) : "");
    }
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
        categoryId: selectedRecordCategory === 'salary' ? 1 : selectedRecordCategory === 'allowance' ? 2 : 3,
        date: date,
        note: `Thu nhập [${selectedRecordCategory}] từ ${source?.name}`,
      });

      if (res.success) {
        setRecords((prev) => [
          {
            id: res.data.transaction.id.toString(),
            sourceId,
            amount: numericAmount,
            date,
            category: selectedRecordCategory,
          },
          ...prev,
        ]);
        setAmount("");
        setNotification({ 
          type: 'success', 
          message: `Đã cộng ${formatCurrency(numericAmount)}đ vào ngân sách tháng này! ✓` 
        });
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
          const deletedSource = sources.find(s => s.id === id);
          const updatedSources = sources.filter((s) => s.id !== id);
          setSources(updatedSources);
          
          // --- SYNC ON DELETE ---
          if (deletedSource?.type === 'fixed') {
            try {
              const [profileRes, budgetRes] = await Promise.all([
                userApi.getProfile(),
                dashboardApi.getBudget()
              ]);

              const totalFixedIncome = updatedSources
                .filter(x => x.type === 'fixed')
                .reduce((sum, x) => sum + (x.expectedAmount || 0), 0);

              const existingBudgets = budgetRes.success 
                ? budgetRes.data.budgets.map((b: any) => ({ categoryName: b.category_name, amount: b.limit_amount }))
                : [];
              
              // Remove the budget that matches the deleted source name
              const remainingBudgets = existingBudgets.filter((b: any) => b.categoryName !== deletedSource.name);
              
              await userApi.updateOnboarding(totalFixedIncome, remainingBudgets);
            } catch (syncErr) {
              console.warn('Sync after delete failed:', syncErr);
            }
          }

          setNotification({ type: 'success', message: 'Đã gỡ bỏ nguồn thu này và cập nhật Hồ sơ ✓' });
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
          : undefined,
      hourlyRate:
        newSourceType === "scheduled"
          ? parseFormattedNumber(newSourceRate)
          : undefined,
      schedule: newSourceType === "scheduled" ? newWorkSchedule : undefined,
    };

    try {
      let res;
      if (editingSource) {
        res = await incomeApi.updateSource(parseInt(editingSource.id), sourceData);
      } else {
        res = await incomeApi.createSource(sourceData);
      }

      if (res.success) {
        const s = res.data.source;
        const savedSource: IncomeSource = {
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

        // Update local state
        const updatedSources = editingSource
          ? sources.map(src => src.id === savedSource.id ? savedSource : src)
          : [...sources, savedSource];
        
        setSources(updatedSources);

        // --- SMART SYNC LOGIC ---
        // Requirement: Sync fixed income sources -> Profile (Monthly Income ONLY)
        // We DO NOT sync this as a budget/expense anymore because income is NOT an expense.
        if (newSourceType === 'fixed' && sourceData.expectedAmount) {
          try {
            // 1. Fetch current status to avoid overwriting unrelated data
            const [profileRes, budgetRes] = await Promise.all([
              userApi.getProfile(),
              dashboardApi.getBudget()
            ]);

            // 2. Calculate new Total Monthly Income (sum of all FIXED sources)
            const totalFixedIncome = updatedSources
              .filter(x => x.type === 'fixed')
              .reduce((sum, x) => sum + (x.expectedAmount || 0), 0);

            // 3. Keep existing budgets exactly as they are
            const existingBudgets = budgetRes.success 
              ? budgetRes.data.budgets.map((b: any) => ({ categoryName: b.category_name, amount: b.limit_amount }))
              : [];

            // 4. Update Onboarding (this updates monthly_income without touching fixed expenses)
            await userApi.updateOnboarding(totalFixedIncome, existingBudgets);

          } catch (syncErr) {
            console.warn('Sync to fixed expenses/profile failed:', syncErr);
          }
        }

        setNotification({ 
          type: 'success', 
          message: `${editingSource ? 'Đã cập nhật' : 'Đã lưu'} nguồn thu: ${newSourceName}${newSourceType === 'fixed' ? ' và đồng bộ vào Hồ sơ ✓' : ''}` 
        });
        setShowAddSourceModal(false);
        resetSourceForm();
      }
    } catch (err) {
      console.error("Save source failed:", err);
      setNotification({ type: 'error', message: 'Lỗi khi lưu nguồn thu' });
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



  // --- Breakdown by category (Actual money received this month) ---
  const incomeBreakdown = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthRecords = records.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    let salary = 0;
    let allowance = 0;
    let other = 0;

    currentMonthRecords.forEach(r => {
      // Ưu tiên lấy category trực tiếp từ record (đã được lưu trong note)
      if (r.category === 'salary') salary += r.amount;
      else if (r.category === 'allowance') allowance += r.amount;
      else {
        // Nếu không có category cụ thể, thử khớp qua Source
        const source = sources.find(s => s.id === r.sourceId);
        if (source) {
          if (source.sourceType === 'salary') salary += r.amount;
          else if (source.sourceType === 'allowance') allowance += r.amount;
          else other += r.amount;
        } else {
          other += r.amount;
        }
      }
    });

    return { salary, allowance, other };
  }, [records, sources]);

  const QUICK_ADD = [
    { label: '+Thưởng (1M)', amount: 1000000 },
    { label: '+Phụ cấp (500k)', amount: 500000 },
    { label: '+Bán đồ', amount: 0 },
  ];

  return (
    <>
    <motion.div
      variants={containerVars}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
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
        <button 
          onClick={() => setShowLogicInfo(!showLogicInfo)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] text-theme-text-muted hover:text-theme-text-primary transition-all text-sm font-bold"
        >
          <HelpCircle className="w-4 h-4" /> Hướng dẫn & Logic
        </button>
      </motion.div>

      <AnimatePresence>
        {showLogicInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel p-6 rounded-[24px] border-emerald-500/20 bg-emerald-500/5 mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Cố định (Fixed)
                  </h4>
                  <p className="text-[11px] text-theme-text-muted leading-relaxed">
                    Dùng cho Lương, Học bổng... Nhận đều đặn mỗi tháng. Loại này sẽ <b>tự động tạo 1 khoản "Chi phí cố định"</b> trong Hồ sơ để hệ thống cân đối ngân sách cho bạn.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sky-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Theo lịch (Scheduled)
                  </h4>
                  <p className="text-[11px] text-theme-text-muted leading-relaxed">
                    Dùng cho việc làm thêm tính giờ. Bạn nhập lịch làm, hệ thống <b>tự động tính toán Dự báo (Forecast)</b> thu nhập dựa trên số giờ làm dự kiến trong tháng.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-purple-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Biến đổi (Variable)
                  </h4>
                  <p className="text-[11px] text-theme-text-muted leading-relaxed">
                    Dùng cho Thưởng, Hoa hồng, Quà tặng... Không có định mức. Bạn chỉ cần <b>Ghi nhận thực tế</b> khi tiền thực sự về tài khoản.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-[var(--theme-subtle-border)] flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">✓ Tự động đồng bộ</div>
                <p className="text-[10px] text-theme-text-muted italic">Mọi thay đổi ở Nguồn thu "Cố định" sẽ được cập nhật ngay lập tức sang tab "Chi phí Cố định" ở trang Hồ sơ & Dashboard.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="h-1 flex-1 bg-[var(--theme-subtle-bg)] rounded-full overflow-hidden">
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
                Thực thu (Đã nhận)
              </h3>
              <div className="text-2xl font-black text-sky-400 tracking-tight">
                {formatCurrency(actualIncomeThisMonth)} <span className="text-sm text-theme-text-muted font-normal uppercase">vnđ</span>
              </div>
            </div>
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
              <Wallet className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div className="mt-3 h-1 bg-[var(--theme-subtle-bg)] rounded-full overflow-hidden">
            <div className="h-full bg-sky-400" style={{ width: `${Math.min((actualIncomeThisMonth / (totalForecasted || 1)) * 100, 100)}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-theme-text-muted italic">{Math.round((actualIncomeThisMonth / (totalForecasted || 1)) * 100)}% dự báo</p>
        </motion.div>

        {/* 3rd card: Phân loại Luồng tiền */}
        <motion.div
          variants={itemVars}
          className="glass-panel p-6 rounded-[24px] relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-12 -mt-12" />
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-theme-text-muted font-bold text-[10px] uppercase tracking-widest">Phân loại Luồng tiền</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Lương', amount: incomeBreakdown.salary, color: 'bg-emerald-400' },
              { label: 'Trợ cấp', amount: incomeBreakdown.allowance, color: 'bg-yellow-400' },
              { label: 'Khác (thực tế)', amount: incomeBreakdown.other, color: 'bg-purple-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-xs text-theme-text-muted">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-theme-text-primary">{formatCurrency(item.amount)}đ</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* --- Global Filter Tabs (Universal Filter) --- */}
      <motion.div variants={itemVars} className="flex justify-start my-8">
        <div className="flex  p-1.5 rounded-[1.5rem] border border-[var(--theme-subtle-border)] backdrop-blur-xl shadow-2xl">
          <button 
            onClick={() => setGlobalFilter('all')} 
            className={`px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${globalFilter === 'all' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105' : 'text-theme-text-muted hover:text-white'}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setGlobalFilter('salary')} 
            className={`px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${globalFilter === 'salary' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105' : 'text-theme-text-muted hover:text-white'}`}
          >
            Lương / Job
          </button>
          <button 
            onClick={() => setGlobalFilter('allowance')} 
            className={`px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${globalFilter === 'allowance' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105' : 'text-theme-text-muted hover:text-white'}`}
          >
            Trợ cấp
          </button>
          <button 
            onClick={() => setGlobalFilter('other')} 
            className={`px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${globalFilter === 'other' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105' : 'text-theme-text-muted hover:text-white'}`}
          >
            Khác
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          variants={itemVars}
          className="glass-panel p-6 rounded-[32px] shadow-xl relative border border-[var(--theme-subtle-border)]"
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
                        {sources.filter(s => globalFilter === 'all' || s.sourceType === globalFilter).length === 0 ? (
                          <div className="px-4 py-3 text-xs text-theme-text-muted italic">Chưa có nguồn tiền nào cho mục này</div>
                        ) : (
                          sources.filter(s => globalFilter === 'all' || s.sourceType === globalFilter).map((s) => (
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

            <div className="space-y-2">
              <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest ml-1">Phân loại khoản thu này</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'salary', label: 'Lương', icon: '💼' },
                  { id: 'allowance', label: 'Trợ cấp', icon: '🎁' },
                  { id: 'other', label: 'Thưởng/Tips/Khác', icon: '✨' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedRecordCategory(cat.id as SourceCategory)}
                    className={`py-2 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${selectedRecordCategory === cat.id ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-[var(--theme-subtle-bg)] border-[var(--theme-subtle-border)] text-theme-text-muted hover:bg-[var(--theme-bg-surface)]'}`}
                  >
                    <span className="text-sm">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
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
                  className="w-full pl-5 pr-10 py-4 bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] rounded-2xl text-2xl font-black text-theme-text-primary outline-none focus:border-emerald-500/30 transition-all placeholder:text-white/10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-theme-text-muted">đ</span>
              </div>
              {wordsPreview && (
                <p className="text-[10px] text-emerald-400/80 font-bold italic ml-2 mt-1.5">
                  {wordsPreview}
                </p>
              )}
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
              Cộng vào Ngân sách Tháng
            </button>

            {/* Quick Add */}
            <div className="pt-2">
              <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest mb-2">✦ Thu nhập phụ (thêm nhanh)</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ADD.map(q => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => {
                      if (q.amount > 0) setAmount(q.amount.toString());
                    }}
                    className="px-3 py-1.5 text-[10px] font-bold rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
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
              {sources.filter(s => globalFilter === 'all' || s.sourceType === globalFilter).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] group hover:border-emerald-500/20 transition-all">
                  <div>
                    <p className="text-xs font-bold text-theme-text-primary">{s.name}</p>
                    <p className="text-[9px] text-theme-text-muted">
                      {s.sourceType === 'salary' ? '💼 Lương / Job' : s.sourceType === 'allowance' ? '🎁 Trợ cấp' : '✨ Khác'} • {s.type === 'fixed' ? 'Cố định' : s.type === 'variable' ? 'Linh hoạt' : 'Theo lịch'} • {formatCurrency(s.expectedAmount || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEditSource(s)} className="p-1.5 hover:bg-[var(--theme-bg-surface)] rounded-lg text-theme-text-muted hover:text-emerald-400"><Edit3 className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteSource(s.id)} className="p-1.5 hover:bg-rose-500/15 rounded-lg text-theme-text-muted hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-theme-text-primary">
                Lịch sử Giao dịch
              </h3>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {records.filter(r => {
                if (globalFilter === 'all') return true;
                const src = sources.find(s => s.id === r.sourceId);
                return src?.sourceType === globalFilter;
              }).length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-theme-text-muted text-xs font-medium">Chưa có lịch sử thu nhập cho mục này</p>
                </div>
              )}
              {records
                .filter(r => {
                  if (globalFilter === 'all') return true;
                  const src = sources.find(s => s.id === r.sourceId);
                  return src?.sourceType === globalFilter;
                })
                .map((record) => (
                <motion.div
                  layout
                  key={record.id}
                  className="flex justify-between items-center p-3 rounded-2xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] hover:border-emerald-500/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                      (record.category || sources.find(s => s.id === record.sourceId)?.sourceType) === 'salary' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      (record.category || sources.find(s => s.id === record.sourceId)?.sourceType) === 'allowance' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                      'bg-purple-500/10 border-purple-500/20 text-purple-400'
                    }`}>
                      {(record.category || sources.find(s => s.id === record.sourceId)?.sourceType) === 'salary' ? <Banknote className="w-4 h-4" /> :
                       (record.category || sources.find(s => s.id === record.sourceId)?.sourceType) === 'allowance' ? <Gift className="w-4 h-4" /> :
                       <Sparkles className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-theme-text-primary">
                        {sources.find((s) => s.id === record.sourceId)?.name || "Thu nhập"}
                      </p>
                      <p className="text-[9px] font-bold text-theme-text-muted">
                        {record.category === 'salary' || (!record.category && sources.find(s => s.id === record.sourceId)?.sourceType === 'salary') ? '💼 Lương' : 
                         record.category === 'allowance' || (!record.category && sources.find(s => s.id === record.sourceId)?.sourceType === 'allowance') ? '🎁 Trợ cấp' : '✨ Khác'} • {getLocalDateStr(record.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-emerald-400">
                      +{formatCurrency(record.amount)}
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

      <motion.div
        variants={itemVars}
        className="glass-panel p-6 rounded-[24px] border border-[var(--theme-subtle-border)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />
        <h3 className="text-base font-black text-theme-text-primary mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          Giải thích thuật ngữ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h4 className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider">Thu nhập dự tính là gì?</h4>
            <p className="text-xs text-theme-text-muted leading-relaxed">
              Đây là số tiền bạn <b>kỳ vọng</b> nhận được (VD: Lương cố định 15Tr). Nó giúp bạn lập kế hoạch chi tiêu trước khi có tiền mặt.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sky-400 font-bold text-[10px] uppercase tracking-wider">Tiền mặt thực tế là gì?</h4>
            <p className="text-xs text-theme-text-muted leading-relaxed">
              Đây là số tiền <b>thực sự đã vào túi</b> bạn. Khi nhận tiền, bạn hãy "Ghi nhận" để số dư ngân sách được cập nhật chính xác.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2 pt-2 border-t border-white/5">
            <h4 className="text-purple-400 font-bold text-[10px] uppercase tracking-wider">Tại sao Thực thu có thể cao hơn Dự tính?</h4>
            <p className="text-xs text-theme-text-muted leading-relaxed">
              Khi thực thu (70Tr) cao hơn dự tính (15Tr), phần <b>vượt mức (55Tr)</b> thường đến từ các khoản phát sinh như: Thưởng đột xuất, Bán đồ cũ, hoặc các khoản Trợ cấp không nằm trong kế hoạch. Hệ thống sẽ tự động đưa các khoản này vào mục <b>"Khác (thực tế)"</b> để đảm bảo dòng tiền của bạn luôn khớp với thực tế 100%.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>

    {/* --- Modals (Moved outside main container to fix 'fixed' positioning scroll bug) --- */}
    <AnimatePresence>
      {showAddSourceModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
          onClick={() => setShowAddSourceModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-panel w-full max-w-lg p-6 rounded-3xl relative max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddSourceModal(false)}
              className="absolute right-6 top-6 p-2 hover:bg-[var(--theme-subtle-bg)] rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-theme-text-muted" />
            </button>
            <h2 className="text-xl font-bold text-theme-text-primary mb-5 shrink-0 px-1">{editingSource ? 'Sửa Nguồn Thu' : 'Đăng ký Nguồn Thu'}</h2>
            
            <div className="space-y-5 overflow-y-auto px-1 custom-scrollbar flex-1 pb-4 -mx-1">
              <div>
                <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest block mb-1.5">Tên nguồn tiền (VD: Tiền làm bếp)</label>
                <input
                  type="text"
                  className={`glass-input w-full px-4 py-2.5 text-sm transition-all ${!newSourceName.trim() ? 'border-rose-500/30' : ''}`}
                  placeholder="Tên công ty hoặc job"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                />
                {!newSourceName.trim() && <p className="text-[9px] text-rose-400 mt-1 ml-1">* Bắt buộc nhập tên</p>}
              </div>

            {/* Source Category */}
            <div>
              <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-1.5 ml-1">Phân loại Dòng tiền</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'salary', label: 'Lương / Đi làm' },
                  { id: 'allowance', label: 'Trợ cấp' },
                  { id: 'other', label: 'Linh tính' },
                ].map(c => (
                  <button key={c.id} type="button" onClick={() => setNewSourceCategory(c.id as SourceCategory)}
                    className={`px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${newSourceCategory === c.id ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-[var(--theme-subtle-bg)] border-[var(--theme-subtle-border)] text-theme-text-muted hover:bg-[var(--theme-bg-surface)]'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Income Type */}
            <div>
              <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-1.5 ml-1">Tần suất làm việc</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "fixed", label: "Cố định" },
                  { id: "variable", label: "Biến đổi" },
                  { id: "scheduled", label: "Theo lịch (Job)" },
                ].map((t) => (
                  <button key={t.id} type="button"
                    onClick={() => setNewSourceType(t.id as IncomeType)}
                    className={`px-2 py-2 rounded-xl text-[11px] font-bold border transition-all ${newSourceType === t.id ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-[var(--theme-subtle-bg)] border-[var(--theme-subtle-border)] text-theme-text-muted hover:bg-[var(--theme-bg-surface)]"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl">
                <p className="text-[10px] text-emerald-400 font-medium leading-relaxed">
                  {newSourceType === 'fixed' && "💼 Cố định: Lương tháng, học bổng... — nhận đều đặn, không đổi. Tự động cộng vào Tổng thu nhập hàng tháng."}
                  {newSourceType === 'variable' && "📈 Biến đổi: Thưởng, hoa hồng... — số tiền thay đổi. Ghi nhận khi thực sự nhận được tiền."}
                  {newSourceType === 'scheduled' && "🕐 Theo lịch: Làm tính giờ — chọn lịch làm, hệ thống tự tính lương dự kiến."}
                </p>
              </div>
            </div>

              {/* FIXED */}
              {newSourceType === "fixed" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-theme-text-muted ml-1 uppercase">Số tiền cố định nhận mỗi tháng (VNĐ)</label>
                  <input type="text" className="glass-input w-full px-4 py-2.5 text-sm"
                    placeholder="VD: 10.000.000" value={newSourceAmount}
                    onChange={(e) => handleAmountChange(e, setNewSourceAmount)}
                    onBlur={() => { if (newSourceAmount) setNewSourceAmount(formatCurrency(parseFormattedNumber(newSourceAmount))); }}
                  />
                  {newSourceType === 'fixed' && modalWordsPreview && (
                    <p className="text-[10px] text-emerald-400/80 font-bold italic ml-2 mt-1">
                      {modalWordsPreview}
                    </p>
                  )}
                  <p className="text-[9px] text-emerald-400/70 ml-1 mt-1">💡 Sẽ tự động tính vào "Tổng thu nhập" trong hồ sơ.</p>
                </div>
              )}

              {/* VARIABLE */}
              {newSourceType === "variable" && (
                <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/15">
                  <p className="text-[10px] text-sky-400 leading-relaxed">
                    ℹ️ Với loại <strong>Biến đổi</strong>, không cần nhập số tiền trước. Khi có tiền, dùng form <strong className="text-emerald-400">"Ghi nhận Thu nhập"</strong> bên trái để cộng vào ngân sách.
                  </p>
                </div>
              )}

              {/* SCHEDULED */}
              {newSourceType === "scheduled" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-2">1. Chọn các ngày đi làm trong tuần</p>
                    <div className="flex flex-wrap gap-2">
                      {['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','CN'].map((day, idx) => {
                        const isSelected = (newWorkSchedule[idx] ?? 0) > 0;
                        return (
                          <button key={day} type="button"
                            onClick={() => {
                              const u = [...newWorkSchedule];
                              u[idx] = isSelected ? 0 : 4;
                              setNewWorkSchedule(u);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isSelected ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-[var(--theme-subtle-bg)] border-[var(--theme-subtle-border)] text-theme-text-muted hover:bg-[var(--theme-bg-surface)]'}`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {newWorkSchedule.some(h => h > 0) && (
                    <div>
                      <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-2">2. Số giờ làm mỗi ca</p>
                      <div className="space-y-2">
                        {['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','CN'].map((day, idx) => {
                          if ((newWorkSchedule[idx] ?? 0) === 0) return null;
                          return (
                            <div key={day} className="flex items-center gap-3">
                              <span className="text-xs text-theme-text-muted w-14">{day}</span>
                              <input type="number" min="0.5" max="24" step="0.5"
                                value={newWorkSchedule[idx]}
                                onChange={(e) => {
                                  const u = [...newWorkSchedule];
                                  u[idx] = parseFloat(e.target.value) || 0;
                                  setNewWorkSchedule(u);
                                }}
                                className="glass-input w-24 py-2 text-center text-sm font-bold"
                              />
                              <span className="text-xs text-theme-text-muted">giờ</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-2">3. Mức lương / giờ (VNĐ)</p>
                    <input type="text" className="glass-input w-full px-4 py-2.5 text-sm"
                      placeholder="VD: 50.000" value={newSourceRate}
                      onChange={(e) => handleAmountChange(e, setNewSourceRate)}
                      onBlur={() => { if (newSourceRate) setNewSourceRate(formatCurrency(parseFormattedNumber(newSourceRate))); }}
                    />
                    {newSourceType === 'scheduled' && modalWordsPreview && (
                      <p className="text-[10px] text-emerald-400/80 font-bold italic ml-2 mt-1">
                        {modalWordsPreview}
                      </p>
                    )}
                  </div>

                  {newSourceRate && newWorkSchedule.some(h => h > 0) && (() => {
                    const totalHours = newWorkSchedule.reduce((sum, h, idx) => sum + h * (idx < 5 ? 4.33 : 4), 0);
                    const forecast = Math.round(totalHours * parseFormattedNumber(newSourceRate));
                    return (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-[10px] text-emerald-300">📊 Hệ thống đếm được tổng <strong>{totalHours.toFixed(1)} giờ</strong> làm việc trong tháng này.</p>
                        <p className="text-sm font-black text-emerald-400 mt-1">Dự báo lương sẽ nhận: <span className="text-base">{formatCurrency(forecast)}đ</span></p>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
            
            <div className="pt-4 shrink-0 border-t border-[var(--theme-subtle-border)] mt-auto">
              <button 
                onClick={handleSaveSource} 
                disabled={!newSourceName.trim() || (newSourceType === 'scheduled' && !newWorkSchedule.some(h => h > 0))}
                className={`w-full py-3 rounded-2xl font-bold transition-all duration-300 ${
                  (!newSourceName.trim() || (newSourceType === 'scheduled' && !newWorkSchedule.some(h => h > 0)))
                    ? 'bg-[var(--theme-subtle-bg)] text-theme-text-muted cursor-not-allowed border border-[var(--theme-subtle-border)]' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95'
                }`}
              >
                {!newSourceName.trim() 
                  ? 'Vui lòng nhập tên nguồn tiền' 
                  : (newSourceType === 'scheduled' && !newWorkSchedule.some(h => h > 0))
                    ? 'Vui lòng chọn lịch làm việc'
                    : 'Xác nhận Nguồn Thu'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

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
            className="glass-panel w-full max-w-sm p-8 rounded-[32px] relative z-10 border border-[var(--theme-subtle-border)] shadow-2xl overflow-hidden"
            style={{ background: 'rgba(15, 23, 42, 0.85)' }}
            onClick={(e) => e.stopPropagation()}
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
                  <p className="mt-4 p-3 bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] rounded-xl text-[10px] text-theme-text-muted italic">
                    * Lưu ý: Lịch sử tiền mặt đã nhận từ nguồn này vẫn sẽ được giữ lại để đảm bảo số dư ngân sách của bạn không bị sai lệch.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 w-full mt-6">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-3 rounded-2xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] text-theme-text-muted font-bold text-sm hover:bg-[var(--theme-bg-surface)] transition-all">Hủy bỏ</button>
                <button onClick={() => executeDelete()} className="px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 transition-all">Xác nhận xóa</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
