// src/pages/UserManagement.tsx
// 用户管理页面

import { useState, useEffect } from 'react';
import { createApiUrl, API_ENDPOINTS } from '../config/api';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Tag, 
  Space, 
  message,
  Popconfirm,
  Card
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

// 定义用户数据类型
interface User {
  id: number;  // 修改为数字类型，与后端保持一致
  user_name: string;
  user_tags: string[];
}

// 用户管理页面组件
function UserManagement() {
  // 状态管理
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('开始获取用户列表...');
      const response = await fetch(createApiUrl(API_ENDPOINTS.USERS));
      console.log('用户列表响应状态:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('用户列表请求失败:', response.status, errorText);
        message.error(`获取用户列表失败: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log('获取到的用户数据:', data);
      setUsers(data);
      message.success(`成功获取 ${data.length} 个用户`);
    } catch (error) {
      console.error('获取用户列表出错:', error);
      message.error(`获取用户列表失败: ${error}`);
    }
    setLoading(false);
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchUsers();
  }, []);

  // 新增用户
  const handleAdd = () => {
    setEditingUser(null);
    setModalVisible(true);
    form.resetFields();
  };

  // 编辑用户
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalVisible(true);
    form.setFieldsValue({
      user_name: user.user_name,
      user_tags: user.user_tags.join(',')
    });
  };

  // 删除用户
  const handleDelete = async (id: number) => {
    try {
      await fetch(createApiUrl(API_ENDPOINTS.USER_BY_ID(id)), { method: 'DELETE' });
      message.success('删除成功');
      fetchUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 保存用户（新增或编辑）
  const handleSave = async (values: any) => {
    try {
      const userData = {
        user_name: values.user_name,
        // 支持英文逗号和中文逗号作为分隔符
        user_tags: values.user_tags ? values.user_tags.split(/[,，]/).map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : []
      };

      if (editingUser) {
        // 编辑模式
        await fetch(createApiUrl(API_ENDPOINTS.USER_BY_ID(editingUser.id)), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        message.success('编辑成功');
      } else {
        // 新增模式
        await fetch(createApiUrl(API_ENDPOINTS.USERS), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        message.success('新增成功');
      }

      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 表格列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
    },
    {
      title: '用户名',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: '标签',
      dataIndex: 'user_tags',
      key: 'user_tags',
      render: (tags: string[]) => (
        <>
          {tags?.map((tag, index) => (
            <Tag key={index} color="blue">{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="用户管理" style={{ margin: 0 }}>
      {/* 工具栏 */}
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新增用户
        </Button>
      </div>

      {/* 用户列表表格 */}
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 新增/编辑用户弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={form.submit}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="user_name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="user_tags"
            label="标签"
            extra="多个标签用逗号分隔，支持英文逗号(,)和中文逗号(，)，例如：测试用户,VIP 或 测试用户，VIP"
          >
            <Input placeholder="请输入标签，多个标签用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default UserManagement; 