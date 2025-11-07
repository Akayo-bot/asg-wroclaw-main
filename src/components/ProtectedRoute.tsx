import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasAdminAccess, hasRole } from '@/utils/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAuth = true,
    allowedRoles
}) => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (requireAuth && !user) {
        const returnUrl = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/auth?returnUrl=${returnUrl}`} replace />;
    }

    if (allowedRoles && profile) {
        const userRole = profile.role;
        const hasRequiredRole = allowedRoles.some(role => {
            if (role === 'admin') return hasAdminAccess(userRole);
            return hasRole(userRole, role);
        });

        if (!hasRequiredRole) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};