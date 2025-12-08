// src/App.tsx
// 主应用组件，包含路由和布局

import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Button, message } from 'antd';
import { 
  BookOutlined, 
  CodeOutlined,
  CalculatorOutlined,
  PictureOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CloudServerOutlined,
  ShareAltOutlined,
  LogoutOutlined
} from '@ant-design/icons';

// 导入页面组件
import FlowTest from './pages/FlowTest';
import GuaYaoManagement from './pages/GuaYaoManagement';
import PromptConfig from './pages/PromptConfig';
import DivinationCalculator from './pages/DivinationCalculator';
import ImageDivination from './pages/ImageDivination';
import CacheManagement from './pages/CacheManagement';
import ShareCodeManagement from './pages/ShareCodeManagement';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './services/authService';

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
  },
  {
    key: '/image-divination',
    icon: <PictureOutlined />,
    label: <Link to="/image-divination">图片起卦测试</Link>
  },
  {
    key: '/cache-management',
    icon: <CloudServerOutlined />,
    label: <Link to="/cache-management">缓存管理</Link>
  },
  {
    key: '/share-code-management',
    icon: <ShareAltOutlined />,
    label: <Link to="/share-code-management">分享码管理</Link>
  }
];

// Header 操作按钮组件（登出按钮）
function HeaderActions() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    authService.logout();
    message.success('已登出');
    navigate('/login', { replace: true });
  };
  
  return (
    <Button
      type="text"
      icon={<LogoutOutlined />}
      onClick={handleLogout}
      style={{
        color: 'white',
        fontSize: '14px'
      }}
    >
      登出
    </Button>
  );
}

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

// 主应用布局组件（包含 Header 和 Sidebar）
function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapse = (collapsed: boolean) => {
    setCollapsed(collapsed);
  };

  return (
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
        <HeaderActions />
      </Header>
      <Layout>
        <AppSider collapsed={collapsed} onCollapse={handleCollapse} />
        <Layout style={{ padding: '0' }}>
          <Content className="page-content">
            <Routes>
              {/* 所有业务路由都需要登录保护 */}
              <Route path="/" element={
                <ProtectedRoute>
                  <FlowTest />
                </ProtectedRoute>
              } />
              <Route path="/flow-test" element={
                <ProtectedRoute>
                  <FlowTest />
                </ProtectedRoute>
              } />
              <Route path="/gua-yao" element={
                <ProtectedRoute>
                  <GuaYaoManagement />
                </ProtectedRoute>
              } />
              <Route path="/prompt-config" element={
                <ProtectedRoute>
                  <PromptConfig />
                </ProtectedRoute>
              } />
              <Route path="/divination-calculator" element={
                <ProtectedRoute>
                  <DivinationCalculator />
                </ProtectedRoute>
              } />
              <Route path="/image-divination" element={
                <ProtectedRoute>
                  <ImageDivination />
                </ProtectedRoute>
              } />
              <Route path="/cache-management" element={
                <ProtectedRoute>
                  <CacheManagement />
                </ProtectedRoute>
              } />
              <Route path="/share-code-management" element={
                <ProtectedRoute>
                  <ShareCodeManagement />
                </ProtectedRoute>
              } />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

// 主应用组件
function App() {
  return (
    <Router>
      <Routes>
        {/* 登录页面不需要保护，也不显示 Header 和 Sidebar */}
        <Route path="/login" element={<Login />} />
        
        {/* 其他所有路由都使用主布局（包含 Header 和 Sidebar） */}
        <Route path="*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}

export default App; 