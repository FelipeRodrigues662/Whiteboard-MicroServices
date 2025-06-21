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
    DownloadOutlined,
    CrownOutlined
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
    const urlEndpoints = import.meta.env.VITE_URL_ENDPOINTS;

    const [isEraser, setIsEraser] = useState(false);
    
    // Estado para usuários conectados
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Função para salvar estado no localStorage
    const saveToLocalStorage = () => {
        if (!canvasRef.current || !sessionId) return;
        
        try {
            const canvas = document.getElementById('canvas');
            if (!canvas) return;
            
            const canvasImage = canvas.toDataURL('image/png');
            
            // Extrai todos os objetos do canvas com propriedades completas
            const canvasObjects = canvasRef.current.getObjects().map(obj => {
                // Filtra indicadores visuais da borracha
                if (obj.isEraserIndicator) return null;
                
                const baseObject = {
                    type: obj.type || 'unknown',
                    color: obj.stroke || obj.fill || '#000000',
                    width: obj.strokeWidth || 1,
                    left: obj.left || 0,
                    top: obj.top || 0
                };

                // Adiciona propriedades específicas baseadas no tipo
                switch (obj.type) {
                    case 'line':
                        return {
                            ...baseObject,
                            x1: obj.x1,
                            y1: obj.y1,
                            x2: obj.x2,
                            y2: obj.y2
                        };
                    case 'rect':
                        return {
                            ...baseObject,
                            width: obj.width,
                            height: obj.height,
                            fill: obj.fill || 'transparent'
                        };
                    case 'circle':
                        return {
                            ...baseObject,
                            radius: obj.radius,
                            fill: obj.fill || 'transparent'
                        };
                    case 'path':
                        return {
                            ...baseObject,
                            path: obj.path,
                            fill: obj.fill || 'transparent'
                        };
                    case 'polygon':
                        return {
                            ...baseObject,
                            points: obj.points,
                            fill: obj.fill || 'transparent'
                        };
                    default:
                        return {
                            ...baseObject,
                            width: obj.width || 10,
                            height: obj.height || 10
                        };
                }
            }).filter(Boolean);

            const stateData = {
                canvas: canvasImage,
                objects: canvasObjects,
                boardName: boardName,
                version: "1.0",
                lastModified: new Date().toISOString()
            };

            localStorage.setItem(`whiteboard_${sessionId}`, JSON.stringify(stateData));
            console.log('Estado salvo no localStorage:', stateData);
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    };

    // Função para carregar estado do localStorage
    const loadFromLocalStorage = () => {
        if (!canvasRef.current || !sessionId) return;
        
        try {
            const savedState = localStorage.getItem(`whiteboard_${sessionId}`);
            if (!savedState) return;

            const stateData = JSON.parse(savedState);
            
            if (stateData.boardName) {
                setBoardName(stateData.boardName);
                localStorage.setItem('whiteboardName', stateData.boardName);
            }

            if (stateData.objects && Array.isArray(stateData.objects)) {
                // Limpa o canvas atual
                canvasRef.current.clear();
                canvasRef.current.backgroundColor = '#fff';

                // Adiciona cada objeto ao canvas
                stateData.objects.forEach(obj => {
                    let fabricObject;

                    switch (obj.type) {
                        case 'line':
                            fabricObject = new fabric.Line([obj.x1, obj.y1, obj.x2, obj.y2], {
                                stroke: obj.color || '#000000',
                                strokeWidth: obj.width || 1,
                                selectable: false,
                                evented: false,
                                strokeLineCap: 'round',
                                strokeLineJoin: 'round'
                            });
                            break;
                        case 'rect':
                            fabricObject = new fabric.Rect({
                                left: obj.left,
                                top: obj.top,
                                width: obj.width,
                                height: obj.height,
                                fill: obj.fill || 'transparent',
                                stroke: obj.color || '#000000',
                                strokeWidth: obj.width || 1,
                                selectable: false,
                                evented: false
                            });
                            break;
                        case 'circle':
                            fabricObject = new fabric.Circle({
                                left: obj.left,
                                top: obj.top,
                                radius: obj.radius,
                                fill: obj.fill || 'transparent',
                                stroke: obj.color || '#000000',
                                strokeWidth: obj.width || 1,
                                selectable: false,
                                evented: false
                            });
                            break;
                        case 'path':
                            fabricObject = new fabric.Path(obj.path, {
                                left: obj.left,
                                top: obj.top,
                                fill: obj.fill || 'transparent',
                                stroke: obj.color || '#000000',
                                strokeWidth: obj.width || 1,
                                selectable: false,
                                evented: false
                            });
                            break;
                        case 'polygon':
                            fabricObject = new fabric.Polygon(obj.points, {
                                left: obj.left,
                                top: obj.top,
                                fill: obj.fill || 'transparent',
                                stroke: obj.color || '#000000',
                                strokeWidth: obj.width || 1,
                                selectable: false,
                                evented: false
                            });
                            break;
                        default:
                            // Para outros tipos, tenta criar um objeto genérico
                            fabricObject = new fabric.Rect({
                                left: obj.left || 0,
                                top: obj.top || 0,
                                width: obj.width || 10,
                                height: obj.height || 10,
                                fill: obj.color || '#000000',
                                selectable: false,
                                evented: false
                            });
                    }

                    if (fabricObject) {
                        canvasRef.current.add(fabricObject);
                    }
                });

                canvasRef.current.renderAll();
                console.log(`Estado carregado do localStorage: ${stateData.objects.length} objetos`);
            }
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
        }
    };

    // Função para carregar o estado salvo da sessão da API
    const loadSessionState = async () => {
        if (!sessionId || !token) return;
        
        try {
            const response = await fetch(`${urlEndpoints}/session/${sessionId}/state`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('Nenhum estado salvo encontrado para esta sessão na API');
                    // Se não há estado na API, tenta carregar do localStorage
                    loadFromLocalStorage();
                    return;
                }
                throw new Error('Erro ao carregar estado da sessão');
            }

            const data = await response.json();
            
            if (data.state && canvasRef.current) {
                // Atualiza o nome do board se existir
                if (data.state.boardName) {
                    setBoardName(data.state.boardName);
                    localStorage.setItem('whiteboardName', data.state.boardName);
                }

                // Carrega os objetos no canvas
                if (data.state.objects && Array.isArray(data.state.objects)) {
                    // Limpa o canvas atual
                    canvasRef.current.clear();
                    canvasRef.current.backgroundColor = '#fff';

                    // Adiciona cada objeto ao canvas
                    data.state.objects.forEach(obj => {
                        let fabricObject;

                        switch (obj.type) {
                            case 'line':
                                fabricObject = new fabric.Line([obj.x1, obj.y1, obj.x2, obj.y2], {
                                    stroke: obj.color || '#000000',
                                    strokeWidth: obj.width || 1,
                                    selectable: false,
                                    evented: false,
                                    strokeLineCap: 'round',
                                    strokeLineJoin: 'round'
                                });
                                break;
                            case 'rect':
                                fabricObject = new fabric.Rect({
                                    left: obj.left,
                                    top: obj.top,
                                    width: obj.width,
                                    height: obj.height,
                                    fill: obj.fill || 'transparent',
                                    stroke: obj.color || '#000000',
                                    strokeWidth: obj.width || 1,
                                    selectable: false,
                                    evented: false
                                });
                                break;
                            case 'circle':
                                fabricObject = new fabric.Circle({
                                    left: obj.left,
                                    top: obj.top,
                                    radius: obj.radius,
                                    fill: obj.fill || 'transparent',
                                    stroke: obj.color || '#000000',
                                    strokeWidth: obj.width || 1,
                                    selectable: false,
                                    evented: false
                                });
                                break;
                            case 'path':
                                fabricObject = new fabric.Path(obj.path, {
                                    left: obj.left,
                                    top: obj.top,
                                    fill: obj.fill || 'transparent',
                                    stroke: obj.color || '#000000',
                                    strokeWidth: obj.width || 1,
                                    selectable: false,
                                    evented: false
                                });
                                break;
                            case 'polygon':
                                fabricObject = new fabric.Polygon(obj.points, {
                                    left: obj.left,
                                    top: obj.top,
                                    fill: obj.fill || 'transparent',
                                    stroke: obj.color || '#000000',
                                    strokeWidth: obj.width || 1,
                                    selectable: false,
                                    evented: false
                                });
                                break;
                            default:
                                // Para outros tipos, tenta criar um objeto genérico
                                fabricObject = new fabric.Rect({
                                    left: obj.left || 0,
                                    top: obj.top || 0,
                                    width: obj.width || 10,
                                    height: obj.height || 10,
                                    fill: obj.color || '#000000',
                                    selectable: false,
                                    evented: false
                                });
                        }

                        if (fabricObject) {
                            canvasRef.current.add(fabricObject);
                        }
                    });

                    canvasRef.current.renderAll();
                    messageApi.success(`Board "${data.state.boardName}" carregado com sucesso! (${data.state.objects.length} objetos)`);
                    
                    // Salva o estado carregado da API no localStorage
                    saveToLocalStorage();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar estado da sessão:', error);
            // Se falhar ao carregar da API, tenta carregar do localStorage
            loadFromLocalStorage();
        }
    };

    // Função para buscar usuários conectados a sessão
    const fetchConnectedUsers = async () => {
        if (!sessionId || !token) return;
        
        setLoadingUsers(true);
        try {
            const response = await fetch(`${urlEndpoints}/session/${sessionId}/users`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar usuários conectados');
            }

            const data = await response.json();
            if (data.users && Array.isArray(data.users)) {
                setConnectedUsers(data.users);
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    // Configura o intervalo para buscar usuários a cada minuto
    useEffect(() => {
        // Busca inicial
        fetchConnectedUsers();

        // Configura intervalo de 10 segundos para atualização mais frequente
        const interval = setInterval(fetchConnectedUsers, 10000);

        // Atualiza quando a janela ganha foco
        const handleFocus = () => {
            fetchConnectedUsers();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [sessionId, token, urlEndpoints]);

    // Atualiza a lista quando o sidebar é aberto
    useEffect(() => {
        if (showSidebar) {
            fetchConnectedUsers();
        }
    }, [showSidebar]);

    // Fecha o sidebar quando clica fora dele
    useEffect(() => {
        const handleClickOutside = (event) => {
            const sidebar = document.querySelector('.user-sidebar');
            const sidebarToggle = document.querySelector('.sidebar-toggle');
            
            // Se o sidebar está aberto e o clique não foi dentro do sidebar nem no botão de toggle
            if (showSidebar && sidebar && sidebarToggle) {
                if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
                    setShowSidebar(false);
                }
            }
        };

        const handleKeyDown = (event) => {
            // Fecha o sidebar com a tecla ESC
            if (event.key === 'Escape' && showSidebar) {
                setShowSidebar(false);
            }
        };

        // Adiciona os event listeners apenas quando o sidebar está aberto
        if (showSidebar) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showSidebar]);

    // Configura o aviso antes de recarregar
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            // Salva o estado atual no localStorage antes de sair
            saveToLocalStorage();
            
            e.preventDefault();
            e.returnValue = 'Seu trabalho no whiteboard será perdido. Tem certeza que deseja sair?';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Salva automaticamente no localStorage a cada 30 segundos
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
            if (canvasRef.current) {
                saveToLocalStorage();
            }
        }, 30000); // 30 segundos

        return () => {
            clearInterval(autoSaveInterval);
        };
    }, [sessionId]);

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

        // Carrega o estado salvo da sessão
        loadSessionState();

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
                            
                            // Salva no localStorage após adicionar objeto
                            saveToLocalStorage();
                            
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
                            
                            // Salva no localStorage após limpar
                            saveToLocalStorage();
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
                                
                                // Salva no localStorage após desfazer
                                saveToLocalStorage();
                            }
                            break;

                        case 'user_joined':
                        case 'user_left':
                            // Atualiza a lista de usuários quando alguém entra ou sai
                            fetchConnectedUsers();
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

            // Salva no localStorage após limpar
            saveToLocalStorage();

            messageApi.open({
                type: 'success',
                content: 'Limpeza efetuada com sucesso',
            });

            localStorage.removeItem('whiteboardData');
            localStorage.removeItem('drawingCoordinates');
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

    const handleSave = async () => {
        if (canvasRef.current) {
            try {
                // Primeiro salva no localStorage para garantir que temos o estado mais recente
                saveToLocalStorage();
                
                // Obtém o estado do localStorage
                const savedState = localStorage.getItem(`whiteboard_${sessionId}`);
                if (!savedState) {
                    throw new Error('Nenhum estado encontrado para salvar');
                }

                const stateData = JSON.parse(savedState);

                // Envia para o backend
                const response = await fetch(`${urlEndpoints}/session/${sessionId}/state`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ state: stateData })
                });

                if (!response.ok) {
                    throw new Error('Erro ao salvar no servidor');
                }

                const result = await response.json();
                
                messageApi.open({
                    type: 'success',
                    content: `Board "${result.boardName}" salvo com sucesso! (${result.objectsCount} objetos)`,
                });

                console.log('Board salvo:', result);

            } catch (error) {
                console.error('Erro ao salvar:', error);
                messageApi.open({
                    type: 'error',
                    content: 'Não foi possível salvar o Board no servidor',
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
                        <div className="sidebar-header">
                            <h3 className="sidebar-title">Usuários Conectados</h3>
                            <Button
                                type="text"
                                icon={<UserOutlined />}
                                onClick={fetchConnectedUsers}
                                loading={loadingUsers}
                                className="refresh-users-button"
                                size="small"
                            />
                        </div>
                        
                        {loadingUsers ? (
                            <div className="loading-users">
                                <div className="loading-spinner"></div>
                                <span>Carregando usuários...</span>
                            </div>
                        ) : (
                            <List
                                dataSource={connectedUsers}
                                renderItem={user => (
                                    <List.Item className="user-list-item">
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar className={user.isLeader ? 'leader-avatar' : 'user-avatar'}>
                                                    {user.isLeader ? <CrownOutlined /> : user.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                            }
                                            title={
                                                <span className="user-name">
                                                    {user.name}
                                                    {user.isLeader && <span className="leader-badge">Líder</span>}
                                                </span>
                                            }
                                            description={
                                                <span className="user-email">{user.email}</span>
                                            }
                                        />
                                    </List.Item>
                                )}
                                locale={{
                                    emptyText: (
                                        <div className="empty-users">
                                            <UserOutlined style={{ fontSize: '24px', color: '#666' }} />
                                            <span>Nenhum usuário conectado</span>
                                        </div>
                                    )
                                }}
                            />
                        )}
                        
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