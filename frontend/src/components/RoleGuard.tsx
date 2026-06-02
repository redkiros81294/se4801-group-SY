import { useAuth } from '../contexts/AuthContext';

interface RoleGuardProps {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard = ({ role, children, fallback = null }: RoleGuardProps) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  if (!user.roles.includes(role)) {
    return fallback;
  }

  return children;
};