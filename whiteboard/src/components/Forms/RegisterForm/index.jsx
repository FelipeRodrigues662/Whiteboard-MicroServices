import React from 'react';
import { Form, Input, Button, Typography, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index_register.css';

const { Title, Text } = Typography;

const LoginForm = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = (values) => {
        console.log('Dados de login:', values);
    };

    return (
        <div className="auth-form-container_register">
            <div className="auth-form-header">
                <Title level={3} className="auth-form-title">
                    <span className="gradient-text">Criar</span> nova conta
                </Title>
                <Text className="auth-form-subtitle">
                    Preencha o formulário para criar uma conta
                </Text>
            </div>

            <Form
                form={form}
                name="login"
                onFinish={onFinish}
                layout="vertical"
                className="auth-form"
            >
                <Form.Item
                    name="username"
                    rules={[{ required: true, message: 'Por favor insira seu nome!' }]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="Nome"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    name="email"
                    rules={[{ required: true, message: 'Por favor insira seu email!' }]}
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder="Email"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Por favor insira sua senha!' }]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Senha"
                        size="large"
                        className="auth-input"
                    />
                </Form.Item>

                <Form.Item>
                    <div className="auth-remember-forgot">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox className="auth-remember-me">Lembrar de mim</Checkbox>
                        </Form.Item>

                        <a className="auth-forgot-password" onClick={() => navigate('/login')}>
                            Entrar em uma conta
                        </a>
                    </div>
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        className="auth-submit-button"
                    >
                        Cadastrar
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default LoginForm;