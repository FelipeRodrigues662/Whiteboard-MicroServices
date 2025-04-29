import React from 'react';
import { Layout } from 'antd';
// import { useNavigate } from 'react-router-dom';
import './index.css';

import HeaderSection from '../../components/HeaderSection';
import FooterSection from '../../components/FooterSection';
import LoginForm from '../../components/Forms/LoginForm'

const { Content } = Layout;
// const { Title, Text, Paragraph } = Typography;

const Login = () => {
    // const navigate = useNavigate();

    return (
        <div className="app-container">
            <Layout className="modern-layout">
                <div className="gradient-overlay"></div>

                <HeaderSection />

                <Content className="main-content">
                    <LoginForm />
                </Content>

                <FooterSection />
            </Layout>
        </div>
    );
};

export default Login;