import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Button, Space, Input, message, Avatar, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, FileOutlined, FileImageOutlined, ShareAltOutlined, UserOutlined, CrownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';

const { Text, Title } = Typography;
const { Meta } = Card;

const Recents = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [messageApi, contextHolder] = message.useMessage();
    const navigate = useNavigate();

    const urlEndpoints = import.meta.env.VITE_URL_ENDPOINTS;
    const token = localStorage.getItem('token');

    // Carrega as sessões do usuário da API
    useEffect(() => {
        const loadSessions = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${urlEndpoints}/user/sessions`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setSessions(response.data.sessions || []);
            } catch (error) {
                console.error('Erro ao carregar sessões:', error);
                messageApi.error('Erro ao carregar sessões recentes');
            } finally {
                setLoading(false);
            }
        };

        loadSessions();
    }, [messageApi, token, urlEndpoints]);

    const handleReconnect = async (session) => {
        try {
            // Adiciona o usuário de volta à sessão
            await axios.post(`${urlEndpoints}/session/add-user`, {
                sessionId: session.sessionId
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            messageApi.success('Conectado à sessão com sucesso!');
            
            // Navega para o whiteboard com o sessionId
            navigate(`/whiteboard/${session.sessionId}`);
        } catch (error) {
            console.error('Erro ao reconectar à sessão:', error);
            if (error.response?.data?.status === 'already_connected') {
                messageApi.info('Você já está conectado a esta sessão!');
                navigate(`/whiteboard/${session.sessionId}`);
            } else {
                messageApi.error('Erro ao reconectar à sessão');
            }
        }
    };

    const handleDelete = async (session, event) => {
        // Previne que o clique se propague para o card
        event.stopPropagation();
        
        try {
            // Chama a API para deletar a sessão
            await axios.delete(`${urlEndpoints}/session/${session.sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Remove a sessão da lista local
            setSessions(sessions.filter(s => s.sessionId !== session.sessionId));
            messageApi.success('Sessão excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir sessão:', error);
            if (error.response?.status === 404) {
                messageApi.error('Sessão não encontrada');
            } else {
                messageApi.error('Erro ao excluir sessão');
            }
        }
    };

    const handleShare = (session, event) => {
        // Previne que o clique se propague para o card
        event.stopPropagation();

        // Obtém a URL atual
        const url = `${window.location.origin}/whiteboard/${session.sessionId}`;
        
        // Copia a URL para a área de transferência
        navigator.clipboard.writeText(url)
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSessionTitle = (session) => {
        // Usa o boardName do banco se disponível
        if (session.boardName !== 'Meu Board') {
            return session.boardName;
        }
        return session.boardName;
    };

    const getSessionDescription = (session) => {
        if (session.leader && session.leader.id === session.user.id) {
            return `Você é o líder desta sessão`;
        } else if (session.leader) {
            return `Líder: ${session.leader.name}`;
        } else {
            return 'Sessão colaborativa';
        }
    };

    const getSessionIcon = (session) => {
        if (session.leader && session.leader.id === session.user.id) {
            return <CrownOutlined style={{ color: '#ffd700', fontSize: '20px', alignItems: 'flex-start', marginBottom: '10px' }} />;
        } else {
            return <UserOutlined style={{ color: '#1890ff', fontSize: '20px', alignItems: 'flex-start', marginBottom: '10px' }} />;
        }
    };

    return (
        <div className="recents-container">
            {contextHolder}
            <Title level={3} style={{ color: '#fff' }} className="recents-title gradient-text-2">Suas Sessões Recentes</Title>

            <div className="boards-grid">
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <span>Carregando sessões...</span>
                    </div>
                ) : (
                    <Row gutter={[16, 16]} className="sessions-grid">
                        {sessions.map((session) => (
                            <Col xs={24} sm={12} lg={8} xl={6} key={session.sessionId}>
                                <Card
                                    hoverable
                                    className="board-card"
                                    cover={
                                        <div className="board-thumbnail">
                                        </div>
                                    }
                                    onClick={() => handleReconnect(session)}
                                    actions={[
                                        <>
                                        <Button
                                            type="text"
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => handleDelete(session, e)}
                                            className="card-action-button"
                                            danger
                                            title="Excluir sessão"
                                        />
                                        <Button
                                        type="text"
                                        icon={<ShareAltOutlined />}
                                        onClick={(e) => handleShare(session, e)}
                                        className="card-action-button-share"
                                        danger
                                        title="Compartilhar sessão"
                                    />
                                    </>
                                    ]}
                                >
                                    <Meta
                                        title={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Text ellipsis className="card-title" style={{ flex: 1 }}>
                                                    {getSessionTitle(session)}
                                                </Text>
                                                {getSessionIcon(session)}
                                            </div>
                                        }
                                        description={
                                            <div>
                                                <Text type="secondary" className="card-description">
                                                    {getSessionDescription(session)}
                                                </Text>
                                                <br />
                                                <Text type="secondary" className="card-description">
                                                    Atualizada: {formatDate(session.updatedAt)}
                                                </Text>
                                            </div>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {sessions.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
                    <p>Nenhuma sessão encontrada</p>
                    <p>Participe de uma sessão para vê-la aqui</p>
                </div>
            )}
        </div>
    );
};

export default Recents;