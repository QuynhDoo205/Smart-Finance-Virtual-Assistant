export type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'entertainment' | 'health' | 'education' | 'other';

export interface ParsedExpense {
  store?: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
}

const today = () => new Date().toISOString().split('T')[0];

export const CATEGORY_INFO: Record<ExpenseCategory, { label: string; emoji: string; color: string; bg: string }> = {
  food:          { label: 'Ăn uống',   emoji: '🍜', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  transport:     { label: 'Di chuyển', emoji: '🚗', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  shopping:      { label: 'Mua sắm',   emoji: '🛍️', color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20' },
  entertainment: { label: 'Giải trí',  emoji: '🎮', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  health:        { label: 'Sức khỏe',  emoji: '💊', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  education:     { label: 'Học tập',   emoji: '📚', color: 'text-sky-400',    bg: 'bg-sky-500/10 border-sky-500/20' },
  other:         { label: 'Khác',      emoji: '💳', color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20' },
};

// ─── Mock Receipt Scanner ──────────────────────────────────────────────────────
const MOCK_RECEIPTS: ParsedExpense[] = [
  { store: 'Circle K',           amount: 50000,  category: 'food',      description: 'Nước uống & snack',  date: today() },
  { store: 'Highlands Coffee',   amount: 75000,  category: 'food',      description: 'Cà phê & bánh ngọt', date: today() },
  { store: 'GrabFood',           amount: 65000,  category: 'food',      description: 'Giao đồ ăn tại nhà', date: today() },
  { store: 'Shopee Express',     amount: 120000, category: 'shopping',  description: 'Đơn hàng online',    date: today() },
  { store: 'Petec Petrol',       amount: 80000,  category: 'transport', description: 'Đổ xăng xe máy',    date: today() },
  { store: 'CGV Cinemas',        amount: 90000,  category: 'entertainment', description: 'Vé xem phim',   date: today() },
];

export const mockScanReceipt = (_file: File): Promise<ParsedExpense> =>
  new Promise(resolve =>
    setTimeout(() => {
      const result = MOCK_RECEIPTS[Math.floor(Math.random() * MOCK_RECEIPTS.length)];
      resolve({ ...result, date: today() });
    }, 2600)
  );

// ─── Mock Chat Parser ──────────────────────────────────────────────────────────
const KEYWORD_MAP: Array<[string[], ExpenseCategory]> = [
  [['ăn', 'phở', 'cơm', 'bún', 'bánh', 'café', 'cà phê', 'trà', 'nước', 'snack', 'pizza', 'burger', 'sushi', 'lẩu', 'grab food', 'bữa'], 'food'],
  [['grab', 'xe', 'xăng', 'bus', 'taxi', 'uber', 'gojek', 'vé tàu', 'vé xe'], 'transport'],
  [['mua', 'shopee', 'lazada', 'tiki', 'quần', 'áo', 'giày', 'dép', 'túi'], 'shopping'],
  [['phim', 'game', 'cinema', 'cgv', 'netflix', 'spotify', 'nhạc', 'cà phê ngồi'], 'entertainment'],
  [['thuốc', 'bệnh viện', 'khám', 'bác sĩ', 'pharmacy'], 'health'],
  [['sách', 'học', 'khóa học', 'học phí', 'udemy', 'coursera'], 'education'],
];

const parseAmount = (text: string): number => {
  const lower = text.toLowerCase();
  const kMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*k/);
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1000);
  const fullMatch = text.match(/(\d{1,3})(?:[.,])(\d{3})/);
  if (fullMatch) return parseInt(fullMatch[1] + fullMatch[2]);
  const plainMatch = text.match(/(\d+)/);
  return plainMatch ? parseInt(plainMatch[1]) : 50000;
};

const parseCategory = (text: string): ExpenseCategory => {
  const lower = text.toLowerCase();
  for (const [keywords, cat] of KEYWORD_MAP) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return 'other';
};

export const mockParseChat = (message: string): Promise<ParsedExpense> =>
  new Promise(resolve =>
    setTimeout(() => {
      resolve({
        amount: parseAmount(message),
        category: parseCategory(message),
        description: message,
        date: today(),
      });
    }, 2000)
  );
