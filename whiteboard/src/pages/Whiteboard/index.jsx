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
    Input
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    SaveOutlined,
    UndoOutlined,
    UserOutlined,
    LineOutlined,
    BorderOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { fabric } from 'fabric';
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

    // Inicializa o canvas e carrega dados salvos
    useEffect(() => {
        const canvasElement = document.getElementById('canvas');
        const canvas = new fabric.Canvas(canvasElement, {
            isDrawingMode: true,
            backgroundColor: '#fff'
        });
        canvasRef.current = canvas;

        // Carrega do localStorage se existir
        const savedData = localStorage.getItem('whiteboardData');
        if (savedData) {
            canvas.loadFromJSON(JSON.parse(savedData), () => {
                canvas.renderAll();
                message.success('Desenho anterior carregado!');
            });
        }

        // Configura o pincel
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = brushWidth;

        // Ajusta o tamanho do canvas
        const resizeCanvas = () => {
            const container = document.querySelector('.board-container');
            canvas.setWidth(container.offsetWidth);
            canvas.setHeight(container.offsetHeight);
            canvas.renderAll();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Conecta ao WebSocket
        socketService.connect({
            url: `ws://localhost:3000/?token=${token}`,
            sessionId,
            onMessage: (data) => {
                try {
                    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

                    if (parsed.type === 'draw') {
                        const { x1, y1, x2, y2, color: lineColor, width } = parsed.payload;
                        const ctx = canvas.getContext('2d');
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.strokeStyle = lineColor || color;
                        ctx.lineWidth = width || brushWidth;
                        ctx.stroke();
                    } else if (parsed.type === 'error') {
                        message.error(parsed.payload.message);
                    }
                } catch (e) {
                    console.error('Erro ao processar mensagem recebida:', e.message);
                }
            },
        });

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.dispose();
            socketService.disconnect();
        };
    }, [sessionId, token]);

    // Modifica o evento de desenho para enviar dados via WebSocket
    useEffect(() => {
        if (canvasRef.current) {
            const handleMouseDown = (options) => {
                isDrawing.current = true;
                lastPosition.current = { 
                    x: options.e.offsetX, 
                    y: options.e.offsetY 
                };
            };

            const handleMouseMove = (options) => {
                if (isDrawing.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (!ctx) return;
                    const currentPosition = { 
                        x: options.e.offsetX, 
                        y: options.e.offsetY 
                    };

                    ctx.beginPath();
                    ctx.moveTo(lastPosition.current.x, lastPosition.current.y);
                    ctx.lineTo(currentPosition.x, currentPosition.y);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = brushWidth;
                    ctx.stroke();

                    const drawingData = {
                        x1: lastPosition.current.x,
                        y1: lastPosition.current.y,
                        x2: currentPosition.x,
                        y2: currentPosition.y,
                        color: color,
                        width: brushWidth
                    };

                    socketService.sendMessage({
                        sessionId,
                        data: drawingData
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
    }, [sessionId, color, brushWidth]);

    // Atualiza o pincel quando a cor ou largura muda
    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.freeDrawingBrush.color = color;
            canvasRef.current.freeDrawingBrush.width = brushWidth;
        }
    }, [color, brushWidth]);

    // Atualiza o modo de desenho
    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.isDrawingMode = mode === 'pen';
            canvasRef.current.selection = mode === 'select';
        }
    }, [mode]);

    const handleClear = () => {
        // Alert.confirm({
        //     title: 'Limpar whiteboard',
        //     content: 'Tem certeza que deseja apagar tudo?',
        //     okText: 'Sim',
        //     cancelText: 'Cancelar',
        //     onOk: () => {
        //         if (canvasRef.current) {

        //         }
        //     },
        //     onCancel: () => {
        //         message.info('Operação cancelada');
        //     }
        // });
        try {
            // Limpa completamente o canvas
            canvasRef.current.clear();
            canvasRef.current.backgroundColor = '#fff';
            canvasRef.current.renderAll();
            // Remove os dados salvos
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

    const handleSaveName = () => {
        localStorage.setItem('whiteboardName', boardName);
        localStorage.setItem('whiteboardLastModified', new Date().toISOString());
        setIsEditingName(false);
        messageApi.success('Nome do board atualizado!');
    };

    const handleUndo = () => {
        if (canvasRef.current && canvasRef.current._objects.length > 0) {
            canvasRef.current.remove(canvasRef.current._objects.pop());
            canvasRef.current.renderAll();
        }
    };

    const addShape = (type) => {
        if (!canvasRef.current) return;

        setMode('select');
        let shape;

        switch (type) {
            case 'line':
                shape = new fabric.Line([50, 50, 200, 50], {
                    stroke: color,
                    strokeWidth: brushWidth,
                    selectable: true,
                    strokeLineCap: 'round',
                    strokeLineJoin: 'round'
                });
                break;
            case 'rect':
                shape = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: 'transparent',
                    stroke: color,
                    strokeWidth: brushWidth,
                    selectable: true
                });
                break;
            default:
                return;
        }

        canvasRef.current.add(shape);
        canvasRef.current.setActiveObject(shape);
        canvasRef.current.renderAll();
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
                            <Tooltip title="Desfazer">
                                <Button
                                    type="text"
                                    icon={<UndoOutlined />}
                                    onClick={handleUndo}
                                    className="tool-button"
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
                            <Tooltip title="Salvar">
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={handleSave}
                                    className="save-button"
                                />
                            </Tooltip>
                        </Col>
                    </Row>

                    <div className="tool-options">
                        <Col>
                            <Tooltip title="Caneta">
                                <Button
                                    type={mode === 'pen' ? 'primary' : 'text'}
                                    icon={<EditOutlined />}
                                    onClick={() => setMode('pen')}
                                    className="tool-button"
                                />
                            </Tooltip>
                        </Col>

                        <Col>
                            <Tooltip title="Linha">
                                <Button
                                    type="text"
                                    icon={<LineOutlined />}
                                    onClick={() => addShape('line')}
                                    className="tool-button"
                                />
                            </Tooltip>
                        </Col>

                        <Col>
                            <Tooltip title="Retângulo">
                                <Button
                                    type="text"
                                    icon={<BorderOutlined />}
                                    onClick={() => addShape('rect')}
                                    className="tool-button"
                                />
                            </Tooltip>
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

                        <Slider
                            min={1}
                            max={20}
                            value={brushWidth}
                            onChange={setBrushWidth}
                            className="brush-slider"
                            tooltip={{ formatter: value => `${value}px` }}
                        />
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Whiteboard;