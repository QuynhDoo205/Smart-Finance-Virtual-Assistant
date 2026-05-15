import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Lucide from 'lucide-react';
import { BrainCircuit, RefreshCw, Sparkles, Info, HelpCircle, Target, X, ExternalLink, Banknote, PieChart as PieIcon, CheckCircle2, AlertCircle, PlusCircle, Settings, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import LinkedSliders, { type Jar } from './components/LinkedSliders';
import { dashboardApi, authApi, transactionsApi, userApi } from '../../utils/api';
import Skeleton from '../../components/common/Skeleton';

const INIT_JARS: Jar[] = [
  { id:'1', name:'Thiết yếu',  emoji:'🛒', percentage:40, locked:false, color:'#0EA5E9', neonColor:'#22d3ee', description:'Ăn uống, đi lại, hóa đơn' },
  { id:'2', name:'Tiết kiệm',  emoji:'🏦', percentage:30, locked:false, color:'#10B981', neonColor:'#10b981', description:'Quỹ khẩn cấp & tích lũy' },
  { id:'3', name:'Phát triển', emoji:'📚', percentage:10, locked:false, color:'#8B5CF6', neonColor:'#a855f7', description:'Học tập, sách, kỹ năng' },
  { id:'4', name:'Hưởng thụ',  emoji:'🎮', percentage:10, locked:false, color:'#F59E0B', neonColor:'#fbbf24', description:'Giải trí, sở thích' },
  { id:'5', name:'Đầu tư',     emoji:'📈', percentage:10, locked:false, color:'#EC4899', neonColor:'#ff00c8', description:'Tài sản, kinh doanh' },
];

const fmtVND = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const getSmartIcon = (title: string, defaultIcon: string) => {
  const t = title.toLowerCase();
  if (t.includes('nhà') || t.includes('phòng') || t.includes('trọ')) return 'home';
  if (t.includes('điện') || t.includes('nước') || t.includes('hóa đơn')) return 'zap';
  if (t.includes('ăn') || t.includes('uống') || t.includes('chợ')) return 'utensils';
  if (t.includes('xe') || t.includes('xăng') || t.includes('đi lại')) return 'car';
  if (t.includes('học') || t.includes('trường') || t.includes('khóa')) return 'book';
  if (t.includes('mạng') || t.includes('wifi') || t.includes('4g') || t.includes('internet')) return 'wifi';
  if (t.includes('gym') || t.includes('sức khỏe') || t.includes('thuốc')) return 'heart';
  if (t.includes('mua') || t.includes('sắm')) return 'shopping-bag';
  return defaultIcon;
};

const IconRenderer = ({ iconName, className }: { iconName: string, className?: string }) => {
  if (!iconName) return <Lucide.HelpCircle className={className} />;
  
  // Check if it's an emoji
  const isEmoji = /\p{Emoji}/u.test(iconName);
  if (isEmoji) return <span className={className}>{iconName}</span>;

  // Convert kebab-case to PascalCase
  const pascalName = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const IconComponent = (Lucide as any)[pascalName];
  if (IconComponent) return <IconComponent className={className} />;
  
  return <Lucide.HelpCircle className={className} />;
};

export default function BudgetManager() {
  const navigate = useNavigate();
  const [income, setIncome] = useState(0);
  const [jars, setJars] = useState<Jar[]>(INIT_JARS);
  const [fixedExpenses, setFixedExpenses] = useState<{name: string, emoji: string, amount: number}[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [actualExpense, setActualExpense] = useState(0);
  const [lockedEmergency, setLockedEmergency] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  const [toastLimitWarning, setToastLimitWarning] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, transRes, dashRes, dashBudgetRes] = await Promise.all([
          authApi.me(),
          transactionsApi.list(50),
          dashboardApi.getSummary(),
          dashboardApi.getBudget()
        ]);
        
        let detectedIncome = profileRes.success ? (profileRes.data.user.monthly_income || 0) : 0;
        
        if (detectedIncome === 0 && dashRes.success) {
          detectedIncome = dashRes.data.totalIncome;
        }

        if (detectedIncome === 0 && transRes.success) {
          const incomes = transRes.data.transactions.filter((t: any) => t.type === 'income' || t.loai_giao_dich === 'thu_nhap');
          if (incomes.length > 0) detectedIncome = Number(incomes[0].amount);
        }
        
        setIncome(detectedIncome);
        // Lưu chi tiêu thực tế tháng này và quỹ dự phòng để trừ vào thẻ 3
        if (dashRes.success) {
          setActualExpense(dashRes.data.totalExpense || 0);
          setLockedEmergency(dashRes.data.remainingEmergency || 0);
        }

        // 2. Fetch Budgets
        const budgetRes = await dashboardApi.getBudget();
        
        // Calculate availableToBudget based on current logic to align with mapping
        const initialFixed = budgetRes.success 
          ? budgetRes.data.budgets.filter((b: any) => b.limit_amount > 0 && (b.budget_title && b.budget_title.trim() !== '')).reduce((s: number, e: any) => s + parseFloat(e.limit_amount), 0)
          : 0;
        const availableToBudget = Math.max(0, detectedIncome - initialFixed);

        if (budgetRes.success) {
          const budgets = budgetRes.data.budgets;
          
          // IDs của các lọ chuẩn (Thiết yếu:4, Tiết kiệm:3, Phát triển:9, Hưởng thụ:7, Đầu tư:8)
          // LƯU Ý: Lọ chuẩn là những budget có tieu_de rỗng hoặc null
          const jarCategories = [4, 3, 9, 7, 8]; 
          
          setJars(prev => prev.map(j => {
            const mapping: Record<string, number> = { '1': 4, '2': 3, '3': 9, '4': 7, '5': 8 };
            const catId = mapping[j.id];
            
            // Tìm budget tương ứng với category và có tieu_de rỗng (loại trừ các phí cố định cùng category)
            const matched = budgets.find((b: any) => 
              Number(b.category_id) === catId && 
              (!b.budget_title || b.budget_title.trim() === '')
            );

            if (matched && availableToBudget > 0) {
              const pct = Math.round((Number(matched.limit_amount) / availableToBudget) * 100);
              return { ...j, percentage: pct };
            }
            return j;
          }));

          // Đồng thời load các chi phí cố định (những cái KHÔNG phải lọ chuẩn)
          const mappedFixed = budgets
            .filter((b: any) => {
               // Nếu cùng category với jar nhưng có tiêu đề thì vẫn là phí cố định
               const isJarCat = jarCategories.includes(Number(b.category_id));
               const hasTitle = b.budget_title && b.budget_title.trim() !== '';
               return !isJarCat || hasTitle;
            })
            .filter((b: any) => b.limit_amount > 0)
            .map((b: any) => ({
              name: b.budget_title || b.category_name,
              emoji: getSmartIcon(b.budget_title || b.category_name, b.category_icon || '💰'),
              amount: parseFloat(b.limit_amount)
            }));
          
          setFixedExpenses(mappedFixed);
        }
      } catch (err) {
        console.error('Failed to load budget data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalFixed = fixedExpenses.reduce((s, e) => s + e.amount, 0);
  // Thẻ 3: Khả dụng = Thu nhập - Phí cố định - Quỹ dự phòng - Chi tiêu thực tế tháng này
  const availableToBudget = Math.max(0, income - totalFixed - lockedEmergency - actualExpense);
  const isOverBudget = totalFixed > income;
  const unallocated = 100 - jars.reduce((s, j) => s + j.percentage, 0);

  const handleAI = async () => {
    setAiLoading(true);
    try {
      const res = await dashboardApi.suggestJars();
      if (res.success) {
        setJars(res.data.jars.map((s: any, i: number) => ({ ...jars[i], percentage: s.percentage })));
      }
    } catch {
      // Fallback if AI fails
    } finally {
      setAiLoading(false);
    }
  };

  const handleLimitWarning = (msg: string) => {
    setToastLimitWarning(msg);
    setTimeout(() => setToastLimitWarning(null), 5000);
  };

  const handleSyncReality = async () => {
    try {
      const summaryRes = await dashboardApi.getSummary();
      if (summaryRes.success && summaryRes.data.totalIncome > 0) {
        const realIncome = summaryRes.data.totalIncome;
        setIncome(realIncome);
        const budgetRes = await dashboardApi.getBudget();
        const jarCategories = [4, 3, 9, 7, 8]; 
        const existingBudgets = budgetRes.success 
          ? budgetRes.data.budgets
              .filter((b: any) => {
                // CHỈ giữ lại các mục thực sự là phí cố định:
                // 1. Không thuộc category của 6 lọ chuẩn
                // 2. HOẶC thuộc category đó nhưng có tiêu đề riêng (vd: Ăn uống bên ngoài)
                const isJarCat = jarCategories.includes(Number(b.category_id));
                const hasTitle = b.budget_title && b.budget_title.trim() !== '';
                return !isJarCat || hasTitle;
              })
              .map((b: any) => ({ 
                categoryName: b.budget_title || b.category_name, 
                amount: b.limit_amount,
                category: b.category_name
              }))
          : [];
        await userApi.updateOnboarding(realIncome, existingBudgets);
        // Thay alert bằng toast trạng thái
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Reality sync failed:', err);
    }
  };

  const handleSave = async () => {
    console.log('--- Handle Save ---');
    console.log('Unallocated:', unallocated);
    console.log('Is Over Budget:', isOverBudget);
    console.log('Available to Budget:', availableToBudget);

    if (Math.abs(unallocated) > 0.01) {
      setToastError(`Chưa phân bổ hết 100% (còn thiếu ${Math.round(unallocated)}%)`);
      setTimeout(() => setToastError(null), 3000);
      return;
    }
    
    if (isOverBudget) {
      setToastError("Bạn đang thâm hụt ngân sách, hãy giảm phí cố định trước.");
      setTimeout(() => setToastError(null), 3000);
      return;
    }
    
    setSaveLoading(true);
    const categoryMapping: Record<string, number> = { '1': 4, '2': 3, '3': 9, '4': 7, '5': 8 };
    const budgetsToSave = jars
      .filter(j => categoryMapping[j.id])
      .map(j => ({
        categoryId: categoryMapping[j.id],
        limit: Math.round(availableToBudget * (j.percentage / 100))
      }));

    try {
      const res = await dashboardApi.setupBudget(budgetsToSave);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setToastError(res.message || "Lỗi không xác định khi lưu");
        setTimeout(() => setToastError(null), 3000);
      }
    } catch (err: any) {
      console.error('Save budget failed:', err);
      setToastError(err.message || "Lỗi kết nối server");
      setTimeout(() => setToastError(null), 3000);
    } finally {
      setSaveLoading(false);
    }
  };

  const [showAddJarModal, setShowAddJarModal] = useState(false);
  const [newJarName, setNewJarName] = useState('');
  const [newJarEmoji, setNewJarEmoji] = useState('💰');

  const handleAddJar = () => {
    if (!newJarName.trim()) return;
    const id = Math.random().toString(36).slice(2);
    const newJar: Jar = {
      id,
      name: newJarName.trim(),
      emoji: newJarEmoji,
      percentage: 0,
      locked: false,
      color: '#6366f1',
      neonColor: '#818cf8',
      description: 'Lọ chi tiêu mới thêm'
    };
    setJars([...jars, newJar]);
    setNewJarName('');
    setShowAddJarModal(false);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 pb-20">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton width="250px" height="32px" />
            <Skeleton width="450px" height="16px" variant="text" />
          </div>
          <Skeleton width="48px" height="48px" className="rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton height="160px" className="rounded-[2rem]" />
          <Skeleton height="160px" className="rounded-[2rem]" />
          <Skeleton height="160px" className="rounded-[2rem]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          <Skeleton height="600px" className="lg:col-span-7 rounded-[2.5rem]" />
          <div className="lg:col-span-5 space-y-6">
            <Skeleton height="80px" className="rounded-[2rem]" />
            <Skeleton height="300px" className="rounded-[3rem]" />
            <Skeleton height="350px" className="rounded-[3rem]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* --- ADD JAR MODAL --- */}
      <AnimatePresence>
        {showAddJarModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddJarModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm glass-panel p-8 rounded-[2.5rem] border border-[var(--theme-subtle-border)] bg-[var(--theme-bg-surface)] shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent" />
              <h2 className="text-xl font-black text-theme-text-primary mb-6 flex items-center gap-3">
                <PlusCircle className="w-6 h-6 text-primary-400" />
                Thêm lọ tài chính
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-2 block">Tên lọ mới</label>
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="VD: Nuôi mèo, Du lịch..."
                    className="w-full bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] rounded-2xl px-4 py-3 text-sm text-theme-text-primary focus:border-primary-500 outline-none transition-all"
                    value={newJarName}
                    onChange={e => setNewJarName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddJar()}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-2 block">Biểu tượng</label>
                  <div className="flex gap-2 flex-wrap">
                    {['💰', '🏖️', '🐱', '🎁', '🚗', '🏠', '🍕', '💻'].map(e => (
                      <button 
                        key={e}
                        onClick={() => setNewJarEmoji(e)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${newJarEmoji === e ? 'bg-primary-500/20 border border-primary-500 shadow-lg scale-110' : 'bg-[var(--theme-subtle-bg)] border border-transparent hover:border-[var(--theme-subtle-border)]'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowAddJarModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-[var(--theme-subtle-border)] text-theme-text-muted font-bold text-xs uppercase tracking-widest hover:bg-[var(--theme-subtle-bg)] transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleAddJar}
                  disabled={!newJarName.trim()}
                  className="flex-1 py-3 rounded-2xl bg-primary-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/30 hover:bg-primary-600 disabled:opacity-50 transition-all"
                >
                  Thêm ngay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LIMIT WARNING TOAST (Top Center) --- */}
      <AnimatePresence>
        {toastLimitWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -20, scale: 0.95 }} 
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-6 py-4 rounded-[2rem] bg-rose-500 text-white shadow-2xl shadow-rose-500/40 border border-white/20"
          >
             <div className="p-2 bg-white/20 rounded-xl">
               <AlertCircle className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs font-black uppercase tracking-wider">Không thể tăng thêm!</p>
               <p className="text-[10px] font-medium opacity-90">{toastLimitWarning}</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TOAST NOTIFICATION (Top Right) --- */}
      <AnimatePresence>
        {(saved || toastError) && (
          <motion.div 
            initial={{ opacity: 0, x: 50, y: 20 }} 
            animate={{ opacity: 1, x: 0, y: 0 }} 
            exit={{ opacity: 0, x: 50 }} 
            className="fixed top-6 right-6 z-[250]"
          >
            <div className={`${toastError ? 'bg-rose-500/90 shadow-rose-500/30' : 'bg-emerald-500/90 shadow-emerald-500/30'} backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-2xl border border-[var(--theme-subtle-border)] flex items-center gap-3 font-black uppercase tracking-widest text-[10px]`}>
               <div className="p-1.5 bg-white/20 rounded-lg">
                {toastError ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
               </div>
               {toastError || "Thao tác thành công!"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-theme-text-primary tracking-tight">Thiết lập Ngân sách</h1>
          <p className="text-xs text-theme-text-muted mt-1 font-medium">Chiến lược dòng tiền: Trừ phí cố định trước, phân bổ các lọ thông minh sau.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGuide(!showGuide)} className="p-2 rounded-xl bg-[var(--theme-subtle-bg)] border border-[var(--theme-subtle-border)] text-theme-text-muted hover:bg-[var(--theme-bg-surface)] transition-all">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- CẢNH BÁO NẾU PHÍ CỐ ĐỊNH QUÁ CAO --- */}
      {isOverBudget && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4 text-rose-400">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <p className="text-sm font-black uppercase">Cảnh báo: Thâm hụt ngân sách!</p>
            <p className="text-xs font-medium opacity-80">Phí cố định của bạn ({fmtVND(totalFixed)}) đã vượt quá Thu nhập ({fmtVND(income)}). Bạn không còn tiền để phân bổ vào các lọ.</p>
          </div>
        </motion.div>
      )}

      {/* --- SECTION 1: DÒNG TIỀN ĐẦU VÀO & NGHĨA VỤ --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Thu Nhập */}
        <div className="glass-panel p-6 rounded-[2rem] border border-[var(--theme-subtle-border)] bg-gradient-to-br from-cyan-500/5 to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Banknote className="w-12 h-12" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
              <Banknote className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">1. Thu nhập ròng</p>
          </div>
          <h3 className="text-2xl font-black text-theme-text-primary mb-3">{fmtVND(income)}</h3>
          <button onClick={handleSyncReality} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-2">
            <RefreshCw className="w-3 h-3" /> Cập nhật thực tế
          </button>
        </div>

        {/* Phí Cố Định */}
        <div className="glass-panel p-6 rounded-[2rem] border border-[var(--theme-subtle-border)] bg-gradient-to-br from-rose-500/5 to-transparent relative group">
          <button 
            onClick={() => navigate('/app/profile?tab=expenses')}
            className="absolute top-4 right-4 p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 opacity-0 group-hover:opacity-100 transition-all"
            title="Sửa chi phí cố định"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">2. Phí cố định</p>
          </div>
          <h3 className="text-2xl font-black text-rose-400 mb-3">-{fmtVND(totalFixed)}</h3>
          <div className="space-y-1.5 text-[9px] text-theme-text-muted font-bold max-h-16 overflow-y-auto custom-scrollbar">
            {fixedExpenses.length > 0 ? fixedExpenses.map((e, i) => (
              <div key={i} className="flex justify-between items-center bg-[var(--theme-subtle-bg)] p-1 rounded-md">
                <span className="flex items-center gap-1.5">
                  <IconRenderer iconName={e.emoji} className="w-3 h-3" />
                  {e.name}
                </span>
                <span className="text-rose-400/80">{fmtVND(e.amount)}</span>
              </div>
            )) : <p className="italic opacity-50">Chưa có phí cố định</p>}
          </div>
        </div>

        {/* Khả dụng */}
        <div className="glass-panel p-6 rounded-[2rem] border border-primary-500/30 bg-primary-500/10 shadow-[0_0_30px_rgba(139,92,246,0.1)] relative overflow-hidden">
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-primary-500/10 blur-2xl rounded-full" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-500/20 rounded-xl text-primary-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-primary">3. Khả dụng để chia lọ</p>
          </div>
          <h3 className="text-3xl font-black text-primary-400 tracking-tighter drop-shadow-sm">{fmtVND(availableToBudget)}</h3>
          <div className="mt-3 space-y-1 text-[9px] text-theme-text-muted font-bold">
            <div className="flex justify-between">
              <span className="opacity-60">Thu nhập ròng</span>
              <span className="text-cyan-400">{fmtVND(income)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">− Phí cố định</span>
              <span className="text-rose-400">−{fmtVND(totalFixed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">− Chi tiêu tháng này</span>
              <span className="text-amber-400">−{fmtVND(actualExpense)}</span>
            </div>
            {lockedEmergency > 0 && (
              <div className="flex justify-between">
                <span className="opacity-60">− Quỹ dự phòng đang khóa</span>
                <span className="text-sky-400">−{fmtVND(lockedEmergency)}</span>
              </div>
            )}
            <div className="border-t border-[var(--theme-subtle-border)] pt-1 flex justify-between">
              <span className="text-primary-300 font-black">= Còn khả dụng</span>
              <span className="text-primary-300">{fmtVND(availableToBudget)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* --- LEFT: SLIDERS --- */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-8 rounded-[2.5rem] border border-[var(--theme-subtle-border)] shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black text-theme-text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-primary-400" />
                Cấu trúc các lọ (Trên {fmtVND(availableToBudget)})
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setJars(jars.map(j => ({ ...j, percentage: 0 })))}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-wider"
                >
                  Đặt lại (0%)
                </button>
                <button 
                  onClick={() => setShowAddJarModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--theme-subtle-bg)] hover:bg-[var(--theme-subtle-border)] border border-[var(--theme-subtle-border)] rounded-lg text-[9px] font-bold text-theme-text-muted hover:text-theme-text-primary transition-all uppercase tracking-wider"
                >
                  <PlusCircle className="w-3 h-3" /> Thêm lọ
                </button>
              </div>
            </div>
            <LinkedSliders 
              jars={jars} 
              totalBudget={availableToBudget} 
              onJarsChange={setJars} 
              onWarning={handleLimitWarning}
              formatCurrency={fmtVND} 
            />
          </div>
        </div>

        {/* --- RIGHT: PIE CHART & SUMMARY --- */}
        <div className="lg:col-span-5 space-y-6">
          <button onClick={handleAI} disabled={aiLoading || isOverBudget} className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-black uppercase tracking-[0.2em] hover:shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group">
            {aiLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
            AI Gợi ý phân bổ lọ
          </button>

          {/* BIỂU ĐỒ TRÒN NEON */}
          <div className="glass-panel p-8 rounded-[3rem] border border-[var(--theme-subtle-border)] relative shadow-2xl overflow-hidden min-h-[300px] flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />
            <div className="w-full h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jars.map(j => ({ name: j.name, value: j.percentage, color: j.color, neonColor: j.neonColor }))}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={1000}
                    stroke="none"
                  >
                    {jars.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.neonColor || entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[var(--theme-bg-surface)] border border-[var(--theme-subtle-border)] p-3 rounded-2xl shadow-2xl backdrop-blur-xl">
                            <p className="text-[10px] font-black text-theme-text-primary mb-1">{data.name}</p>
                            <p className="text-[9px] text-primary-400 font-bold uppercase">
                              {data.value}% = {fmtVND(Math.round(availableToBudget * (data.value / 100)))}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-theme-text-primary tracking-tighter">{100 - unallocated}%</span>
                <span className="text-[8px] font-black uppercase text-theme-text-muted tracking-[0.3em]">Đã phân bổ</span>
              </div>
            </div>
            
            {/* LEGEND NHỎ DƯỚI BIỂU ĐỒ */}
            <div className="grid grid-cols-3 gap-3 mt-4 w-full px-2">
              {jars.map(j => (
                <div key={j.id} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: j.neonColor || j.color, boxShadow: `0 0 8px ${j.neonColor || j.color}` }} />
                  <span className="text-[8px] font-black text-theme-text-muted uppercase truncate">{j.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[3rem] border border-[var(--theme-subtle-border)] shadow-xl relative overflow-hidden">
            <h2 className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.3em] mb-6">Tóm tắt phân bổ</h2>
            <div className="space-y-4">
              {jars.map(j => (
                <div key={j.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--theme-subtle-bg)] flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                      <IconRenderer iconName={j.emoji} className="w-4 h-4 text-theme-text-muted group-hover:text-primary-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-theme-text-primary uppercase">{j.name}</span>
                      <span className="text-[8px] text-theme-text-muted font-bold">{j.percentage}%</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-theme-text-primary">{fmtVND(Math.round(availableToBudget * (j.percentage / 100)))}</span>
                </div>
              ))}
              
              <div className="pt-6 border-t border-[var(--theme-subtle-border)] mt-4">
                <button 
                  onClick={handleSave} 
                  disabled={Math.abs(unallocated) > 0.01 || isOverBudget || saveLoading} 
                  className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
                    Math.abs(unallocated) <= 0.01 && !isOverBudget
                      ? 'bg-primary-500 text-white hover:bg-primary-600 hover:scale-[1.02] active:scale-[0.98]' 
                      : 'bg-[var(--theme-subtle-bg)] text-theme-text-muted cursor-not-allowed'
                  } ${saveLoading ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {saveLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {Math.abs(unallocated) <= 0.01 ? 'Lưu thiết lập' : `Cần thêm ${Math.round(unallocated)}%`}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
