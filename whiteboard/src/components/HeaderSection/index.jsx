import React from 'react';
import { Layout, Typography, Divider, Button, Space } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index_header.css';
import logo from '../../assets/logo.png';

const { Header } = Layout;
const { Title } = Typography;

export default function HeaderSection() {
    const navigate = useNavigate();
    const isLoggedIn = localStorage.getItem('token');

    const handleLogout = () => {
        // Remove o token do localStorage
        localStorage.removeItem('token');
        // Redireciona para a página inicial
        // messageApi.open({
        //     type: 'success',
        //     content: 'Logout efetuado com sucesso!',
        // });
        setTimeout(() => {
            navigate('/');
        }, 1000);
    };

    return (
        <Header className="modern-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0px', flexDirection: "column" }}>
                <img
                    src={logo}
                    alt="Whiteboard - Logo"
                    style={{ height: '100px', marginTop: '6px', cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                />
                <Title level={1} className="welcome-title">
                    <span className="gradient-text-2">WhiteBoard</span> by StateSystems
                </Title>

                {isLoggedIn && (
                    <Space className="header-buttons" style={{ marginBottom: '20px' }}>
                        <Button
                            type="primary"
                            size="large"
                            className="signup-button"
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                        >
                            Sair
                        </Button>
                    </Space>
                )}
                <Divider style={{ borderColor: '#f1f1f131' }} />
            </div>
        </Header>
    );
}