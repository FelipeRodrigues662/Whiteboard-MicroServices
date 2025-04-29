import React from 'react';
import { Layout, Divider } from 'antd';
// import { useNavigate } from 'react-router-dom';
import './index.css';
import '../../App.css';
import HeaderSection from '../../components/HeaderSection';
import FooterSection from '../../components/FooterSection';
import Forms from '../../components/Forms'
import Recents from '../../components/recents'

const { Content } = Layout;
// const { Title, Text, Paragraph } = Typography;

const Room = () => {
    // const navigate = useNavigate();

    return (
        <>
            <Layout className="modern-layout">
                <div className="gradient-overlay"></div>

                <HeaderSection />

                <Content className="main-content">
                    <Forms />
                    {/* <Divider type="vertical" className="tool-divider" /> */}
                    <Recents />
                </Content>

                <FooterSection />
            </Layout>
        </>
    );
};

export default Room;