import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import socketService from '../services/socketService';

function Board() {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socketService.connect({
      url: 'ws://localhost:3000',
      token: localStorage.getItem('token'),
      sessionId,
      onMessage: (data) => {
        console.log('Recebido:', data);
        setMessages(prev => [...prev, data]);
      }
    });

    return () => socketService.disconnect();
  }, [sessionId]);

  return (
    <div>
      <h2>Quadro da sessão {sessionId}</h2>
      {messages.map((msg, index) => (
        <div key={index}>{JSON.stringify(msg)}</div>
      ))}
    </div>
  );
}

export default Board;
