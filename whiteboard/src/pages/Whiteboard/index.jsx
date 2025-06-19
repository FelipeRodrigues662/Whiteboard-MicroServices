import React, { useRef, useState, useEffect } from 'react';
import {
    Tooltip,
    Button,
    Row,
    Col,
    Avatar,
    List,
    Slider,
    Divider,
    Modal,
    message,
    Typography,
    Input,
    Dropdown
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    SaveOutlined,
    UndoOutlined,
    UserOutlined,
    LineOutlined,
    BorderOutlined,
    ArrowLeftOutlined,
    ShareAltOutlined,
    HighlightOutlined,
    DownloadOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { fabric } from 'fabric';
import { jsPDF } from 'jspdf';
import socketService from '../../services/socketService';
import './index.css';

message.config({
    top: 100,
    duration: 2,
    maxCount: 3,
});

const colors = [
    '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#00ffff', '#ff00ff', '#c0c0c0', '#808080'
];

// Variáveis globais para indicadores/cursor
const userIndicators = {};
const userCursors = {};

const Whiteboard = () => {
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const [color, setColor] = useState('#000000');
    const [brushWidth, setBrushWidth] = useState(5);
    const [mode, setMode] = useState('pen');
    const [showSidebar, setShowSidebar] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);
    const lastPosition = useRef({ x: 0, y: 0 });
    const [boardName, setBoardName] = useState(localStorage.getItem('whiteboardName') || 'Meu Board');
    const [isEditingName, setIsEditingName] = useState(false);
    const token = localStorage.getItem('token');
    const urlCoordinator = import.meta.env.VITE_URL_SESSION;
    const [isEraser, setIsEraser] = useState(false);
    
    const [connectedUsers] = useState([
        { id: 1, name: 'João Silva', avatar: 'J' },
        { id: 2, name: 'Maria Souza', avatar: 'M' },
        { id: 3, name: 'Carlos Oliveira', avatar: 'C' },
    ]);

    // Configura o aviso antes de recarregar
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = 'Seu trabalho no whiteboard será perdido. Tem certeza que deseja sair?';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Função para obter o nome do usuário do token
    const getUserNameFromToken = () => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.name || payload.email || 'Usuário';
        } catch {
            return 'Usuário';
        }
    };

    // Função para mostrar/atualizar indicador
    function showUserIndicator(userId, userName, x, y) {
        if (userIndicators[userId]) {
            // Atualiza posição e reinicia timeout
            userIndicators[userId].style.left = `${x}px`;
            userIndicators[userId].style.top = `${y - 50}px`;
            userIndicators[userId].classList.add('visible');
            clearTimeout(userIndicators[userId].timeout);
        } else {
            const indicator = document.createElement('div');
            indicator.className = 'user-drawing-indicator visible';
            indicator.innerHTML = `
                <span class="user-avatar">${userName.charAt(0).toUpperCase()}</span>
                <span>${userName}</span>
                <span class="drawing-status"></span>
            `;
            indicator.style.left = `${x}px`;
            indicator.style.top = `${y - 50}px`;
            document.querySelector('.board-container').appendChild(indicator);
            userIndicators[userId] = indicator;
        }
        // Timeout para remover
        userIndicators[userId].timeout = setTimeout(() => {
            removeUserIndicator(userId);
        }, 1200);
    }

    function removeUserIndicator(userId) {
        if (userIndicators[userId]) {
            userIndicators[userId].classList.remove('visible');
            setTimeout(() => {
                if (userIndicators[userId] && userIndicators[userId].parentNode) {
                    userIndicators[userId].parentNode.removeChild(userIndicators[userId]);
                }
                delete userIndicators[userId];
            }, 300);
        }
    }

    // Função para mostrar/atualizar cursor
    function showUserCursor(userId, x, y) {
        if (userCursors[userId]) {
            userCursors[userId].style.left = `${x}px`;
            userCursors[userId].style.top = `${y}px`;
            userCursors[userId].classList.add('visible');
        } else {
            const cursor = document.createElement('div');
            cursor.className = 'drawing-cursor visible';
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
            document.querySelector('.board-container').appendChild(cursor);
            userCursors[userId] = cursor;
        }
        // Timeout para remover
        if (userCursors[userId].timeout) clearTimeout(userCursors[userId].timeout);
        userCursors[userId].timeout = setTimeout(() => {
            removeUserCursor(userId);
        }, 1200);
    }

    function removeUserCursor(userId) {
        if (userCursors[userId]) {
            userCursors[userId].classList.remove('visible');
            setTimeout(() => {
                if (userCursors[userId] && userCursors[userId].parentNode) {
                    userCursors[userId].parentNode.removeChild(userCursors[userId]);
                }
                delete userCursors[userId];
            }, 200);
        }
    }

    // Inicializa o canvas e carrega dados salvos
    useEffect(() => {
        const canvasElement = document.getElementById('canvas');
        const canvas = new fabric.Canvas(canvasElement, {
            isDrawingMode: true,
            backgroundColor: '#fff',
            renderOnAddRemove: true,
            enableRetinaScaling: false,
            selection: false
        });
        canvasRef.current = canvas;

        // Configura o pincel para ser mais suave
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = brushWidth;
        canvas.freeDrawingBrush.strokeLineCap = 'round';
        canvas.freeDrawingBrush.strokeLineJoin = 'round';
        canvas.freeDrawingBrush.strokeMiterLimit = 10;

        // Carrega do localStorage se existir
        const savedData = localStorage.getItem('whiteboardData');
        if (savedData) {
            canvas.loadFromJSON(JSON.parse(savedData), () => {
                canvas.getObjects().forEach(obj => {
                    obj.selectable = false;
                    obj.evented = false;
                });
                canvas.renderAll();
                message.success('Desenho anterior carregado!');
            });
        }

        // Ajusta o tamanho do canvas
        const resizeCanvas = () => {
            const container = document.querySelector('.board-container');
            const width = container.offsetWidth;
            const height = container.offsetHeight;
            
            // Define o tamanho do canvas
            canvas.setWidth(width);
            canvas.setHeight(height);
            
            // Ajusta a escala para 1:1
            canvas.setZoom(1);
            
            // Centraliza o canvas
            canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
            
            canvas.renderAll();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Conecta ao WebSocket
        const userId = JSON.parse(atob(token.split('.')[1])).userId;
        const userName = getUserNameFromToken();
        
        socketService.connect({
            url: `${urlCoordinator}?token=${token}`,
            sessionId,
            userId,
            userName,
            onMessage: (data) => {
                try {
                    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

                    if (!parsed || !parsed.type || !parsed.data) {
                        console.warn('Mensagem recebida com formato inválido:', data);
                        return;
                    }

                    const { type, data: eventData, userId: senderUserId, userName: senderUserName } = parsed;

                    switch (type) {
                        case 'draw': {
                            const { x1, y1, x2, y2, color: lineColor, width } = eventData;
                            const line = new fabric.Line([x1, y1, x2, y2], {
                                stroke: lineColor || color,
                                strokeWidth: width || brushWidth,
                                selectable: false,
                                evented: false,
                                strokeLineCap: 'round',
                                strokeLineJoin: 'round'
                            });
                            canvas.add(line);
                            canvas.renderAll();
                            
                            // Atualizar indicadores de usuário
                            if (senderUserId && senderUserId !== userId) {
                                // Criar ou atualizar cursor
                                showUserCursor(senderUserId, x2, y2);
                                
                                // Criar ou atualizar indicador
                                showUserIndicator(senderUserId, senderUserName || 'Usuário', x2, y2);
                            }
                            break;
                        }

                        case 'clear':
                            canvas.clear();
                            canvas.backgroundColor = '#fff';
                            canvas.getObjects().forEach(obj => {
                                obj.selectable = false;
                                obj.evented = false;
                            });
                            canvas.discardActiveObject();
                            canvas.renderAll();
                            break;

                        case 'undo':
                            if (canvas._objects.length > 0) {
                                const removedObject = canvas._objects.pop();
                                canvas.remove(removedObject);
                                canvas.getObjects().forEach(obj => {
                                    obj.selectable = false;
                                    obj.evented = false;
                                });
                                canvas.discardActiveObject();
                                canvas.renderAll();
                            }
                            break;

                        case 'error':
                            message.error(eventData.message);
                            break;

                        default:
                            console.warn('Tipo de mensagem desconhecido:', type);
                    }
                } catch (e) {
                    console.error('Erro ao processar mensagem recebida:', e);
                }
            },
        });

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.dispose();
            socketService.disconnect();
            
            // Limpar todos os indicadores
            Object.keys(userIndicators).forEach(removeUserIndicator);
            Object.keys(userCursors).forEach(removeUserCursor);
        };
    }, [sessionId, token]);

    // Adiciona o evento de clique para remover objetos
    useEffect(() => {
        if (canvasRef.current) {
            const handleMouseDown = (options) => {
                if (isEraser) {
                    isDrawing.current = true;
                    const pointer = canvasRef.current.getPointer(options.e);
                    lastPosition.current = { 
                        x: pointer.x, 
                        y: pointer.y 
                    };
                }
            };

            const handleMouseMove = (options) => {
                if (isEraser && isDrawing.current) {
                    const pointer = canvasRef.current.getPointer(options.e);
                    const currentPosition = { x: pointer.x, y: pointer.y };
                    
                    // Envia o evento de draw com cor branca (apagar)
                    socketService.sendMessage({
                        sessionId,
                        type: 'draw',
                        data: {
                            x1: lastPosition.current.x,
                            y1: lastPosition.current.y,
                            x2: currentPosition.x,
                            y2: currentPosition.y,
                            color: '#ffffff', // Cor branca para "apagar"
                            width: brushWidth * 2 // Largura maior para a borracha
                        }
                    });

                    lastPosition.current = currentPosition;
                }
            };

            const handleMouseUp = () => {
                isDrawing.current = false;
            };

            // Adiciona um indicador visual da borracha
            const handleMouseMoveWithIndicator = (options) => {
                if (isEraser) {
                    const pointer = canvasRef.current.getPointer(options.e);
                    
                    // Remove o indicador anterior se existir
                    const oldIndicator = canvasRef.current.getObjects().find(obj => obj.isEraserIndicator);
                    if (oldIndicator) {
                        canvasRef.current.remove(oldIndicator);
                    }

                    // Cria um novo indicador circular
                    const indicator = new fabric.Circle({
                        left: pointer.x - brushWidth,
                        top: pointer.y - brushWidth,
                        radius: brushWidth,
                        fill: 'rgba(255, 255, 255, 0.3)',
                        stroke: '#000',
                        strokeWidth: 1,
                        selectable: false,
                        evented: false,
                        isEraserIndicator: true
                    });

                    canvasRef.current.add(indicator);
                    canvasRef.current.getObjects().forEach(o => {
                        o.selectable = false;
                        o.evented = false;
                    });
                    canvasRef.current.discardActiveObject();
                    canvasRef.current.renderAll();
                }
            };

            canvasRef.current.on('mouse:down', handleMouseDown);
            canvasRef.current.on('mouse:move', handleMouseMove);
            canvasRef.current.on('mouse:move', handleMouseMoveWithIndicator);
            canvasRef.current.on('mouse:up', handleMouseUp);
            canvasRef.current.on('mouse:out', handleMouseUp);

            return () => {
                canvasRef.current.off('mouse:down', handleMouseDown);
                canvasRef.current.off('mouse:move', handleMouseMove);
                canvasRef.current.off('mouse:move', handleMouseMoveWithIndicator);
                canvasRef.current.off('mouse:up', handleMouseUp);
                canvasRef.current.off('mouse:out', handleMouseUp);
            };
        }
    }, [sessionId, isEraser, brushWidth]);

    // Modifica o evento de desenho para incluir o type
    useEffect(() => {
        if (canvasRef.current) {
            const handleMouseDown = (options) => {
                if (!isEraser) {
                    isDrawing.current = true;
                    const pointer = canvasRef.current.getPointer(options.e);
                    lastPosition.current = { 
                        x: pointer.x, 
                        y: pointer.y 
                    };
                }
            };

            const handleMouseMove = (options) => {
                if (isDrawing.current && !isEraser) {
                    const pointer = canvasRef.current.getPointer(options.e);
                    const currentPosition = { 
                        x: pointer.x, 
                        y: pointer.y 
                    };

                    // NÃO desenhe localmente aqui!
                    // Apenas envie o evento para o servidor
                    socketService.sendMessage({
                        sessionId,
                        type: 'draw',
                        data: {
                            x1: lastPosition.current.x,
                            y1: lastPosition.current.y,
                            x2: currentPosition.x,
                            y2: currentPosition.y,
                            color: color,
                            width: brushWidth
                        }
                    });

                    lastPosition.current = currentPosition;
                }
            };

            const handleMouseUp = () => {
                isDrawing.current = false;
            };

            canvasRef.current.on('mouse:down', handleMouseDown);
            canvasRef.current.on('mouse:move', handleMouseMove);
            canvasRef.current.on('mouse:up', handleMouseUp);
            canvasRef.current.on('mouse:out', handleMouseUp);

            return () => {
                canvasRef.current.off('mouse:down', handleMouseDown);
                canvasRef.current.off('mouse:move', handleMouseMove);
                canvasRef.current.off('mouse:up', handleMouseUp);
                canvasRef.current.off('mouse:out', handleMouseUp);
            };
        }
    }, [sessionId, color, brushWidth, isEraser]);

    // Atualiza o pincel quando a cor ou largura muda
    useEffect(() => {
        if (canvasRef.current) {
            if (isEraser) {
                canvasRef.current.freeDrawingBrush.color = '#fff';
                canvasRef.current.freeDrawingBrush.width = brushWidth * 2;
            } else {
                canvasRef.current.freeDrawingBrush.color = color;
                canvasRef.current.freeDrawingBrush.width = brushWidth;
            }
        }
    }, [color, brushWidth, isEraser]);

    // Atualiza o modo de desenho
    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.isDrawingMode = mode === 'pen';
            canvasRef.current.selection = mode === 'select';
        }
    }, [mode]);

    const handleClear = () => {
        try {
            canvasRef.current.clear();
            canvasRef.current.backgroundColor = '#fff';
            canvasRef.current.getObjects().forEach(o => {
                o.selectable = false;
                o.evented = false;
            });
            canvasRef.current.discardActiveObject();
            canvasRef.current.renderAll();

            socketService.sendMessage({
                sessionId,
                type: 'clear',
                data: {}
            });

            localStorage.removeItem('whiteboardData');
            localStorage.removeItem('drawingCoordinates');
            messageApi.open({
                type: 'success',
                content: 'Limpeza efetuada com sucesso',
            });
        } catch (error) {
            console.error('Erro ao limpar o canvas:', error);
            messageApi.open({
                type: 'error',
                content: 'Erro ao fazer limpeza',
            });
        }
    };

    const handleShare = () => {
        // Obtém a URL atual
        const currentUrl = window.location.href;
        
        // Copia a URL para a área de transferência
        navigator.clipboard.writeText(currentUrl)
            .then(() => {
                messageApi.open({
                    type: 'success',
                    content: 'Link copiado com sucesso, compartilhe com seus amigos!',
                });
            })
            .catch(() => {
                messageApi.open({
                    type: 'error',
                    content: 'Erro ao copiar o link',
                });
            });
    };

    const handleSave = () => {
        if (canvasRef.current) {
            try {
                // Extrai os dados formatados
                // eslint-disable-next-line no-unused-vars
                const drawingData = canvasRef.current.getObjects().map(obj => {
                    // ... (código anterior de extração de dados)
                }).filter(Boolean);

                // Salva no localStorage
                localStorage.setItem('whiteboardData', JSON.stringify(canvasRef.current.toJSON()));
                localStorage.setItem('drawingCoordinates', JSON.stringify(drawingData));

                console.log('Coordenadas e cores salvas:', drawingData);
                messageApi.open({
                    type: 'success',
                    content: 'Seu Board foi salvo com sucesso',
                });
            } catch (error) {
                console.error('Erro ao salvar:', error);
                messageApi.open({
                    type: 'error',
                    content: 'Não foi possível salvar o Board',
                });
            }
        }
    };

    const exportAsImage = async (format = 'png') => {
        try {
            const canvas = document.getElementById('canvas');
            if (!canvas) {
                messageApi.error('Canvas não encontrado');
                return;
            }

            const dataURL = canvas.toDataURL(`image/${format}`);
            const link = document.createElement('a');
            link.download = `whiteboard-${boardName}-${new Date().toISOString().slice(0, 10)}.${format}`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            messageApi.success(`Quadro exportado como ${format.toUpperCase()} com sucesso!`);
        } catch (error) {
            console.error('Erro ao exportar imagem:', error);
            messageApi.error('Erro ao exportar imagem');
        }
    };

    const exportAsPDF = async () => {
        try {
            const canvas = document.getElementById('canvas');
            if (!canvas) {
                messageApi.error('Canvas não encontrado');
                return;
            }

            // Captura o canvas como imagem
            const dataURL = canvas.toDataURL('image/png');
            
            // Cria o PDF
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const imgWidth = 297; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(dataURL, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`whiteboard-${boardName}-${new Date().toISOString().slice(0, 10)}.pdf`);

            messageApi.success('Quadro exportado como PDF com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            messageApi.error('Erro ao exportar PDF');
        }
    };

    const handleExport = ({ key }) => {
        switch (key) {
            case 'png':
                exportAsImage('png');
                break;
            case 'jpg':
                exportAsImage('jpeg');
                break;
            case 'pdf':
                exportAsPDF();
                break;
            default:
                break;
        }
    };

    const handleSaveName = () => {
        localStorage.setItem('whiteboardName', boardName);
        localStorage.setItem('whiteboardLastModified', new Date().toISOString());
        setIsEditingName(false);
        messageApi.success('Nome do board atualizado!');
    };

    return (
        <div className="app-container">
            {contextHolder}
            <div className="gradient-overlay"></div>

            <div className="whiteboard-wrapper">
                <div className="toolbar">
                    <Row gutter={[8, 8]} justify="start" align="middle">
                        <Col>
                            <Tooltip title="Voltar">
                                <Button
                                    type="text"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => navigate('/room')}
                                    className="back-button"
                                />
                            </Tooltip>
                        </Col>
                        <Col>
                            {isEditingName ? (
                                <Input
                                    value={boardName}
                                    onChange={(e) => setBoardName(e.target.value)}
                                    onPressEnter={handleSaveName}
                                    onBlur={handleSaveName}
                                    autoFocus
                                    style={{ width: 200 }}
                                />
                            ) : (
                                <Typography.Text
                                    strong
                                    style={{ color: '#fff', cursor: 'pointer' }}
                                    onClick={() => setIsEditingName(true)}
                                >
                                    {boardName}
                                </Typography.Text>
                            )}
                        </Col>

                        <Col>
                            <Divider type="vertical" className="tool-divider" />
                        </Col>

                        <Col>
                            <Tooltip title="Salvar">
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={handleSave}
                                    className="save-button"
                                />
                            </Tooltip>
                        </Col>

                        <Col>
                            <Divider type="vertical" className="tool-divider" />
                        </Col>

                        <Col>
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'png',
                                            label: 'Exportar como PNG',
                                            icon: <DownloadOutlined />
                                        },
                                        {
                                            key: 'jpg',
                                            label: 'Exportar como JPG',
                                            icon: <DownloadOutlined />
                                        },
                                        {
                                            key: 'pdf',
                                            label: 'Exportar como PDF',
                                            icon: <DownloadOutlined />
                                        }
                                    ],
                                    onClick: handleExport,
                                    className: 'export-dropdown-menu'
                                }}
                                placement="bottomRight"
                                overlayStyle={{
                                    backgroundColor: 'rgba(20, 20, 20, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                                }}
                            >
                                <Tooltip title="Exportar">
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        className="tool-button"
                                    />
                                </Tooltip>
                            </Dropdown>
                        </Col>

                        <Col>
                            <Tooltip title="Usuários">
                                <Button
                                    type={showSidebar ? 'primary' : 'text'}
                                    icon={<UserOutlined />}
                                    onClick={() => setShowSidebar(!showSidebar)}
                                    className="sidebar-toggle"
                                />
                            </Tooltip>
                        </Col>

                        <Col>
                            <Tooltip title="Limpar">
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleClear}
                                    className="tool-button"
                                />
                            </Tooltip>
                        </Col>

                        <Col>
                            <Tooltip title="Compartilhar">
                                <Button
                                    type="text"
                                    danger
                                    icon={<ShareAltOutlined />}
                                    onClick={handleShare}
                                    className="tool-button"
                                />
                            </Tooltip>
                        </Col>
                        
                    </Row>

                    <div className="tool-options">
                        <Col>
                            <Tooltip title="Caneta">
                                <Button
                                    type={mode === 'pen' && !isEraser ? 'primary' : 'text'}
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                        setMode('pen');
                                        setIsEraser(false);
                                        if (canvasRef.current) {
                                            canvasRef.current.isDrawingMode = true;
                                            canvasRef.current.freeDrawingBrush.color = color;
                                            canvasRef.current.freeDrawingBrush.width = brushWidth;
                                            canvasRef.current.selection = false;
                                        }
                                    }}
                                    className="tool-button"
                                />
                            </Tooltip>
                        </Col>

                        <Col>
                            <Tooltip title="Borracha">
                                <Button
                                    type={isEraser ? 'primary' : 'text'}
                                    icon={<HighlightOutlined />}
                                    onClick={() => {
                                        setIsEraser(!isEraser);
                                        setMode('pen');
                                        if (canvasRef.current) {
                                            canvasRef.current.isDrawingMode = true;
                                            canvasRef.current.freeDrawingBrush.color = '#fff';
                                            canvasRef.current.freeDrawingBrush.width = brushWidth * 2;
                                            canvasRef.current.selection = false;
                                        }
                                    }}
                                    className="tool-button"
                                />
                            </Tooltip>
                        </Col>

                        <Col>
                            <Slider
                                min={1}
                                max={20}
                                value={brushWidth}
                                onChange={setBrushWidth}
                                className="brush-slider"
                                tooltip={{ formatter: value => `${value}px` }}
                            />
                        </Col>

                        <Col>
                            <Divider type="vertical" className="tool-divider" />
                        </Col>

                        <div className="color-picker">
                            {colors.map((c, i) => (
                                <div
                                    key={i}
                                    className="color-option"
                                    style={{
                                        backgroundColor: c,
                                        border: color === c ? '2px solid #9c62ee' : '1px solid #444'
                                    }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>


                    </div>
                </div>

                <div className="board-container">
                    <canvas 
                        id="canvas"
                        width="800"
                        height="600"
                        style={{ border: '1px solid black' }}
                    />
                </div>

                {/* Sidebar flutuante */}
                <div className={`user-sidebar ${showSidebar ? 'visible' : ''}`}>
                    <div className="user-list-container">
                        <h3 className="sidebar-title">Usuários Conectados</h3>
                        <List
                            dataSource={connectedUsers}
                            renderItem={user => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar>{user.avatar}</Avatar>}
                                        title={<span className="user-name">{user.name}</span>}
                                        description={<span className="user-status">Online</span>}
                                    />
                                </List.Item>
                            )}
                        />
                            <Tooltip title="Compartilhar">
                                <Button
                                    type="primary"
                                    icon={<ShareAltOutlined />}
                                    onClick={handleShare}
                                    className="share-button"
                                    style={{
                                        backgroundColor: '#9c62ee',
                                        borderColor: '#9c62ee',
                                        color: '#fff',
                                        width: '100%',
                                        marginTop: '20px'
                                    }}
                                >
                                    Compartilhar
                                </Button>
                            </Tooltip>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Whiteboard;