import React from 'react';
import { Layout, Typography, Card, Row, Col } from 'antd';
import { LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index.css';
import '../../App.css';
import HeaderSection from '../../components/HeaderSection';
import FooterSection from '../../components/FooterSection';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="app-container">
            <Layout className="modern-layout">
                <div className="gradient-overlay"></div>

                <HeaderSection />

                <Content className="main-content">
                    <div className="welcome-section">
                        <Title level={2} className="welcome-message">
                            Bem-vindo ao <span className="gradient-text-2">WhiteBoard</span>
                        </Title>
                        <Paragraph className="welcome-description">
                            Conecte-se, colabore e compartilhe seus quadros e salas com o WhiteBoard da StateSystems.
                            Escolha uma opção abaixo para começar sua jornada.
                        </Paragraph>
                    </div>

                    <Row gutter={[24, 24]} justify="center" className="cards-container">
                        <Col xs={24} sm={12} md={10} lg={8}>
                            <Card
                                className="auth-card login-card"
                                hoverable
                                onClick={() => navigate('/login')}
                            >
                                <LoginOutlined className="card-icon" />
                                <Title level={3} className="card-title">Login</Title>
                                <Text className="card-description">
                                    Já tem uma conta? Acesse seu painel e continue de onde parou.
                                </Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={10} lg={8}>
                            <Card
                                className="auth-card register-card"
                                hoverable
                                onClick={() => navigate('/register')}
                            >
                                <UserAddOutlined className="card-icon" />
                                <Title level={3} className="card-title">Cadastro</Title>
                                <Text className="card-description">
                                    Novo por aqui? Crie sua conta e comece a usar todos os recursos.
                                </Text>
                            </Card>
                        </Col>
                    </Row>
                </Content>

                <FooterSection />
            </Layout>
        </div>
    );
};

export default Welcome;