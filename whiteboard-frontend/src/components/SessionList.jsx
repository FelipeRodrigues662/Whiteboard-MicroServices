import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SessionList() {
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  const loadSessions = async () => {
    // Aqui você pode listar sessões do seu backend
  };

  const createSession = async () => {
    try {
      const res = await axios.post('http://localhost:4000/create-session');
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
