// src/App.tsx
// 主应用组件，包含路由和布局

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import { 
  BookOutlined, 
  CodeOutlined
} from '@ant-design/icons';

// 导入页面组件
import FlowTest from './pages/FlowTest';
import GuaYaoManagement from './pages/GuaYaoManagement';
import PromptConfig from './pages/PromptConfig';

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
  }
];

// 侧边栏组件
function AppSider() {
  const location = useLocation();
  
  return (
    <Sider width={200} style={{ background: '#fff' }}>
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
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#001529', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            AI周易占卜后台管理系统
          </Title>
        </Header>
        <Layout>
          <AppSider />
          <Layout style={{ padding: '0' }}>
            <Content className="page-content">
              <Routes>
                <Route path="/" element={<FlowTest />} />
                <Route path="/flow-test" element={<FlowTest />} />
                <Route path="/gua-yao" element={<GuaYaoManagement />} />
                <Route path="/prompt-config" element={<PromptConfig />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App; 