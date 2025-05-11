import React from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { UserOutlined, LoginOutlined} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index_2.css'; // Importe o CSS aqui

const { Title, Text } = Typography;

const JoinRoomForm = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = (values) => {
        console.log('Dados do formulário:', values);
    };

    return (
        <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
                    <span style={{
                        background: 'linear-gradient(90deg, #5612b5, #9c62ee)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }}>
                        Entrar</span> em uma sala
                </Title>
                <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                    Entre em uma sala já existente usando um código
                </Text>
            </div>

            <Form
                form={form}
                name="joinRoom"
                onFinish={onFinish}
                layout="vertical"
                className="custom-form"
            >
                <Form.Item
                    name="username"
                    rules={[{ required: true, message: 'Por favor, insira seu nome!' }]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="Informe seu nome"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    name="roomCode"
                    rules={[{ required: true, message: 'Por favor, insira o código da sala!' }]}
                >
                    <Input
                        placeholder="Digite o código da sala"
                        size="large"
                    />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        onClick={() => navigate('/whiteboard')}
                        icon={<LoginOutlined />}
                        block
                        style={{
                            background: 'linear-gradient(90deg, #5612b5, #9c62ee)',
                            border: 'none',
                            height: 48,
                            fontWeight: 500,
                            marginTop: 16,
                            flexDirection: 'row-reverse',
                        }}
                    >
                        Entrar na Sala
                    </Button>
                </Form.Item>
            </Form>
        </>
    );
};

export default JoinRoomForm;