import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import socketService from '../services/socketService';

function Board() {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState([]);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const token = localStorage.getItem('token');

  console.log(token);

  // Conectar ao WebSocket e ouvir as mensagens
  useEffect(() => {
    socketService.connect({
      url: `ws://localhost:3000/?token=${token}`,  // Enviando o token na URL
      sessionId,
      onMessage: (data) => {
        console.log('Recebido:', data);
        setMessages((prev) => [...prev, data]);
      },
    });

    // Desconectar ao desmontar o componente
    return () => socketService.disconnect();
  }, [sessionId]);

  // Iniciar o desenho no mouse down
  const handleMouseDown = (e) => {
    isDrawing.current = true;
    // Atualiza a posição inicial para o clique no canvas
    lastPosition.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  // Desenhar ao mover o mouse
  const handleMouseMove = (e) => {
    if (isDrawing.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(lastPosition.current.x, lastPosition.current.y);
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);  // Usar offsetX e offsetY para canvas
      ctx.stroke();
      lastPosition.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };

      // Enviar dados para o servidor
      const drawingData = {
        x1: lastPosition.current.x,
        y1: lastPosition.current.y,
        x2: e.nativeEvent.offsetX,
        y2: e.nativeEvent.offsetY,
      };
      socketService.sendMessage(drawingData);
    }
  };

  // Parar de desenhar no mouse up
  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // Função para desenhar a linha quando recebida
  const drawLine = (lineData) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lineData.x1, lineData.y1);
    ctx.lineTo(lineData.x2, lineData.y2);
    ctx.stroke();
  };

  // Renderizando as mensagens (linhas desenhadas) no quadro
  useEffect(() => {
    messages.forEach(drawLine);
  }, [messages]);

  return (
    <div>
      <h2>Quadro da sessão {sessionId}</h2>
      <canvas
        ref={canvasRef}
        width="800"
        height="600"
        style={{ border: '1px solid black' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseUp}
      />
    </div>
  );
}

export default Board;
