import React, { useState } from 'react';
import { Layout, Avatar, Space } from 'antd';
import { FileTextOutlined, MessageOutlined } from '@ant-design/icons';
import './AppHeader.scss';


const { Header } = Layout;

const AppHeader: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <Header className="header">
      <div className="left-section">
        <img src='/1.jpg' alt="Logo" className="logo" />
        <span className="title">智链 iLink</span>
      </div>
      <div className="right-section">
        <Space size="large">
          <FileTextOutlined style={{ fontSize: '1.5rem' }} />
          <MessageOutlined style={{ fontSize: '1.5rem' }} onClick={showDrawer} />
          <Avatar size="large" src='/2.jpg' />
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;
