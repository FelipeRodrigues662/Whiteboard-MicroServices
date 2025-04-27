import { useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import socketService from '../services/socketService';

function Board() {
  const { sessionId } = useParams();
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const token = localStorage.getItem('token');

  // Função para desenhar a linha no canvas
  const drawLine = (lineData) => {
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(lineData.x1, lineData.y1);
    ctx.lineTo(lineData.x2, lineData.y2);
    ctx.stroke();
  };

  // Conectar ao WebSocket e ouvir as mensagens
  useEffect(() => {
    socketService.connect({
      url: `ws://localhost:3000/?token=${token}`,
      sessionId,
      onMessage: (data) => {
        console.log('Mensagem recebida:', data);

        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;

          if (parsed.type === 'draw') {
            console.log('Desenhando linha:', parsed.payload); // Verificando se os dados são recebidos corretamente
            drawLine(parsed.payload); // Desenhar diretamente no canvas quando a mensagem for do tipo "draw"
          } else if (parsed.type === 'error') {
            console.error('Erro recebido do servidor:', parsed.payload.message);
          }
        } catch (e) {
          console.error('Erro ao processar mensagem recebida:', e.message);
        }
      },
    });

    return () => socketService.disconnect();
  }, [sessionId, token]);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    lastPosition.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const handleMouseMove = (e) => {
    if (isDrawing.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      const currentPosition = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };

      ctx.beginPath();
      ctx.moveTo(lastPosition.current.x, lastPosition.current.y);
      ctx.lineTo(currentPosition.x, currentPosition.y);
      ctx.stroke();

      const drawingData = {
        x1: lastPosition.current.x,
        y1: lastPosition.current.y,
        x2: currentPosition.x,
        y2: currentPosition.y,
      };

      // Enviar dados para o servidor para que outros usuários vejam o desenho
      socketService.sendMessage({ sessionId, data: drawingData });

      lastPosition.current = currentPosition;
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

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
