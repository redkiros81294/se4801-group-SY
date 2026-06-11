import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
}

export const ProtectedRoute = ({ children, requiredRole, requiredRoles }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowedRoles = requiredRoles ?? (requiredRole ? [requiredRole] : []);
  if (allowedRoles.length > 0 && !allowedRoles.some(role => user.roles.includes(role))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};