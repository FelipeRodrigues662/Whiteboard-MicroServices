import React from 'react';
import { Layout } from 'antd';
// import { useNavigate } from 'react-router-dom';
import './index.css';
import HeaderSection from '../../components/HeaderSection';
import FooterSection from '../../components/FooterSection';
import RegisterForm from '../../components/Forms/RegisterForm'

const { Content } = Layout;
// const { Title, Text, Paragraph } = Typography;

const Register = () => {
    // const navigate = useNavigate();

    return (
        <div className="app-container">
            <Layout className="modern-layout">
                <div className="gradient-overlay"></div>

                <HeaderSection />

                <Content className="main-content">
                    <RegisterForm />
                </Content>

                <FooterSection />
            </Layout>
        </div>
    );
};

export default Register;