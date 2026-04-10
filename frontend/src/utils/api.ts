const BASE_URL = 'http://localhost:5000/api';

function getToken(): string | null {
  return localStorage.getItem('nova_token');
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json() as T;
  
  if (!response.ok) {
    const errData = data as { message?: string };
    throw new Error(errData.message || `Lỗi HTTP ${response.status}`);
  }
  
  return data;
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
  
  getChartData: () =>
    apiFetch<{ success: boolean; data: { chartData: ChartDataPoint[] } }>('/dashboard/chart-data'),
};

// User API
export const userApi = {
  updateOnboarding: (monthlyIncome: number, expenses: { categoryName: string; amount: number }[]) =>
    apiFetch<{ success: boolean; message: string }>('/user/onboarding', {
      method: 'PUT',
      body: JSON.stringify({ monthlyIncome, expenses }),
    }),
  
  getProfile: () =>
    apiFetch<{ success: boolean; data: UserProfile }>('/user/profile'),
};

// Types
export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  monthly_income: number;
  onboarding_completed: boolean;
  avatar_url?: string;
  currency?: string;
}

export interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  incomeChangePercent: number;
  month: number;
  year: number;
}

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
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
  type: 'income' | 'expense';
  total: number;
}
