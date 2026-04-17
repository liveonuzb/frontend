import { some, includes } from "lodash";
import React from "react";
import { Navigate } from "react-router";
import { useAuthStore } from "@/store";

/**
 * ProtectedRoute — rolga asoslangan himoya
 * @param {string[]} allowedRoles - ruxsat etilgan rollar ["ADMIN", "COACH", "USER"]
 * @param {string} redirectTo - ruxsat bo'lmaganda yo'naltirish
 * @param {React.ReactNode} children
 */
const ProtectedRoute = ({ allowedRoles = [], redirectTo = "/user", children }) => {
    const { roles, isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/auth/sign-in" replace />;
    }

    if (user?.passwordSetupRequired) {
        return <Navigate to="/auth/set-password" replace />;
    }

    // If no roles specified, allow all authenticated users
    if (allowedRoles.length === 0) {
        return children;
    }

    // Check if user has at least one of the allowed roles
    const hasAccess = some(allowedRoles, (role) => includes(roles, role));

    if (!hasAccess) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

export default ProtectedRoute;
