// src/pages/Login.tsx
// 登录页面组件

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';

const { Title, Text } = Typography;

/**
 * 登录页面组件
 * 提供密码输入和验证功能
 */
function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 如果已经登录，重定向到首页或原访问页面
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  /**
   * 处理登录提交
   * 验证密码，成功后保存登录状态并重定向
   */
  const handleSubmit = async (values: { password: string }) => {
    setLoading(true);
    
    try {
      // 调用认证服务验证密码
      const success = authService.login(values.password);
      
      if (success) {
        // 登录成功
        message.success('登录成功');
        
        // 获取重定向路径（如果有的话）
        const from = (location.state as any)?.from?.pathname || '/';
        
        // 延迟一下再跳转，让用户看到成功提示
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 300);
      } else {
        // 密码错误
        message.error('密码错误，请重试');
        form.setFieldsValue({ password: '' }); // 清空密码输入框
      }
    } catch (error) {
      console.error('登录出错:', error);
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 如果已经登录，不显示登录表单
  if (authService.isAuthenticated()) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            YiLore 后台管理
          </Title>
          <Text type="secondary">请输入密码以继续</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 1, message: '密码不能为空' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
              autoFocus
              onPressEnter={() => form.submit()}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Login;

