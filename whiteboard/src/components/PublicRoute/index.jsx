import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    if (token) {
        // Se estiver logado, redireciona para a página de room
        return <Navigate to="/room" replace />;
    }

    // Se não estiver logado, renderiza o componente filho
    return children;
};

export default PublicRoute;