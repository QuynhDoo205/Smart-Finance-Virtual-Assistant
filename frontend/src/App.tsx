import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { motion } from 'framer-motion';
import './store/themeStore'; // initialize theme on load
import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import OnboardingSurvey from './pages/Onboarding/OnboardingSurvey';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import IncomeManager from './pages/Income/IncomeManager';
import Profile from './pages/Profile/Profile';
import BudgetManager from './pages/Budget/BudgetManager';
import Chatbot from './pages/Chat/Chatbot';
import Badges from './pages/Gamification/Badges';
import InsightsGoals from './pages/Insights/InsightsGoals';
import CrisisManager from './pages/Crisis/CrisisManager';
import ExpenseTracker from './pages/Expense/ExpenseTracker';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUserList from './pages/Admin/AdminUserList';
import AdminDatabase from './pages/Admin/AdminDatabase';
import AdminAIConfig from './pages/Admin/AdminAIConfig';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Maintenance from './pages/Maintenance';
import FloatingAI from './components/ai/FloatingAI';

function App() {
  const GOOGLE_CLIENT_ID = '509981311672-d3g4gkko1ir0qmritmdpvquh01gvnvso.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--theme-bg-deep)', transition: 'background 0.4s ease' }}>
        {/* Dynamic Deep Space / Cyberpunk Background */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none mix-blend-screen">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[120px]" 
            style={{ background: 'var(--theme-neon-primary)', opacity: 0.12 }}
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full blur-[130px]" 
            style={{ background: 'var(--theme-neon-accent)', opacity: 0.1 }}
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            className="absolute -bottom-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full blur-[100px]" 
            style={{ background: 'var(--theme-ai-color)', opacity: 0.1 }}
          />
          
          {/* Subtle noise texture overlay for realism (using local CSS instead of external SVG to prevent 403) */}
          <div className="absolute inset-0 opacity-[0.03] bg-white mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
        </div>
        
        <div className="relative z-10 min-h-screen flex flex-col">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<OnboardingSurvey />} />
            <Route path="/maintenance" element={<Maintenance />} />
            
            {/* Protected Main App Routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="income" element={<IncomeManager />} />
              <Route path="budget" element={<BudgetManager />} />
              <Route path="chat" element={<Chatbot />} />
              <Route path="badges" element={<Badges />} />
              <Route path="insights" element={<InsightsGoals />} />
              <Route path="crisis" element={<CrisisManager />} />
              <Route path="expense" element={<ExpenseTracker />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Dedicated Admin Portal Routes */}
            <Route path="/app/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUserList />} />
              <Route path="database" element={<AdminDatabase />} />
              <Route path="ai-config" element={<AdminAIConfig />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
          <FloatingAI />
        </div>
      </div>
    </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
