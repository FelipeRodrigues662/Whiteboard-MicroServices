import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, RocketFilled, CopyOutlined } from '@ant-design/icons';
import './index_1.css';

const { Title, Text } = Typography;

const CreateRoomForm = () => {
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const onFinish = (values) => {
        console.log('Dados do formulário:', values);
    };

    const handleCopyCode = () => {
        const code = form.getFieldValue('roomCode');
        if (!code) {
            messageApi.open({
                type: 'warning',
                content: 'Nenhum código para copiar. Gere um código primeiro!',
            });
        }
        else {
            navigator.clipboard.writeText(code)
            messageApi.open({
                type: 'success',
                content: 'Código copiado com sucesso!',
            });
        }
    };

    return (
        <>
            {contextHolder}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
                    <span style={{
                        background: 'linear-gradient(90deg, #9c62ee, #5612b5)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }}>
                        Criar</span> uma sala
                </Title>
                <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                    Crie uma sala e convide os seus amigos
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
                    rules={[{ required: true, message: 'Por favor insira seu nome!' }]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="Informe seu nome"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    name="roomCode"
                    rules={[{ required: true, message: 'Por favor insira o código da sala!' }]}
                >
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        width: '100%',
                        alignItems: 'center'
                    }}>
                        <Input
                            placeholder="Gerar um novo código"
                            size="large"
                            // disabled 
                            style={{ flex: 1 }}
                            suffix={
                                <Button
                                    type="text"
                                    icon={<CopyOutlined />}
                                    style={{
                                        color: 'rgba(255, 255, 255, 0.65)',
                                        border: 'none',
                                        background: 'transparent'
                                    }}
                                    onClick={handleCopyCode}
                                />
                            }
                        />
                        <Button
                            type="primary"
                            size="large"
                            icon={<RocketFilled />}
                            style={{
                                background: 'linear-gradient(90deg, #9c62ee, #5612b5)',
                                border: 'none',
                                height: '48px',
                                fontWeight: 500,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Gerar
                        </Button>
                    </div>
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<RocketFilled />}
                        block
                        style={{
                            background: 'linear-gradient(90deg, #9c62ee, #5612b5)',
                            border: 'none',
                            height: 48,
                            fontWeight: 500,
                            marginTop: 16
                        }}
                    >
                        Criar nova sala
                    </Button>
                </Form.Item>
            </Form>
        </>
    );
};

export default CreateRoomForm;