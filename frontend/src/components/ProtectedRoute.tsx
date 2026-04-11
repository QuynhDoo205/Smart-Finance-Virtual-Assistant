import { Navigate } from 'react-router-dom';
import authStore from '../store/authStore';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
