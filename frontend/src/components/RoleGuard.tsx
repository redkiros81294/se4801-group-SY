import { useAuth } from '../contexts/AuthContext';

interface RoleGuardProps {
  role?: string;
  roles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard = ({ role, roles, children, fallback = null }: RoleGuardProps) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  const allowedRoles = roles ?? (role ? [role] : []);
  if (allowedRoles.length > 0 && !allowedRoles.some(allowed => user.roles.includes(allowed))) {
    return fallback;
  }

  return children;
};