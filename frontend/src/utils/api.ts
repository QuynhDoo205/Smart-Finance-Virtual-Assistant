const getApiRoot = () => {
  // Nếu đang chạy trên máy cá nhân (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001';
  }
  // Nếu đang chạy trên link Cloudflare hoặc link khác
  return import.meta.env.VITE_API_URL || 'http://localhost:5001';
};

export const API_ROOT = getApiRoot();
export const BASE_URL = `${API_ROOT}/api`;

function getToken(): string | null {
  return localStorage.getItem('nova_token');
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const isFormData = options.body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    'ngrok-skip-browser-warning': '69420',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`🌐 Calling API: ${BASE_URL}${endpoint}`, options.method || 'GET');
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  if (!response.ok) {
    // Xử lý Chế độ bảo trì Real-time
    if (response.status === 503 && data && data.maintenance) {
      const msg = encodeURIComponent(data.message || '');
      const until = data.until ? encodeURIComponent(data.until) : '';
      window.location.href = `/maintenance?msg=${msg}&until=${until}`;
      return data as T;
    }

    const errorMessage = (typeof data === 'object' ? data.message : data) || `Lỗi HTTP ${response.status}`;
    throw new Error(errorMessage);
  }
  
  return data as T;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{
      success: boolean;
      message: string;
      data: { token: string; user: UserProfile };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (full_name: string, email: string, password: string) =>
    apiFetch<{
      success: boolean;
      message: string;
      data: { token: string; user: UserProfile };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password }),
    }),

  googleLogin: (token: string, intent: 'login' | 'register' = 'login') =>
    apiFetch<{
      success: boolean;
      message: string;
      data: { token: string; user: UserProfile };
    }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token, intent }),
    }),

  me: () =>
    apiFetch<{ success: boolean; data: { user: UserProfile } }>('/auth/me'),

  forgotPassword: (email: string) =>
    apiFetch<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Dashboard API
export const dashboardApi = {
  getSummary: () =>
    apiFetch<{ success: boolean; data: DashboardSummary }>('/dashboard/summary'),
  
  getTransactions: (limit = 10) =>
    apiFetch<{ success: boolean; data: { transactions: Transaction[] } }>(
      `/dashboard/transactions?limit=${limit}`
    ),
  
  getBudget: () =>
    apiFetch<{ success: boolean; data: { budgets: Budget[] } }>('/dashboard/budget'),
  
  getSavingsGoals: () =>
    apiFetch<{ success: boolean; data: { goals: SavingsGoal[] } }>('/dashboard/savings-goals'),
    
  createSavingsGoal: (goalData: { name: string; targetAmount: number; deadline: string; icon?: string; color?: string }) =>
    apiFetch<{ success: boolean; data: { goal: SavingsGoal } }>('/dashboard/savings-goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    }),
    
  fundSavingsGoal: (id: number, amount: number) =>
    apiFetch<{ success: boolean; message: string }>(`/dashboard/savings-goals/${id}/fund`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  
  getChartData: () =>
    apiFetch<{ success: boolean; data: { chartData: ChartDataPoint[] } }>('/dashboard/chart-data'),
    
  suggestJars: () =>
    apiFetch<{ success: boolean; data: { jars: { name: string; percentage: number }[] } }>('/dashboard/suggest-jars'),
    
  setupBudget: (budgets: { categoryId: number; limit: number }[]) =>
    apiFetch<{ success: boolean; message: string }>('/dashboard/setup-budget', {
      method: 'POST',
      body: JSON.stringify({ budgets }),
    }),
};

// User API
export const userApi = {
  updateOnboarding: (monthlyIncome: number, expenses: { categoryName: string; amount: number; category?: string }[]) =>
    apiFetch<{ success: boolean; message: string }>('/user/onboarding', {
      method: 'PUT',
      body: JSON.stringify({ monthlyIncome, expenses }),
    }),
  
  getProfile: () =>
    apiFetch<{ success: boolean; data: UserProfile }>('/user/profile'),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiFetch<{ success: boolean; message: string; avatarUrl: string }>('/user/avatar', {
      method: 'POST',
      body: formData,
    });
  },
  
  getBadges: () =>
    apiFetch<{ 
      success: boolean; 
      data: { 
        xp: number; 
        level: number; 
        nextLevelXp: number; 
        badges: Array<{
          id: number;
          ma_danh_hieu: string;
          ten_danh_hieu: string;
          mo_ta: string;
          icon: string;
          loai: string;
          isUnlocked: boolean;
        }>
      } 
    }>('/user/badges'),
};

// Transactions API
export const transactionsApi = {
  create: (data: {
    title: string;
    amount: number;
    type: 'income' | 'expense' | 'thu_nhap' | 'chi_phi';
    categoryId?: number;
    note?: string;
    date?: string;
  }) =>
    apiFetch<{ success: boolean; data: { transaction: Transaction } }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (limit = 50) =>
    apiFetch<{ success: boolean; data: { transactions: Transaction[] } }>(
      `/transactions?limit=${limit}`
    ),

  delete: (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    }),

  emergencyWithdrawal: (amount: number, reason?: string) =>
    apiFetch<{ success: boolean; message: string; data: { transaction: Transaction } }>('/transactions/emergency-withdrawal', {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    }),
};

// AI API
export const aiApi = {
  scan: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    return apiFetch<{ success: boolean; data: ParsedAIResult }>('/ai/scan', {
      method: 'POST',
      body: formData, // apiFetch will need adjustment to NOT set Content-Type if body is FormData
      headers: {
        'Accept': 'application/json',
      }
    });
  },

  chat: (message: string, sessionId?: number) =>
    apiFetch<{ success: boolean; reply: string; data: ParsedAIResult | null; sessionId: number }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    }),

  getSessions: () =>
    apiFetch<{ success: boolean; data: { id: number; tieu_de: string; ngay_cap_nhat: string }[] }>('/ai/sessions'),

  createSession: (title?: string) =>
    apiFetch<{ success: boolean; data: { id: number; tieu_de: string } }>('/ai/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  deleteSession: (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/ai/sessions/${id}`, {
      method: 'DELETE',
    }),

  getHistory: (sessionId: number) =>
    apiFetch<{ success: boolean; data: { role: 'user' | 'assistant'; content: string; type: string; data: any; timestamp: string }[] }>(`/ai/history/${sessionId}`),
};

// Income API
export const incomeApi = {
  getSources: () =>
    apiFetch<{ success: boolean; data: { sources: IncomeSourceRecord[] } }>('/income/sources'),
  
  createSource: (data: {
    name: string;
    type: 'fixed' | 'variable' | 'scheduled';
    category: 'salary' | 'allowance' | 'other';
    expectedAmount?: number;
    hourlyRate?: number;
    schedule?: number[];
  }) =>
    apiFetch<{ success: boolean; data: { source: IncomeSourceRecord } }>('/income/sources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSource: (id: number) =>
    apiFetch<{ success: boolean; message: string }>(`/income/sources/${id}`, {
      method: 'DELETE',
    }),

  updateSource: (id: number, data: {
    name: string;
    type: 'fixed' | 'variable' | 'scheduled';
    category: 'salary' | 'allowance' | 'other';
    expectedAmount?: number;
    hourlyRate?: number;
    schedule?: number[];
  }) =>
    apiFetch<{ success: boolean; data: { source: IncomeSourceRecord } }>(`/income/sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export interface IncomeSourceRecord {
  id: number;
  ten_nguon: string;
  loai_nguon: 'fixed' | 'variable' | 'scheduled';
  loai_danh_muc: 'salary' | 'allowance' | 'other';
  so_tien_du_kien?: number;
  luong_theo_gio?: number;
  lich_lam_viec?: number[];
}

export interface ParsedAIResult {
  store?: string;
  amount: number;
  category: 'food' | 'transport' | 'shopping' | 'entertainment' | 'health' | 'education' | 'other';
  description: string;
  date: string;
}

// Types
export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  monthly_income: number;
  onboarding_completed: boolean;
  avatar_url?: string;
  currency?: string;
  xp: number;
  level: number;
  is_admin?: boolean;
}

export interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  remainingEmergency?: number;
  emergencyLimit?: number;
  netSavings: number;
  incomeChangePercent: number;
  isSurvivalMode: boolean;
  categoryDistribution?: { name: string; value: number; color: string }[];
  month: number;
  year: number;
}

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'thu_nhap' | 'chi_phi';
  note?: string;
  transaction_date: string;
  category_name: string;
  category_icon: string;
  category_color: string;
}

export interface Budget {
  id: number;
  limit_amount: number;
  spent_amount: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  usage_percent: number;
}

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  icon: string;
  color: string;
  status: 'active' | 'completed' | 'paused';
  progress_percent: number;
}

export interface ChartDataPoint {
  month: number;
  year: number;
  type: 'income' | 'expense' | 'thu_nhap' | 'chi_phi';
  total: number;
}

// Admin API
export const adminApi = {
  getStats: () =>
    apiFetch<{
      success: boolean;
      data: {
        totalUsers: number;
        totalTransactions: number;
        totalVolume: number;
        activityRate: number;
        userGrowth: number;
        latestUsers: any[];
        dailyStats: any[];
      }
    }>('/admin/stats'),
    
  getUsers: () =>
    apiFetch<{ success: boolean; data: { users: any[] } }>('/admin/users'),

  getDatabaseStats: () =>
    apiFetch<{ success: boolean; data: any }>('/admin/database'),

  getAIConfig: () =>
    apiFetch<{ success: boolean; data: any }>('/admin/ai-config'),

  updateAIConfig: (config: any) =>
    apiFetch<{ success: boolean; message: string }>('/admin/ai-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  getSettings: () =>
    apiFetch<{ success: boolean; data: any }>('/admin/settings'),

  updateSettings: (settings: any) =>
    apiFetch<{ success: boolean; message: string }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  toggleMaintenance: (payload: { enabled: boolean; message?: string; durationMinutes?: number }) =>
    apiFetch<{ success: boolean; message: string }>('/admin/maintenance', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUserRole: (userId: number, isAdmin: boolean) =>
    apiFetch<{ success: boolean; message: string }>('/admin/users/' + userId + '/role', {
      method: 'PUT',
      body: JSON.stringify({ isAdmin }),
    }),

  deleteUser: (userId: number) =>
    apiFetch<{ success: boolean; message: string }>('/admin/users/' + userId, {
      method: 'DELETE',
    }),
};
