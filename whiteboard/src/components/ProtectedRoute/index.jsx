import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = sessionStorage.getItem('token');

    if (!token) {
        // Redireciona para a página de login se não houver token
        return <Navigate to="/login" replace />;
    }

    // Se houver token, renderiza o componente filho
    return children;
};

export default ProtectedRoute;