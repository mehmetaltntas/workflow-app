import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (isAuthenticated) {
    // If user is already authenticated, redirect to the page they came from
    // or default to /home
    const from = (location.state as { from?: string })?.from || '/home';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
