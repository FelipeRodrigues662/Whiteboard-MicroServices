import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, RocketFilled, RightCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './index_1.css';

const { Title, Text } = Typography;

const CreateRoomForm = () => {
    // const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const navigate = useNavigate();

    const createSession = async () => {
        try {
          const res = await axios.post('https://d701-2804-4a24-61ac-ba00-a936-245c-28a7-7121.ngrok-free.app/create-session');
          if (!res.data.sessionId) {
                    messageApi.open({
                        type: 'warning',
                        content: 'Infelizmente não foi possível criar uma sala. Por favor, tente novamente mais tarde.',
                    });
                }
                else {
                    messageApi.open({
                        type: 'success',
                        content: 'Sala Criada com sucesso!',
                    });
                }
          navigate('/whiteboard/' + res.data.sessionId);
        } catch (err) {
          console.error(err);
        }
      };
    
    // const handleCopyCode = () => {
    //     const code = form.getFieldValue('roomCode');
    //     if (!code) {
    //         messageApi.open({
    //             type: 'warning',
    //             content: 'Nenhum código para copiar. Gere um código primeiro!',
    //         });
    //     }
    //     else {
    //         navigator.clipboard.writeText(code)
    //         messageApi.open({
    //             type: 'success',
    //             content: 'Código copiado com sucesso!',
    //         });
    //     }
    // };

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

            <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<RightCircleOutlined />}
                        block
                        onClick={createSession}
                        style={{
                            background: 'linear-gradient(90deg, #9c62ee, #5612b5)',
                            border: 'none',
                            height: 48,
                            fontWeight: 500,
                            marginTop: 16,
                            flexDirection: 'row-reverse',
                        }}
                    >
                        Criar nova sala
                    </Button>
        </>
    );
};

export default CreateRoomForm;