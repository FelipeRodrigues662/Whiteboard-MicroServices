import React from 'react';
import { Layout, Typography, Divider, Button, Space } from 'antd';
import { LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index_header.css';
import logo from '../../assets/logo.png';

const { Header } = Layout;
const { Title } = Typography;

export default function HeaderSection() {
    const navigate = useNavigate();

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

                {/* <Space className="header-buttons" style={{ marginBottom: '20px' }}>
                    <Button
                        type="primary"
                        ghost
                        size="large"
                        className="login-button"
                        icon={<LoginOutlined />}
                        onClick={() => navigate('/login')}
                    >
                        Log In
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        className="signup-button"
                        icon={<UserAddOutlined />}
                        onClick={() => navigate('/register')}
                    >
                        Sign Up
                    </Button>
                </Space> */}
                <Divider style={{ borderColor: '#f1f1f131' }} />
            </div>
        </Header>
    );
};