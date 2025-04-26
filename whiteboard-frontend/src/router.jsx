import { createBrowserRouter } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import SessionList from './components/SessionList';
import Board from './components/Board';

const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/sessions', element: <SessionList /> },
  { path: '/board/:sessionId', element: <Board /> }
]);

export default router;
