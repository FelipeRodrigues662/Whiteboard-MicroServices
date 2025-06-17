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
    ShareAltOutlined,
    HighlightOutlined
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
    const urlSession = import.meta.env.VITE_URL_SESSION;
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

    // Inicializa o canvas e carrega dados salvos
    useEffect(() => {
        const canvasElement = document.getElementById('canvas');
        const canvas = new fabric.Canvas(canvasElement, {
            isDrawingMode: true,
            backgroundColor: '#fff',
            renderOnAddRemove: true,
            enableRetinaScaling: true,
            selection: false // Desativa a seleção globalmente
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
                    let x1, y1, x2, y2, lineColor, width, objectId, objectToRemove, line;

                    switch (parsed.type) {
                        case 'draw':
                            ({ x1, y1, x2, y2, color: lineColor, width } = parsed.data);
                            
                            // Cria uma nova linha usando fabric.js
                            line = new fabric.Line([x1, y1, x2, y2], {
                                stroke: lineColor || color,
                                strokeWidth: width || brushWidth,
                                selectable: false,
                                evented: false,
                                strokeLineCap: 'round',
                                strokeLineJoin: 'round'
                            });

                            canvas.add(line);
                            canvas.getObjects().forEach(obj => {
                                obj.selectable = false;
                                obj.evented = false;
                            });
                            canvas.discardActiveObject();
                            canvas.renderAll();
                            break;

                        case 'erase':
                            ({ objectId } = parsed.data);
                            objectToRemove = canvas.getObjects().find(obj => obj.id === objectId);
                            if (objectToRemove) {
                                canvas.remove(objectToRemove);
                                canvas.getObjects().forEach(obj => {
                                    obj.selectable = false;
                                    obj.evented = false;
                                });
                                canvas.discardActiveObject();
                                canvas.renderAll();
                            }
                            break;

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
                            message.error(parsed.data.message);
                            break;

                        default:
                            console.warn('Tipo de mensagem desconhecido:', parsed.type);
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

    // Adiciona o evento de clique para remover objetos
    useEffect(() => {
        if (canvasRef.current) {
            const handleMouseDown = (options) => {
                if (isEraser) {
                    isDrawing.current = true;
                    lastPosition.current = { 
                        x: options.e.offsetX, 
                        y: options.e.offsetY 
                    };
                }
            };

            const handleMouseMove = (options) => {
                if (isEraser && isDrawing.current) {
                    const pointer = canvasRef.current.getPointer(options.e);
                    const objects = canvasRef.current.getObjects();
                    const eraserRadius = brushWidth * 2;
                    
                    // Procura por objetos dentro do raio da borracha
                    const objectsToRemove = objects.filter(obj => {
                        if (obj.type === 'line') {
                            const distance = distanceToLine(pointer.x, pointer.y, obj.x1, obj.y1, obj.x2, obj.y2);
                            return distance < eraserRadius;
                        }
                        return false;
                    });

                    // Remove todos os objetos encontrados
                    objectsToRemove.forEach(obj => {
                        canvasRef.current.remove(obj);
                        canvasRef.current.getObjects().forEach(o => {
                            o.selectable = false;
                            o.evented = false;
                        });
                        socketService.sendMessage({
                            sessionId,
                            type: 'erase',
                            data: {
                                objectId: obj.id || Date.now().toString()
                            }
                        });
                    });

                    if (objectsToRemove.length > 0) {
                        canvasRef.current.getObjects().forEach(o => {
                            o.selectable = false;
                            o.evented = false;
                        });
                        canvasRef.current.discardActiveObject();
                        canvasRef.current.renderAll();
                    }

                    lastPosition.current = { x: pointer.x, y: pointer.y };
                }
            };

            const handleMouseUp = () => {
                isDrawing.current = false;
            };

            // Função auxiliar para calcular a distância de um ponto a uma linha
            const distanceToLine = (x, y, x1, y1, x2, y2) => {
                const A = x - x1;
                const B = y - y1;
                const C = x2 - x1;
                const D = y2 - y1;

                const dot = A * C + B * D;
                const len_sq = C * C + D * D;
                let param = -1;

                if (len_sq !== 0) {
                    param = dot / len_sq;
                }

                let xx, yy;

                if (param < 0) {
                    xx = x1;
                    yy = y1;
                } else if (param > 1) {
                    xx = x2;
                    yy = y2;
                } else {
                    xx = x1 + param * C;
                    yy = y1 + param * D;
                }

                const dx = x - xx;
                const dy = y - yy;

                return Math.sqrt(dx * dx + dy * dy);
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
                    lastPosition.current = { 
                        x: options.e.offsetX, 
                        y: options.e.offsetY 
                    };
                }
            };

            const handleMouseMove = (options) => {
                if (isDrawing.current && !isEraser) {
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
                    canvasRef.current.getObjects().forEach(o => {
                        o.selectable = false;
                        o.evented = false;
                    });
                    canvasRef.current.discardActiveObject();
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
                        type: 'draw',
                        data: drawingData,
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

    const handleSaveName = () => {
        localStorage.setItem('whiteboardName', boardName);
        localStorage.setItem('whiteboardLastModified', new Date().toISOString());
        setIsEditingName(false);
        messageApi.success('Nome do board atualizado!');
    };

    const handleUndo = () => {
        if (canvasRef.current && canvasRef.current._objects.length > 0) {
            const removedObject = canvasRef.current._objects.pop();
            canvasRef.current.remove(removedObject);
            canvasRef.current.getObjects().forEach(o => {
                o.selectable = false;
                o.evented = false;
            });
            canvasRef.current.discardActiveObject();
            canvasRef.current.renderAll();

            socketService.sendMessage({
                sessionId,
                type: 'undo',
                data: {
                    objectId: removedObject.id || Date.now().toString()
                }
            });
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