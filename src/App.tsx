// src/App.tsx
// 主应用组件，包含路由和布局

import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Button } from 'antd';
import { 
  BookOutlined, 
  CodeOutlined,
  CalculatorOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';

// 导入页面组件
import FlowTest from './pages/FlowTest';
import GuaYaoManagement from './pages/GuaYaoManagement';
import PromptConfig from './pages/PromptConfig';
import DivinationCalculator from './pages/DivinationCalculator';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// 菜单项配置
const menuItems = [
  {
    key: '/flow-test',
    icon: <CodeOutlined />,
    label: <Link to="/flow-test">流程测试</Link>
  },
  {
    key: '/gua-yao',
    icon: <BookOutlined />,
    label: <Link to="/gua-yao">卦和爻管理</Link>
  },
  {
    key: '/prompt-config',
    icon: <CodeOutlined />,
    label: <Link to="/prompt-config">Prompt配置</Link>
  },
  {
    key: '/divination-calculator',
    icon: <CalculatorOutlined />,
    label: <Link to="/divination-calculator">数字卦计算器</Link>
  }
];

// 侧边栏组件
function AppSider({ collapsed, onCollapse }: { collapsed: boolean, onCollapse: (collapsed: boolean) => void }) {
  const location = useLocation();
  
  return (
    <Sider 
      width={200} 
      collapsed={collapsed}
      collapsible
      onCollapse={onCollapse}
      style={{ background: '#fff' }}
      trigger={null} // 隐藏默认的折叠按钮，使用自定义按钮
    >
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          YiLore
        </Title>
        <div style={{ fontSize: '12px', color: '#666' }}>后台管理系统</div>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
      />
    </Sider>
  );
}

// 主应用组件
function App() {
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapse = (collapsed: boolean) => {
    setCollapsed(collapsed);
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#001529', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                color: 'white',
                marginRight: '16px'
              }}
            />
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              AI周易占卜后台管理系统
            </Title>
          </div>
        </Header>
        <Layout>
          <AppSider collapsed={collapsed} onCollapse={handleCollapse} />
          <Layout style={{ padding: '0' }}>
            <Content className="page-content">
              <Routes>
                <Route path="/" element={<FlowTest />} />
                <Route path="/flow-test" element={<FlowTest />} />
                <Route path="/gua-yao" element={<GuaYaoManagement />} />
                <Route path="/prompt-config" element={<PromptConfig />} />
                <Route path="/divination-calculator" element={<DivinationCalculator />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App; 