import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function SessionList() {
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  const loadSessions = async () => {
    // Aqui você pode listar sessões do seu backend
  };

  const createSession = async () => {
    try {
      const res = await api.post('/create-session');
      navigate('/board/' + res.data.sessionId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Sessões</h2>
      <button onClick={createSession}>Criar nova sessão</button>
    </div>
  );
}

export default SessionList;
