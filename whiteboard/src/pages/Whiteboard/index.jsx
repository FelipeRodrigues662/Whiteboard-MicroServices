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
    ArrowLeftOutlined,
    ShareAltOutlined
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
    const token = sessionStorage.getItem('token');
    const urlSession = import.meta.env.VITE_URL_SESSION;

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
            backgroundColor: '#fff',
            renderOnAddRemove: true,
            enableRetinaScaling: true
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
                canvas.renderAll();
                message.success('Desenho anterior carregado!');
            });
        }

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
            url: `${urlSession}/?token=${token}`,
            sessionId,
            onMessage: (data) => {
                try {
                    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

                    if (parsed.type === 'draw') {
                        const { x1, y1, x2, y2, color: lineColor, width } = parsed.payload;
                        
                        // Cria uma nova linha usando fabric.js
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
                    } else if (parsed.type === 'shape') {
                        const { shapeType, left, top, width, height, color: shapeColor, strokeWidth } = parsed.payload;
                        let shape;

                        if (shapeType === 'line') {
                            shape = new fabric.Line([left, top, left + width, top], {
                                stroke: shapeColor,
                                strokeWidth: strokeWidth,
                                selectable: true,
                                strokeLineCap: 'round',
                                strokeLineJoin: 'round'
                            });
                        } else if (shapeType === 'rect') {
                            shape = new fabric.Rect({
                                left: left,
                                top: top,
                                width: width,
                                height: height,
                                fill: 'transparent',
                                stroke: shapeColor,
                                strokeWidth: strokeWidth,
                                selectable: true
                            });
                        }

                        if (shape) {
                            canvas.add(shape);
                            canvas.setActiveObject(shape);
                            canvas.renderAll();
                        }
                    } else if (parsed.type === 'clear') {
                        canvas.clear();
                        canvas.backgroundColor = '#fff';
                        canvas.renderAll();
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
                    const currentPosition = { 
                        x: options.e.offsetX, 
                        y: options.e.offsetY 
                    };

                    // Cria uma linha temporária
                    const line = new fabric.Line([
                        lastPosition.current.x,
                        lastPosition.current.y,
                        currentPosition.x,
                        currentPosition.y
                    ], {
                        stroke: color,
                        strokeWidth: brushWidth,
                        selectable: false,
                        evented: false
                    });

                    canvasRef.current.add(line);
                    canvasRef.current.renderAll();

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
        try {
            // Limpa completamente o canvas
            canvasRef.current.clear();
            canvasRef.current.backgroundColor = '#fff';
            canvasRef.current.renderAll();

            // Envia evento de limpeza para outros usuários
            socketService.sendMessage({
                sessionId,
                data: { type: 'clear' }
            });

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

    // const addShape = (type) => {
    //     if (!canvasRef.current) return;

    //     setMode('select');
    //     let shape;
    //     const left = 100;
    //     const top = 100;
    //     const width = 100;
    //     const height = 100;

    //     switch (type) {
    //         case 'line':
    //             shape = new fabric.Line([left, top, left + width, top], {
    //                 stroke: color,
    //                 strokeWidth: brushWidth,
    //                 selectable: true,
    //                 strokeLineCap: 'round',
    //                 strokeLineJoin: 'round'
    //             });
    //             break;
    //         case 'rect':
    //             shape = new fabric.Rect({
    //                 left: left,
    //                 top: top,
    //                 width: width,
    //                 height: height,
    //                 fill: 'transparent',
    //                 stroke: color,
    //                 strokeWidth: brushWidth,
    //                 selectable: true
    //             });
    //             break;
    //         default:
    //             return;
    //     }

    //     canvasRef.current.add(shape);
    //     canvasRef.current.setActiveObject(shape);
    //     canvasRef.current.renderAll();

    //     // Envia a forma para outros usuários
    //     socketService.sendMessage({
    //         sessionId,
    //         data: {
    //             type: 'shape',
    //             payload: {
    //                 shapeType: type,
    //                 left: left,
    //                 top: top,
    //                 width: width,
    //                 height: height,
    //                 color: color,
    //                 strokeWidth: brushWidth
    //             }
    //         }
    //     });
    // };

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

                        {/* <Col>
                            <Tooltip title="Linha">
                                <Button
                                    type="text"
                                    icon={<LineOutlined />}
                                    onClick={() => addShape('line')}
                                    className="tool-button"
                                />
                            </Tooltip>
                        </Col> */}

                        {/* <Col>
                            <Tooltip title="Retângulo">
                                <Button
                                    type="text"
                                    icon={<BorderOutlined />}
                                    onClick={() => addShape('rect')}
                                    className="tool-button"
                                />
                            </Tooltip>
                        </Col> */}

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