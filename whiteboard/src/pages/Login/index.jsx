import React from 'react';
import { Layout, message } from 'antd';
import './index.css';
import HeaderSection from '../../components/HeaderSection';
import FooterSection from '../../components/FooterSection';
import LoginForm from '../../components/Forms/LoginForm'

const { Content } = Layout;

const Login = () => {
    const [messageApi, contextHolder] = message.useMessage();

    return (
        <div className="app-container">
            {contextHolder}
            <Layout className="modern-layout">
                <div className="gradient-overlay"></div>

                <HeaderSection />

                <Content className="main-content">
                    <LoginForm messageApi={messageApi} />
                </Content>

                <FooterSection />
            </Layout>
        </div>
    );
};

export default Login;