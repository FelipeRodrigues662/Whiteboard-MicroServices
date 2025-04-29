import React from 'react';
import { Form, Input, Button, Typography, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './index_login.css';

const { Title, Text } = Typography;

const LoginForm = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const onFinish = (values) => {
        console.log('Dados de login:', values);
    };

    return (
        <div className="auth-form-container">
            <div className="auth-form-header">
                <Title level={3} className="auth-form-title">
                    <span className="gradient-text">Entrar</span> na conta
                </Title>
                <Text className="auth-form-subtitle">
                    Preencha com as credenciais para acessar
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
                    rules={[{ required: true, message: 'Por favor insira seu e-mail ou nome de usuário!' }]}
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder="E-mail"
                        size="large"
                        className="auth-input"
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

                        <a className="auth-forgot-password" onClick={() => navigate('/register')}>
                            Criar uma nova conta
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
                        onClick={() => navigate('/room')}
                    >
                        Entrar
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default LoginForm;