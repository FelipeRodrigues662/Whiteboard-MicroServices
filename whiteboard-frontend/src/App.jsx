import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import SessionList from './components/SessionList';
import Board from './components/Board';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/sessions" element={<SessionList />} />
        <Route path="/board/:sessionId" element={<Board />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
