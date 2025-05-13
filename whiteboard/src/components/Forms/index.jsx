import React from 'react';
import { Layout, Space, Card, Divider } from 'antd';
import './index_forms.css';
import JoinRoomForm from './JoinRoomForm';
import CreateRoomForm from './CreateRoomForm';

const { Content } = Layout;

export default function Forms() {

    return (
        <Content className="main-content">
            <Card className="modern-card_0">
                <Space className="modern-card_1" align="center">
                    <Card className="modern-card_2">
                        <CreateRoomForm />
                    </Card>
                    <Divider 
                        style={{ 
                            borderColor: 'rgba(255, 255, 255, 0.2)', 
                            color: 'rgba(255, 255, 255, 0.65)',
                            fontSize: '16px',
                            width: '400px'
                        }}
                    >
                        OU
                    </Divider>
                    <Card className="modern-card_2">
                        <JoinRoomForm />
                    </Card>
                </Space>
            </Card>
        </Content>
    );
};
