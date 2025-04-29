import React from 'react';
import { Layout, Typography } from 'antd';
import './index_footer.css';

const { Footer } = Layout;
const { Text } = Typography;

export default function FooterSection() {
    return (
        <Footer className="modern-footer">
            <Text className="footer-text">© 2025 Whiteboard - Sistemas Distribuídos UFV</Text>
        </Footer>
    );
};