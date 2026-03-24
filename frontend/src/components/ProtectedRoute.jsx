import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.rol !== requiredRole) {
        // Redirigir según el rol si intenta acceder a un área no permitida
        return <Navigate to={user.rol === 'ADMIN' ? '/admin' : '/voter'} replace />;
    }

    return children;
};

export default ProtectedRoute;
