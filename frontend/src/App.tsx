import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './store/themeStore'; // initialize theme on load
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

function App() {
  return (
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
          
          {/* Subtle noise texture overlay for realism */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
        
        <div className="relative z-10 min-h-screen flex flex-col">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<OnboardingSurvey />} />
            
            {/* Main App Routes */}
            <Route path="/app" element={<MainLayout />}>
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
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
