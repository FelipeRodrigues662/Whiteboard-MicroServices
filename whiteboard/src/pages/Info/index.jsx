import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Spin, Typography, Tag, Space, Row, Col } from 'antd';
import { ReloadOutlined, UserOutlined, HomeOutlined, ClockCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.css';
import '../../App.css';
import FooterSection from '../../components/FooterSection';

const { Content } = Layout;
const { Title, Text } = Typography;

const Info = () => {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchServers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://whiteboard-core.onrender.com/servers');
            if (!response.ok) {
                throw new Error('Erro ao carregar servidores');
            }
            const data = await response.json();
            setServers(data);
        } catch (err) {
            setError(err.message);
            console.error('Erro ao buscar servidores:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServers();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        return status === 'online' ? 'green' : 'red';
    };

    const getStatusText = (status) => {
        return status === 'online' ? 'Online' : 'Offline';
    };

    const handleGoBack = () => {
        navigate('/room');
    };

    return (
        <>
            <Layout className="modern-layout">
                <div className="gradient-overlay"></div>
                <Content className="main-content">
                    <div className="info-container">
                        <div className="back-section">
                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={handleGoBack}
                                className="back-button"
                            >
                                Voltar
                            </Button>
                        </div>

                        <div className="info-header">
                            <Title level={2} className="welcome-title">
                                Status dos Servidores
                            </Title>
                            <Text className="info-subtitle">
                                Monitoramento em tempo real dos servidores do Whiteboard
                            </Text>
                        </div>

                        <div className="refresh-section">
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={fetchServers}
                                loading={loading}
                                className="refresh-button"
                            >
                                Atualizar
                            </Button>
                        </div>

                        {error && (
                            <div className="error-message">
                                <Text type="danger">{error}</Text>
                            </div>
                        )}

                        {loading && (
                            <div className="loading-container">
                                <Spin size="large" />
                                <Text className="loading-text">Carregando servidores...</Text>
                            </div>
                        )}

                        {!loading && !error && (
                            <Row gutter={[16, 16]} className="servers-grid">
                                {servers.map((server) => (
                                    <Col xs={24} sm={12} lg={8} xl={6} key={server.serverId}>
                                        <Card className="server-card">
                                            <div className="server-header">
                                                <Title level={4} className="server-name">
                                                    {server.name}
                                                </Title>
                                                <Tag 
                                                    color={getStatusColor(server.status)}
                                                    className="status-tag"
                                                >
                                                    {getStatusText(server.status)}
                                                </Tag>
                                            </div>

                                            <div className="server-info">
                                                <div className="info-item">
                                                    <UserOutlined className="info-icon" />
                                                    <Text className="info-text">
                                                        {server.userCount} usuário{server.userCount !== 1 ? 's' : ''}
                                                    </Text>
                                                </div>

                                                <div className="info-item">
                                                    <HomeOutlined className="info-icon" />
                                                    <Text className="info-text">
                                                        {server.roomCount} sala{server.roomCount !== 1 ? 's' : ''}
                                                    </Text>
                                                </div>

                                                <div className="info-item">
                                                    <ClockCircleOutlined className="info-icon" />
                                                    <Text className="info-text">
                                                        {formatDate(server.lastUpdate)}
                                                    </Text>
                                                </div>
                                            </div>

                                            <div className="server-id">
                                                <Text type="secondary" className="server-id-text">
                                                    ID: {server.serverId}
                                                </Text>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </div>
                </Content>

                <FooterSection />
            </Layout>
        </>
    );
};

export default Info;