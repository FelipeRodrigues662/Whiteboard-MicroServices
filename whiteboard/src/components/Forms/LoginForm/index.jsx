import { useState } from 'react';
import { Form, Input, Button, Typography, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './index_login.css';

const { Title, Text } = Typography;

const LoginForm = ({ messageApi }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);  // Estado para erros
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const urlEndpoint = import.meta.env.VITE_URL_ENDPOINTS;
    

    const handleLogin = async (values) => {
        console.log(values);
    
        if (!email || !password) {
          setError('Por favor, preencha todos os campos');
          return;
        }
    
        try {
            const response = await axios.post(`${urlEndpoint}/api/auth/login`, {
                email: values.email,
                password: values.password,
            });
            console.log(response.data.token);
            sessionStorage.setItem('token', response.data.token);
            messageApi.open({
                type: 'success',
                content: 'Seja bem-vindo(a)!',
            });
            setTimeout(() => {
                navigate('/room');
            }, 1500);
          } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Erro ao fazer login');
          }
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
                onFinish={handleLogin}
                layout="vertical"
                className="auth-form"
            >
                <Form.Item
                    name="email"
                    rules={[{ required: true, message: 'Por favor, insira seu e-mail@' }]}
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder="E-mail"
                        size="large"
                        className="auth-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Senha"
                        size="large"
                        className="auth-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Form.Item>

                <Form.Item>
                    <div className="auth-remember-forgot">
                        {/* <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox className="auth-remember-me">Lembrar de mim</Checkbox>
                        </Form.Item> */}

                        <a className="auth-forgot-password" onClick={() => navigate('/register')}>
                            Criar uma nova conta
                        </a>
                    </div>
                </Form.Item>
                {error && <div style={{ color: 'red' }}>{error}</div>}
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        className="auth-submit-button"
                    >
                        Entrar
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default LoginForm;