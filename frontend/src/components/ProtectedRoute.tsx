import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
}

interface User {
  userId: string;
  email: string;
  roles: string[];
  orgId?: string;
  status?: string;
}

export const ProtectedRoute = ({ children, requiredRole, requiredRoles }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check user status - PENDING and DEACTIVATED users cannot access protected routes
  const userStatus = user.status || 'ACTIVE';
  if (userStatus === 'PENDING') {
    return <Navigate to="/login?status=pending" replace />;
  }
  if (userStatus === 'DEACTIVATED') {
    return <Navigate to="/login?status=deactivated" replace />;
  }

  const allowedRoles = requiredRoles ?? (requiredRole ? [requiredRole] : []);
  if (allowedRoles.length > 0 && !allowedRoles.some(role => user.roles.includes(role))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};