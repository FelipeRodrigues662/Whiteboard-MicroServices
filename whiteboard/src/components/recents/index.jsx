import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Button, Space, Modal, Input, message } from 'antd';
import { EditOutlined, DeleteOutlined, FileOutlined, FileImageOutlined } from '@ant-design/icons';
import './index.css';

const { Text, Title } = Typography;
const { Meta } = Card;

const Recents = () => {
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingBoard, setEditingBoard] = useState(null);
    const [newName, setNewName] = useState('');
    const [messageApi, contextHolder] = message.useMessage();

    // Carrega os boards salvos do localStorage
    useEffect(() => {
        const loadBoards = () => {
            try {
                const savedBoards = [];

                // Verifica se existe dados do whiteboard
                const whiteboardData = localStorage.getItem('whiteboardData');
                if (whiteboardData) {
                    const boardName = localStorage.getItem('whiteboardName') || 'Whiteboard Sem Nome';

                    savedBoards.push({
                        id: 'current',
                        name: boardName,
                        data: whiteboardData,
                        lastModified: localStorage.getItem('whiteboardLastModified') || new Date().toISOString()
                    });
                }

                // Adiciona mais alguns exemplos (remover quando tiver dados reais)
                for (let i = 1; i <= 3; i++) {
                    savedBoards.push({
                        id: `example-${i}`,
                        name: `Projeto ${i}`,
                        data: null,
                        lastModified: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
                    });
                }

                setBoards(savedBoards);
            } catch (error) {
                console.error('Erro ao carregar boards:', error);
                messageApi.error('Erro ao carregar boards salvos');
            } finally {
                setLoading(false);
            }
        };

        loadBoards();
    }, [messageApi]);

    const handleEdit = (board) => {
        setEditingBoard(board);
        setNewName(board.name);
    };

    const handleSaveEdit = () => {
        if (!editingBoard || !newName.trim()) return;

        try {
            // Atualiza no localStorage se for o board atual
            if (editingBoard.id === 'current') {
                localStorage.setItem('whiteboardName', newName);
                localStorage.setItem('whiteboardLastModified', new Date().toISOString());
            }

            // Atualiza na lista
            setBoards(boards.map(b =>
                b.id === editingBoard.id ? { ...b, name: newName, lastModified: new Date().toISOString() } : b
            ));

            messageApi.success('Nome atualizado com sucesso!');
            setEditingBoard(null);
        } catch (error) {
            console.error('Erro ao salvar edição:', error);
            messageApi.error('Erro ao atualizar nome');
        }
    };

    const handleDelete = (boardId) => {
        Modal.confirm({
            title: 'Excluir Board',
            content: 'Tem certeza que deseja excluir este board? Esta ação não pode ser desfeita.',
            okText: 'Excluir',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: () => {
                try {
                    if (boardId === 'current') {
                        localStorage.removeItem('whiteboardData');
                        localStorage.removeItem('whiteboardName');
                        localStorage.removeItem('whiteboardLastModified');
                    }

                    setBoards(boards.filter(b => b.id !== boardId));
                    messageApi.success('Board excluído com sucesso!');
                } catch (error) {
                    console.error('Erro ao excluir board:', error);
                    messageApi.error('Erro ao excluir board');
                }
            }
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="recents-container">
            {contextHolder}
            <Title level={3} className="recents-title gradient-text-2">Seus Boards Recentes</Title>

            <List
                loading={loading}
                grid={{ gutter: 24, xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
                dataSource={boards}
                renderItem={(board) => (
                    <List.Item>
                        <Card
                            hoverable
                            className="board-card"
                            cover={
                                <div className="board-thumbnail">
                                    {/* <FileImageOutlined className="thumbnail-icon" /> */}
                                </div>
                            }
                            actions={[
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(board)}
                                    className="card-action-button"
                                />,
                                <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(board.id)}
                                    className="card-action-button"
                                    danger
                                />
                            ]}
                        >
                            <Meta
                                title={<Text ellipsis className="card-title">{board.name}</Text>}
                                description={
                                    <Text type="secondary" className="card-description">
                                        Editado: {formatDate(board.lastModified)}
                                    </Text>
                                }
                            />
                        </Card>
                    </List.Item>
                )}
            />

            {/* Modal de edição */}
            <Modal
                className='modal_main'
                title="Editar Nome do Board"
                open={!!editingBoard}
                onOk={handleSaveEdit}
                onCancel={() => setEditingBoard(null)}
                okText="Salvar"
                cancelText="Cancelar"
            >
                <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Digite o novo nome"
                    onPressEnter={handleSaveEdit}
                />
            </Modal>
        </div>
    );
};

export default Recents;