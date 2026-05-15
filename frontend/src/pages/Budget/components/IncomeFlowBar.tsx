import { motion } from 'framer-motion';
import { ArrowRight, Wallet, ShieldAlert, Sparkles } from 'lucide-react';

interface IncomeFlowBarProps {
  totalIncome: number;
  fixedExpenses: number;
  formatCurrency: (val: number) => string;
}

export default function IncomeFlowBar({ totalIncome, fixedExpenses, formatCurrency }: IncomeFlowBarProps) {
  const remaining = totalIncome - fixedExpenses;
  const fixedPct = Math.round((fixedExpenses / totalIncome) * 100);
  const remainingPct = 100 - fixedPct;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 rounded-2xl mb-6"
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--theme-text-muted)' }}>
        Dòng chảy thu nhập tháng này
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Thu nhập */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="flex-1 rounded-xl p-4 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,245,255,0.05))',
            border: '1px solid rgba(0,245,255,0.25)',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,245,255,0.15)' }}>
            <Wallet className="w-5 h-5" style={{ color: 'var(--theme-neon-primary)' }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Thu nhập</p>
            <p className="font-bold text-lg" style={{ color: 'var(--theme-text-primary)' }}>
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </motion.div>

        <ArrowRight className="w-5 h-5 hidden sm:block flex-shrink-0" style={{ color: 'var(--theme-text-muted)' }} />

        {/* Phí cố định */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="flex-1 rounded-xl p-4 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Phí cố định ({fixedPct}%)</p>
            <p className="font-bold text-lg text-rose-400">{formatCurrency(fixedExpenses)}</p>
          </div>
        </motion.div>

        <ArrowRight className="w-5 h-5 hidden sm:block flex-shrink-0" style={{ color: 'var(--theme-text-muted)' }} />

        {/* Còn lại */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="flex-1 rounded-xl p-4 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))',
            border: '1px solid rgba(16,185,129,0.25)',
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Khả dụng ({remainingPct}%)</p>
            <p className="font-bold text-lg text-emerald-400">{formatCurrency(remaining)}</p>
          </div>
        </motion.div>
      </div>

      {/* Visual flow bar */}
      <div className="mt-4 h-3 rounded-full overflow-hidden flex gap-0.5" style={{ background: 'var(--theme-subtle-bg)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fixedPct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-rose-500/80 rounded-l-full"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${remainingPct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-r-full"
          style={{ background: 'linear-gradient(90deg, #10b981, var(--theme-neon-primary))' }}
        />
      </div>
    </motion.div>
  );
}
