import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle,
  ChevronRight,
  DollarSign,
  FileText,
  Loader2,
  MessageSquare,
  PenLine,
  Receipt,
  Scan,
  Search,
  Send,
  Sparkles,
  Upload,
  X,
  Trash2,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { aiApi, transactionsApi } from "../../utils/api";
import { numberToVietnameseWords } from "../../utils/numberToWords";
import {
  CATEGORY_INFO,
  type ExpenseCategory,
  type ParsedExpense,
} from "../../utils/mockAiServices";

const CATEGORY_MAP: Record<ExpenseCategory, number> = {
  food: 4,
  transport: 5,
  shopping: 6,
  entertainment: 7,
  health: 8,
  education: 9,
  other: 13,
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ExpenseItem {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  store?: string;
  source: "scanner" | "chat" | "manual";
  type: "income" | "expense";
}

type ChatMsg = { role: "user" | "bot" | "typing"; text: string };
type Tab = "scanner" | "chat" | "manual";

// ─── Laser Scan Overlay ────────────────────────────────────────────────────────
function LaserBeam() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-10">
      {/* Corner brackets */}
      {[
        "top-3 left-3 border-t-2 border-l-2",
        "top-3 right-3 border-t-2 border-r-2",
        "bottom-3 left-3 border-b-2 border-l-2",
        "bottom-3 right-3 border-b-2 border-r-2",
      ].map((cls, i) => (
        <div key={i} className={`absolute w-5 h-5 border-cyan-400 ${cls}`} />
      ))}

      {/* Laser line */}
      <motion.div
        className="absolute inset-x-0"
        style={{ height: 3 }}
        animate={{ top: ["2%", "96%", "2%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          style={{
            boxShadow:
              "0 0 28px 10px rgba(34,211,238,0.75), 0 0 55px 18px rgba(34,211,238,0.3)",
            filter: "blur(0.4px)",
          }}
        />
      </motion.div>

      {/* Pulsing border rings */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-xl border border-cyan-400/20"
          animate={{ opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.9 }}
        />
      ))}
    </div>
  );
}

// ─── Neon Card Shell ───────────────────────────────────────────────────────────
function NeonCard({
  children,
  accentColor,
  className = "",
  style,
}: {
  children: React.ReactNode;
  accentColor: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[var(--theme-bg-panel)] backdrop-blur-2xl border border-[var(--theme-border)] ${className}`}
      style={{
        boxShadow: `0 0 50px -18px ${accentColor}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        ...style,
      }}
    >
      {/* Top neon accent line */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />
      {children}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ExpenseTracker() {
  const [activeTab, setActiveTab] = useState<Tab>("scanner");
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await transactionsApi.list(50);
        if (res.success) {
          const mapped: ExpenseItem[] = res.data.transactions.map((t: any) => ({
            id: t.id.toString(),
            amount: parseFloat(t.so_tien || t.amount) || 0,
            category: 
              (Object.keys(CATEGORY_MAP).find(
                (k) => CATEGORY_MAP[k as ExpenseCategory] === t.danh_muc_id,
              ) as ExpenseCategory) || "other",
            description: t.tieu_de || t.title || t.note || "Giao dịch",
            store: t.title || t.tieu_de,
            date: t.transaction_date || t.ngay_giao_dich,
            source: "manual" as const,
            type: (t.type === 'income' || t.loai_giao_dich === 'thu_nhap' ? 'income' : 'expense') as "income" | "expense",
          }))
          .sort((a, b) => {
            const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            return parseInt(b.id) - parseInt(a.id);
          });
          setExpenses(mapped);
        }
      } catch (err) {
        console.error("Failed to load transactions:", err);
      }
    };
    loadData();
  }, []);
  
  const todayStr = getLocalDateStr();
  const yesterdayStr = getLocalDateStr(new Date(Date.now() - 86400000));

  // Scanner state
  const [scanPhase, setScanPhase] = useState<"idle" | "scanning" | "done">(
    "idle",
  );
  const [scanText, setScanText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ParsedExpense | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "bot",
      text: 'Xin chào! Hãy kể tôi nghe bạn vừa chi gì 👋\nVD: "Ăn phở hết 40k" hay "Đổ xăng 80.000đ"',
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Manual state
  const [manualAmount, setManualAmount] = useState("");
  const [manualCat, setManualCat] = useState<ExpenseCategory>("food");
  const [manualDate, setManualDate] = useState(todayStr);
  const [manualNote, setManualNote] = useState("");
  const [wordsPreview, setWordsPreview] = useState("");
  const [manualSuccess, setManualSuccess] = useState(false);

  // --- Notification ---
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

  const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
  const parseFmt = (s: string) => Number(s.replace(/\D/g, ""));

  const handleFormattedAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
  ) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setter(rawValue);
    if (setter === setManualAmount) {
      setWordsPreview(rawValue ? numberToVietnameseWords(parseInt(rawValue)) : "");
    }
  };


  // Filtering & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] =
    useState<string>("all");

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      (exp.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (exp.store &&
        exp.store.toLowerCase().includes(searchQuery.toLowerCase()));
        
    let matchesCategory = false;
    if (selectedFilterCategory === 'all') {
      matchesCategory = true;
    } else if (selectedFilterCategory === 'expense') {
      matchesCategory = exp.type === 'expense';
    } else if (selectedFilterCategory === 'income') {
      matchesCategory = exp.type === 'income';
    } else {
      matchesCategory = exp.category === selectedFilterCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

  const groupExpensesByDate = (items: ExpenseItem[]) => {
    const groups: Record<string, ExpenseItem[]> = {};
    items.forEach((item) => {
      const date = item.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const getDateLabel = (dateStr: string) => {
    const target = getLocalDateStr(dateStr);
    if (target === todayStr) return "Hôm nay";
    if (target === yesterdayStr) return "Hôm qua";

    const [y, m, d] = target.split("-");
    return `${d}/${m}/${y}`;
  };

  const executeDelete = async (id: string) => {
    try {
      const res = await transactionsApi.delete(parseInt(id));
      if (res.success) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        setNotification({ type: "success", message: "Đã xóa giao dịch thành công!" });
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setNotification({ type: "error", message: "Không thể xóa giao dịch." });
    } finally {
      setConfirmDelete(null);
    }
  };

  // ── Scanner ──
  const SCAN_MSGS = [
    "Đang xử lý ảnh…",
    "Nhận dạng ký tự (OCR)…",
    "Phân tích dữ liệu…",
    "✓ Hoàn tất!",
  ];

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPreviewUrl(URL.createObjectURL(file));
    setScannedData(null);
    setScanPhase("scanning");
    let idx = 0;
    setScanText(SCAN_MSGS[0]);
    const iv = setInterval(() => {
      idx = Math.min(idx + 1, SCAN_MSGS.length - 1);
      setScanText(SCAN_MSGS[idx]);
    }, 650);
    try {
      const res = await aiApi.scan(file);
      if (res.success) {
        clearInterval(iv);
        setScanText(SCAN_MSGS[SCAN_MSGS.length - 1]);
        setScanPhase("done");
        setScannedData(res.data);
      }
    } catch (err: any) {
      clearInterval(iv);
      console.error("AI Scan failed:", err);
      const errorMsg =
        err.message ||
        "Không thể quét hóa đơn này. Vui lòng thử lại hoặc nhập thủ công.";
      setNotification({ type: "error", message: errorMsg });
      setScanPhase("idle");
    }
  };

  const resetScanner = () => {
    setScanPhase("idle");
    setPreviewUrl(null);
    setScannedData(null);
  };

  const confirmScan = async () => {
    if (!scannedData) return;
    try {
      const categoryId = CATEGORY_MAP[scannedData.category];
      const res = await transactionsApi.create({
        title: scannedData.store || scannedData.description,
        amount: scannedData.amount,
        type: "chi_phi",
        categoryId,
        date: scannedData.date,
        note: scannedData.description,
      });

      if (res.success) {
        setExpenses((prev: ExpenseItem[]) => [
          {
            id: res.data.transaction.id.toString(),
            amount: scannedData.amount,
            category: scannedData.category,
            description: scannedData.store || scannedData.description,
            date: scannedData.date || todayStr,
            source: "scanner" as const,
            type: "expense" as const,
          },
          ...prev,
        ]);
        resetScanner();
      }
    } catch (err) {
      console.error("Scan confirmation failed:", err);
      setNotification({
        type: "error",
        message: "Không thể lưu giao dịch từ hóa đơn.",
      });
    }
  };

  // ── Chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    setChatLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "typing", text: "" },
    ]);

    try {
      const aiRes = await aiApi.chat(text);
      setMessages((prev) => prev.filter((m) => m.role !== "typing"));

      if (aiRes.success) {
        // Luôn hiển thị câu trả lời từ AI
        setMessages((prev) => [...prev, { role: "bot", text: aiRes.reply }]);

        // Nếu AI bóc tách được dữ liệu chi tiêu
        if (aiRes.data) {
          const result = aiRes.data;
          const category = result.category || "other";
          const info = CATEGORY_INFO[category] || CATEGORY_INFO["other"];
          const categoryId = CATEGORY_MAP[category] || CATEGORY_MAP["other"];

          const res = await transactionsApi.create({
            title: result.description || "Giao dịch qua Chat",
            amount: result.amount || 0,
            type: "chi_phi",
            categoryId,
            date: result.date || getLocalDateStr(),
            note: "Ghi nhận qua chatbot",
          });

          if (res.success) {
            setMessages((prev) => [
              ...prev,
              {
                role: "bot",
                text: `✨ Hệ thống đã tự động ghi sổ:\n${info.emoji} ${info.label} — ${fmt(result.amount)}đ`,
              },
            ]);

            setExpenses((prev: ExpenseItem[]) => [
              {
                id: (res.data.transaction.id || Date.now()).toString(),
                amount: result.amount,
                category: category,
                description: result.description || info.label,
                date: result.date || getLocalDateStr(),
                source: "chat",
                type: "expense" as const,
              },
              ...prev,
            ]);
          }
        }
      }
    } catch (err) {
      console.error("Chat processing failed:", err);
      setMessages((prev) => {
        const hasBotReply = prev.some((m) => m.role === "bot" && m.text !== "");
        if (hasBotReply) return prev.filter((m) => m.role !== "typing");
        return [
          ...prev.filter((m) => m.role !== "typing"),
          {
            role: "bot",
            text: "Xin lỗi, tôi gặp sự cố khi kết nối tới Nova. Thử lại sau nhé!",
          },
        ];
      });
    } finally {
      setChatLoading(false);
    }
  };

  // ── Manual ──
  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFmt(manualAmount);
    if (!amount) return;

    try {
      const categoryId = CATEGORY_MAP[manualCat];
      const res = await transactionsApi.create({
        title: manualNote || CATEGORY_INFO[manualCat].label,
        amount,
        type: "chi_phi",
        categoryId,
        date: manualDate,
        note: manualNote,
      });

      if (res.success) {
        setNotification({
          type: "success",
          message: `Đã ghi nhận ${fmt(amount)}đ vào ${CATEGORY_INFO[manualCat].label}`,
        });
        setExpenses((prev: ExpenseItem[]) => [
          {
            id: res.data.transaction.id.toString(),
            amount,
            category: manualCat,
            description: manualNote,
            date: manualDate,
            source: "manual" as const,
            type: "expense" as const,
          },
          ...prev,
        ]);

        setManualAmount("");
        setManualNote("");
        setManualSuccess(true);
        setTimeout(() => setManualSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Manual entry failed:", err);
      setNotification({
        type: "error",
        message: "Không thể lưu giao dịch. Vui lòng thử lại.",
      });
    }
  };

  const TABS: {
    id: Tab;
    label: string;
    Icon: React.ElementType;
    neon: string;
    gradient: string;
  }[] = [
    {
      id: "scanner",
      label: "Quét HĐ",
      Icon: Camera,
      neon: "rgba(34,211,238,0.55)",
      gradient: "from-cyan-500 to-teal-400",
    },
    {
      id: "chat",
      label: "Chatbot",
      Icon: MessageSquare,
      neon: "rgba(56,189,248,0.55)",
      gradient: "from-sky-500 to-cyan-400",
    },
    {
      id: "manual",
      label: "Thủ công",
      Icon: PenLine,
      neon: "rgba(232,121,249,0.55)",
      gradient: "from-fuchsia-500 to-purple-400",
    },
  ];

  const totalSpent = expenses.reduce(
    (s: number, e: ExpenseItem) => s + e.amount,
    0,
  );

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
      }}
      className="max-w-5xl mx-auto pb-28"
    >
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
            <Scan className="w-5 h-5 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-theme-text-primary tracking-tight">
            Ghi nhận Chi tiêu
          </h1>
        </div>
        <p className="text-theme-text-muted ml-[52px] text-sm">
          Quét AI · Nhắn tin tự nhiên · Nhập thủ công — đồng bộ tức thì.
        </p>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex gap-2.5 mb-8">
        {TABS.map(({ id, label, Icon, neon, gradient }) => {
          const active = activeTab === id;
          return (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              whileHover={{ scale: 1.035, y: -1 }}
              whileTap={{ scale: 0.96 }}
              className={`relative flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold transition-colors duration-200 overflow-hidden ${
                active
                  ? `bg-gradient-to-r ${gradient} text-theme-text-primary`
                  : "bg-[#0a1120]/70 border border-white/[0.07] text-theme-text-muted hover:text-theme-text-primary hover:border-white/15"
              }`}
              style={active ? { boxShadow: `0 0 28px -4px ${neon}` } : {}}
            >
              {active && (
                <motion.div
                  layoutId="tab-glow-bg"
                  className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-15 blur-xl`}
                />
              )}
              <Icon className="relative z-10 w-4 h-4" />
              <span className="relative z-10">{label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
        {/* ── Left: Tab panels ── */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {/* ===================== SCANNER ===================== */}
            {activeTab === "scanner" && (
              <motion.div
                key="scanner"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              >
                <NeonCard accentColor="rgba(34,211,238,0.6)">
                  <div className="p-6 space-y-5">
                    {/* Card Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-theme-text-primary">
                          Quét Hóa Đơn AI
                        </h2>
                        <p className="text-xs text-theme-text-muted">
                          OCR tự động — không cần nhập tay
                        </p>
                      </div>
                    </div>

                    {/* Drop Zone */}
                    {scanPhase === "idle" && (
                      <motion.div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const f = e.dataTransfer.files[0];
                          if (f) handleFile(f);
                        }}
                        onClick={() => fileRef.current?.click()}
                        animate={{
                          borderColor: isDragging
                            ? "rgba(34,211,238,0.85)"
                            : "rgba(34,211,238,0.25)",
                          boxShadow: isDragging
                            ? "inset 0 0 40px rgba(34,211,238,0.06)"
                            : "none",
                        }}
                        whileHover={{ borderColor: "rgba(34,211,238,0.55)" }}
                        className="relative flex flex-col items-center justify-center gap-4 h-52 rounded-xl border-2 border-dashed cursor-pointer select-none transition-colors duration-200"
                        style={{ background: "rgba(6, 20, 40, 0.6)" }}
                      >
                        <motion.div
                          animate={{
                            scale: isDragging ? 1.18 : 1,
                            rotate: isDragging ? 8 : 0,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 20,
                          }}
                          className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center"
                        >
                          <Upload
                            className={`w-7 h-7 transition-colors ${isDragging ? "text-cyan-400" : "text-theme-text-muted"}`}
                          />
                        </motion.div>
                        <div className="text-center">
                          <p className="text-theme-text-primary font-semibold">
                            Kéo &amp; thả ảnh hóa đơn vào đây
                          </p>
                          <p className="text-theme-text-muted text-sm mt-1">
                            hoặc{" "}
                            <span className="text-cyan-400 underline underline-offset-2 cursor-pointer">
                              click để chọn file
                            </span>
                          </p>
                        </div>
                        <p className="text-xs text-gray-700">
                          JPG · PNG · HEIC · max 10MB
                        </p>
                        {isDragging && (
                          <motion.div
                            className="absolute inset-0 rounded-xl border-2 border-cyan-400 pointer-events-none"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 0.75, repeat: Infinity }}
                          />
                        )}
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(f);
                          }}
                        />
                      </motion.div>
                    )}

                    {/* Preview + Laser */}
                    {(scanPhase === "scanning" || scanPhase === "done") &&
                      previewUrl && (
                        <div className="space-y-4">
                          <div className="relative h-52 rounded-xl overflow-hidden bg-black">
                            <img
                              src={previewUrl}
                              alt="Receipt preview"
                              className={`w-full h-full object-cover transition-all duration-700 ${scanPhase === "scanning" ? "brightness-40 saturate-0" : "brightness-50"}`}
                            />
                            {scanPhase === "scanning" && <LaserBeam />}
                            {scanPhase === "done" && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55"
                              >
                                <motion.div
                                  initial={{ scale: 0, rotate: -30 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 280,
                                    damping: 18,
                                  }}
                                >
                                  <div
                                    className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center"
                                    style={{
                                      boxShadow:
                                        "0 0 30px rgba(34,211,238,0.7)",
                                    }}
                                  >
                                    <CheckCircle className="w-8 h-8 text-cyan-400" />
                                  </div>
                                </motion.div>
                                <span className="text-cyan-300 text-sm font-semibold tracking-wide">
                                  Quét thành công
                                </span>
                              </motion.div>
                            )}
                          </div>

                          {/* Status bar */}
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 border border-white/[0.06]">
                            {scanPhase === "scanning" ? (
                              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium text-theme-text-muted">
                              {scanText}
                            </span>
                          </div>

                          {/* Pre-filled result */}
                          {scanPhase === "done" && scannedData && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4 pt-3 border-t border-white/[0.06]"
                            >
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest">
                                  Kết quả AI trích xuất
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  {
                                    label: "Cửa hàng",
                                    value: scannedData.store ?? "—",
                                  },
                                  {
                                    label: "Danh mục",
                                    value: `${CATEGORY_INFO[scannedData.category].emoji} ${CATEGORY_INFO[scannedData.category].label}`,
                                  },
                                ].map((item) => (
                                  <div
                                    key={item.label}
                                    className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]"
                                  >
                                    <p className="text-[11px] text-theme-text-muted">
                                      {item.label}
                                    </p>
                                    <p className="text-sm text-theme-text-primary font-semibold mt-0.5">
                                      {item.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div
                                className="p-4 rounded-xl text-center"
                                style={{
                                  background:
                                    "linear-gradient(135deg,rgba(34,211,238,0.07),rgba(20,184,166,0.07))",
                                  border: "1px solid rgba(34,211,238,0.2)",
                                  boxShadow:
                                    "0 0 20px -8px rgba(34,211,238,0.5)",
                                }}
                              >
                                <p className="text-xs text-theme-text-muted">
                                  Tổng tiền hóa đơn
                                </p>
                                <p className="text-3xl font-extrabold text-cyan-400 mt-1">
                                  {fmt(scannedData.amount)}
                                  <span className="text-base font-normal text-cyan-600">
                                    đ
                                  </span>
                                </p>
                              </div>
                              <div className="flex gap-3">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={resetScanner}
                                  className="flex-1 py-3 rounded-xl border border-[var(--theme-subtle-border)] text-theme-text-muted hover:text-theme-text-primary hover:border-white/20 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                  <X className="w-4 h-4" /> Thử lại
                                </motion.button>
                                <motion.button
                                  whileHover={{
                                    scale: 1.02,
                                    boxShadow: "0 0 30px rgba(34,211,238,0.6)",
                                  }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={confirmScan}
                                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-theme-text-primary font-bold text-sm flex items-center justify-center gap-2"
                                  style={{
                                    boxShadow: "0 0 22px rgba(34,211,238,0.4)",
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4" /> Xác nhận
                                  lưu
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                  </div>
                </NeonCard>
              </motion.div>
            )}

            {/* ===================== CHAT ===================== */}
            {activeTab === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              >
                <NeonCard
                  accentColor="rgba(56,189,248,0.6)"
                  className="flex flex-col"
                  style={{ height: "520px" } as React.CSSProperties}
                >
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 p-5 border-b border-white/[0.06] flex-shrink-0">
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center"
                        style={{ boxShadow: "0 0 14px rgba(56,189,248,0.55)" }}
                      >
                        <Sparkles className="w-5 h-5 text-theme-text-primary" />
                      </div>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-cyan-400 rounded-full border-2 border-[#050d1a]"
                        style={{ boxShadow: "0 0 8px rgba(34,211,238,0.9)" }}
                      />
                    </div>
                    <div>
                      <p className="text-theme-text-primary font-bold text-sm">
                        Nova AI
                      </p>
                      <p
                        className="text-xs font-medium"
                        style={{ color: "rgba(34,211,238,0.8)" }}
                      >
                        Đang theo dõi chi tiêu của bạn
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                    <AnimatePresence initial={false}>
                      {messages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 14, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "typing" ? (
                            <div
                              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm"
                              style={{
                                background: "rgba(8,47,73,0.7)",
                                border: "1px solid rgba(34,211,238,0.2)",
                                boxShadow: "0 2px 18px rgba(34,211,238,0.07)",
                              }}
                            >
                              {[0, 1, 2].map((j) => (
                                <motion.div
                                  key={j}
                                  className="w-2 h-2 rounded-full bg-cyan-400"
                                  animate={{
                                    y: [0, -5, 0],
                                    opacity: [0.4, 1, 0.4],
                                  }}
                                  transition={{
                                    duration: 0.65,
                                    repeat: Infinity,
                                    delay: j * 0.16,
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <div
                              className={`max-w-[82%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                                msg.role === "user"
                                  ? "rounded-tr-sm text-theme-text-primary"
                                  : "rounded-tl-sm text-cyan-50"
                              }`}
                              style={
                                msg.role === "user"
                                  ? {
                                      background: "#1e2d3d",
                                      border:
                                        "1px solid rgba(255,255,255,0.08)",
                                    }
                                  : {
                                      background: "rgba(8,47,73,0.65)",
                                      border: "1px solid rgba(34,211,238,0.22)",
                                      boxShadow:
                                        "0 2px 22px rgba(34,211,238,0.07)",
                                    }
                              }
                            >
                              {msg.text}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                  </div>

                  {/* Quick suggestions */}
                  <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0 custom-scrollbar">
                    {[
                      "Ăn phở 40k",
                      "Đổ xăng 80k",
                      "Mua sách 120k",
                      "Cà phê 55k",
                      "Grab 35k",
                    ].map((s) => (
                      <motion.button
                        key={s}
                        whileHover={{
                          scale: 1.05,
                          borderColor: "rgba(34,211,238,0.45)",
                        }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setChatInput(s)}
                        className="px-3 py-1.5 rounded-xl text-theme-text-muted text-xs hover:text-cyan-300 transition-colors whitespace-nowrap flex-shrink-0"
                        style={{
                          background: "rgba(6,20,40,0.8)",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>

                  {/* Input bar */}
                  <div className="p-4 border-t border-white/[0.06] flex-shrink-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendChat();
                      }}
                      className="flex gap-3"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="VD: Hôm nay ăn phở hết 40k…"
                        disabled={chatLoading}
                        className="flex-1 rounded-xl px-4 py-3 text-sm text-theme-text-primary placeholder-gray-600 outline-none transition-all disabled:opacity-50"
                        style={{
                          background: "rgba(6,20,40,0.8)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onFocus={(e) =>
                          (e.target.style.boxShadow =
                            "0 0 0 3px rgba(34,211,238,0.08)")
                        }
                        onBlur={(e) => (e.target.style.boxShadow = "none")}
                      />
                      <motion.button
                        type="submit"
                        disabled={!chatInput.trim() || chatLoading}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-theme-text-primary disabled:opacity-35 flex-shrink-0 transition-opacity"
                        style={{ boxShadow: "0 0 18px rgba(56,189,248,0.45)" }}
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </form>
                  </div>
                </NeonCard>
              </motion.div>
            )}

            {/* ===================== MANUAL ===================== */}
            {activeTab === "manual" && (
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              >
                <NeonCard accentColor="rgba(232,121,249,0.55)">
                  <div className="p-6 space-y-5">
                    {/* Card Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/20 flex items-center justify-center">
                        <PenLine className="w-5 h-5 text-fuchsia-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-theme-text-primary">
                          Nhập thủ công
                        </h2>
                        <p className="text-xs text-theme-text-muted">
                          Cho các khoản không có hóa đơn
                        </p>
                      </div>
                    </div>

                    <form onSubmit={submitManual} className="space-y-5">
                      {/* Amount */}
                      <div>
                        <label className="text-[11px] font-bold text-theme-text-muted uppercase tracking-widest block mb-2">
                          Số tiền
                        </label>
                        <div className="relative group">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fuchsia-400 pointer-events-none" />
                          <input
                            type="text"
                            required
                            placeholder="0"
                            value={manualAmount ? fmt(parseFmt(manualAmount)) : ""}
                            onChange={(e) =>
                              handleFormattedAmountChange(e, setManualAmount)
                            }
                            className="w-full pl-11 pr-16 py-4 rounded-xl text-2xl font-extrabold text-theme-text-primary placeholder-gray-700 outline-none transition-all"
                            style={{
                              background: "rgba(6,20,40,0.8)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor =
                                "rgba(232,121,249,0.5)";
                              e.target.style.boxShadow =
                                "0 0 0 3px rgba(232,121,249,0.08)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor =
                                "rgba(255,255,255,0.08)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-theme-text-muted">
                            VNĐ
                          </div>
                        </div>
                        {wordsPreview && (
                          <p className="text-[10px] text-fuchsia-400/80 font-bold italic ml-2 mt-1.5">
                            {wordsPreview}
                          </p>
                        )}
                      </div>

                      {/* Category grid */}
                      <div>
                        <label className="text-[11px] font-bold text-theme-text-muted uppercase tracking-widest block mb-3">
                          Danh mục
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {(
                            Object.entries(CATEGORY_INFO) as [
                              ExpenseCategory,
                              (typeof CATEGORY_INFO)[ExpenseCategory],
                            ][]
                          ).map(([key, info]) => {
                            const active = manualCat === key;
                            return (
                              <motion.button
                                key={key}
                                type="button"
                                whileHover={{ scale: 1.06, y: -2 }}
                                whileTap={{ scale: 0.93 }}
                                onClick={() => setManualCat(key)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                                  active
                                    ? `${info.bg} ${info.color}`
                                    : "text-gray-600 hover:text-theme-text-muted"
                                }`}
                                style={{
                                  background: active
                                    ? undefined
                                    : "rgba(6,20,40,0.7)",
                                  border: active
                                    ? undefined
                                    : "1px solid rgba(255,255,255,0.06)",
                                  boxShadow: active
                                    ? "0 0 14px rgba(232,121,249,0.15)"
                                    : "none",
                                }}
                              >
                                <span className="text-lg leading-none">
                                  {info.emoji}
                                </span>
                                <span className="text-center leading-tight">
                                  {info.label}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Date + Note row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-theme-text-muted uppercase tracking-widest block mb-2">
                            Ngày
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted pointer-events-none" />
                            <input
                              type="date"
                              required
                              value={manualDate}
                              max={todayStr}
                              onChange={(e) => setManualDate(e.target.value)}
                              className="w-full pl-9 pr-3 py-3 rounded-xl text-theme-text-muted text-sm outline-none transition-all"
                              style={{
                                background: "rgba(6,20,40,0.8)",
                                border: "1px solid rgba(255,255,255,0.08)",
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor =
                                  "rgba(232,121,249,0.45)";
                                e.target.style.boxShadow =
                                  "0 0 0 3px rgba(232,121,249,0.07)";
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor =
                                  "rgba(255,255,255,0.08)";
                                e.target.style.boxShadow = "none";
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-theme-text-muted uppercase tracking-widest block mb-2">
                            Ghi chú
                          </label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Mô tả ngắn…"
                              value={manualNote}
                              onChange={(e) => setManualNote(e.target.value)}
                              className="w-full pl-9 pr-3 py-3 rounded-xl text-theme-text-muted text-sm placeholder-gray-700 outline-none transition-all"
                              style={{
                                background: "rgba(6,20,40,0.8)",
                                border: "1px solid rgba(255,255,255,0.08)",
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor =
                                  "rgba(232,121,249,0.45)";
                                e.target.style.boxShadow =
                                  "0 0 0 3px rgba(232,121,249,0.07)";
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor =
                                  "rgba(255,255,255,0.08)";
                                e.target.style.boxShadow = "none";
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit */}
                      <motion.button
                        type="submit"
                        whileHover={{
                          scale: 1.02,
                          boxShadow: "0 0 32px rgba(232,121,249,0.55)",
                        }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 text-theme-text-primary font-bold text-sm flex items-center justify-center gap-2 transition-all"
                        style={{ boxShadow: "0 0 22px rgba(232,121,249,0.38)" }}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {manualSuccess ? (
                            <motion.span
                              key="ok"
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" /> Đã ghi nhận
                              thành công!
                            </motion.span>
                          ) : (
                            <motion.span
                              key="go"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2"
                            >
                              Ghi nhận Chi tiêu{" "}
                              <ChevronRight className="w-4 h-4" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </form>
                  </div>
                </NeonCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: Expense Feed ── */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: 0.12,
            type: "spring",
            stiffness: 280,
            damping: 26,
          }}
        >
          <NeonCard
            accentColor="rgba(255,255,255,0.15)"
            className="lg:h-[650px] flex flex-col"
          >
            <div className="p-5 flex flex-col h-full">
              {/* Feed Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-theme-text-primary">
                  Lịch sử giao dịch
                </h3>
                <span
                  className="text-xs text-theme-text-muted px-2.5 py-1 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {filteredExpenses.length} khoản
                </span>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex bg-[var(--theme-subtle-bg)] p-1 rounded-xl border border-[var(--theme-subtle-border)]">
                  <button 
                    onClick={() => setSelectedFilterCategory('all')} 
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedFilterCategory === 'all' ? 'bg-cyan-500 text-white' : 'text-theme-text-muted hover:text-white'}`}
                  >
                    Tất cả
                  </button>
                  <button 
                    onClick={() => setSelectedFilterCategory('expense')} 
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedFilterCategory === 'expense' ? 'bg-rose-500 text-white' : 'text-theme-text-muted hover:text-white'}`}
                  >
                    Chi tiêu
                  </button>
                  <button 
                    onClick={() => setSelectedFilterCategory('income')} 
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedFilterCategory === 'income' ? 'bg-emerald-500 text-white' : 'text-theme-text-muted hover:text-white'}`}
                  >
                    Thu nhập
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-text-muted" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] rounded-xl text-xs text-theme-text-primary outline-none focus:border-cyan-500/50 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={selectedFilterCategory === 'all' || selectedFilterCategory === 'income' || selectedFilterCategory === 'expense' ? 'all' : selectedFilterCategory}
                      onChange={(e) => setSelectedFilterCategory(e.target.value)}
                      className="pl-3 pr-8 py-2 bg-[var(--theme-bg-surface)] border border-[var(--theme-subtle-border)] rounded-xl text-[10px] font-bold text-theme-text-primary outline-none focus:border-cyan-500/50 transition-all cursor-pointer appearance-none min-w-[100px]"
                    >
                      <option value="all">Mọi loại</option>
                      {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                        <option key={key} value={key}>{info.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-theme-text-muted pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Total counter */}
              <div
                className="mb-6 p-4 rounded-xl text-center"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-xs text-theme-text-muted">Tổng hiển thị</p>
                <motion.p
                  key={totalSpent}
                  initial={{ scale: 1.08, color: "#f87171" }}
                  animate={{ scale: 1, color: "#f1f5f9" }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-extrabold mt-1"
                >
                  {fmt(filteredExpenses.reduce((s, e) => e.type === 'expense' ? s + e.amount : s, 0))}
                  <span className="text-sm font-normal text-theme-text-muted">
                    đ
                  </span>
                </motion.p>
              </div>

              {/* Items Grouped by Date */}
              <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-0.5 min-h-0">
                <AnimatePresence initial={false}>
                  {filteredExpenses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-3">🧾</p>
                      <p className="text-sm text-gray-600">
                        Không tìm thấy giao dịch nào
                      </p>
                    </div>
                  ) : (
                    groupExpensesByDate(filteredExpenses).map(
                      ([date, items]) => (
                        <div key={date} className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-[1px] flex-1 bg-[var(--theme-subtle-bg)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted px-2 py-0.5 rounded-full border border-[var(--theme-subtle-border)] bg-white/[0.02]">
                              {getDateLabel(date)}
                            </span>
                            <div className="h-[1px] flex-1 bg-[var(--theme-subtle-bg)]" />
                          </div>

                          {items.map((exp: ExpenseItem) => {
                            const info =
                              CATEGORY_INFO[exp.category] ||
                              CATEGORY_INFO["other"];
                            const srcEmoji =
                              exp.source === "scanner"
                                ? "📷"
                                : exp.source === "chat"
                                  ? "💬"
                                  : "✏️";
                            return (
                              <motion.div
                                key={exp.id}
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 380,
                                  damping: 30,
                                }}
                              >
                                <motion.div
                                  whileHover={{
                                    x: 2,
                                    borderColor: "rgba(255,255,255,0.12)",
                                  }}
                                  className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-default"
                                  style={{
                                    background: "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm border flex-shrink-0 ${info.bg}`}
                                  >
                                    {info.emoji}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-theme-text-primary truncate">
                                      {exp.store || exp.description}
                                    </p>
                                    <p className="text-[10px] text-gray-600 uppercase font-bold tracking-tight">
                                      {info.label} · {srcEmoji} · {getDateLabel(exp.date)}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className={`text-sm font-bold ${exp.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {exp.type === 'income' ? '+' : '-'}{fmt(exp.amount)}đ
                                    </span>
                                    <button 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setConfirmDelete({ id: exp.id, title: exp.store || exp.description || 'Giao dịch này' });
                                      }}
                                      className="p-1.5 hover:bg-rose-500/15 rounded-lg text-gray-600 hover:text-rose-400 transition-all group/del"
                                      title="Xóa giao dịch"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 group-hover/del:scale-110 transition-transform" />
                                    </button>
                                  </div>
                                </motion.div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ),
                    )
                  )}
                </AnimatePresence>
              </div>
            </div>
          </NeonCard>
        </motion.div>
      </div>

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
              className="glass-panel w-full max-w-sm p-8 rounded-[32px] relative z-10 border border-[var(--theme-subtle-border)] shadow-2xl overflow-hidden"
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
                    Bạn có chắc chắn muốn xóa <span className="text-rose-400 font-bold">"{confirmDelete.title}"</span>? Hành động này không thể hoàn tác.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mt-6">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-4 py-3 rounded-2xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] text-theme-text-muted font-bold text-sm hover:bg-[var(--theme-bg-surface)] transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => executeDelete(confirmDelete.id)}
                    className="px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 transition-all"
                  >
                    Xác nhận xóa
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Custom Notification Toast --- */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: "-50%", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }}
            className="fixed top-8 left-1/2 z-[100] px-6 py-4 rounded-2xl backdrop-blur-xl border flex items-center gap-4 shadow-2xl min-w-[320px]"
            style={{
              background:
                notification.type === "error"
                  ? "rgba(220, 38, 38, 0.15)"
                  : "rgba(16, 185, 129, 0.15)",
              borderColor:
                notification.type === "error"
                  ? "rgba(220, 38, 38, 0.3)"
                  : "rgba(16, 185, 129, 0.3)",
              boxShadow:
                notification.type === "error"
                  ? "0 8px 32px rgba(220, 38, 38, 0.2)"
                  : "0 8px 32px rgba(16, 185, 129, 0.2)",
            }}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${notification.type === "error" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}
            >
              {notification.type === "error" ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-tighter opacity-50 mb-0.5">
                {notification.type === "error"
                  ? "Cảnh báo hệ thống"
                  : "Thông báo Nova"}
              </p>
              <p className="text-sm font-bold text-theme-text-primary leading-tight">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-[var(--theme-subtle-bg)] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-theme-text-muted" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
