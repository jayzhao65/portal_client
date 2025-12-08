// src/pages/ShareCodeManagement.tsx
// 分享码管理页面 - 管理员创建和管理分享码

import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Space, 
  Tag, 
  Popconfirm,
  Switch,
  InputNumber,
  Card,
  Typography
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { createApiUrl } from '../config/api';

const { Title, Text } = Typography;

// 分享码数据类型
interface ShareCode {
  id: string;
  reading_id: string;
  share_code: string;
  created_by: string;
  is_active: boolean;
  usage_count: number;
  max_usage: number | null;
  created_at: string;
  updated_at: string;
}

// ShareCodeManagement 组件
const ShareCodeManagement = () => {
  // 状态管理
  const [shareCodes, setShareCodes] = useState<ShareCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCode, setEditingCode] = useState<ShareCode | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // 加载分享码列表
  const loadShareCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch(createApiUrl('/api/v1/share-codes/admin/list'));

      const result = await response.json();

      if (result.success) {
        setShareCodes(result.data.share_codes);
      } else {
        message.error(result.error || '获取分享码列表失败');
      }
    } catch (error) {
      message.error('获取分享码列表失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadShareCodes();
  }, []);

  // 创建分享码
  const handleCreate = async (values: any) => {
    try {
      const response = await fetch(createApiUrl('/api/v1/share-codes/admin/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reading_id: values.reading_id,
          share_code: values.share_code,
          max_usage: values.max_usage || null
        })
      });

      const result = await response.json();

      if (result.success) {
        message.success('分享码创建成功');
        setCreateModalVisible(false);
        createForm.resetFields();
        loadShareCodes(); // 重新加载列表
      } else {
        message.error(result.error || '创建分享码失败');
      }
    } catch (error) {
      message.error('创建分享码失败: ' + (error as Error).message);
    }
  };

  // 更新分享码
  const handleUpdate = async (values: any) => {
    if (!editingCode) return;

    try {
      const response = await fetch(createApiUrl(`/api/v1/share-codes/admin/${editingCode.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: values.is_active,
          max_usage: values.max_usage || null
        })
      });

      const result = await response.json();

      if (result.success) {
        message.success('分享码更新成功');
        setEditModalVisible(false);
        setEditingCode(null);
        editForm.resetFields();
        loadShareCodes(); // 重新加载列表
      } else {
        message.error(result.error || '更新分享码失败');
      }
    } catch (error) {
      message.error('更新分享码失败: ' + (error as Error).message);
    }
  };

  // 删除分享码
  const handleDelete = async (shareCodeId: string) => {
    try {
      const response = await fetch(createApiUrl(`/api/v1/share-codes/admin/${shareCodeId}`), {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        message.success('分享码删除成功');
        loadShareCodes(); // 重新加载列表
      } else {
        message.error(result.error || '删除分享码失败');
      }
    } catch (error) {
      message.error('删除分享码失败: ' + (error as Error).message);
    }
  };

  // 打开编辑弹窗
  const showEditModal = (record: ShareCode) => {
    setEditingCode(record);
    editForm.setFieldsValue({
      is_active: record.is_active,
      max_usage: record.max_usage
    });
    setEditModalVisible(true);
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => <Text copyable>{text.substring(0, 8)}...</Text>
    },
    {
      title: 'Reading ID',
      dataIndex: 'reading_id',
      key: 'reading_id',
      width: 120,
      render: (text: string) => <Text copyable>{text.substring(0, 8)}...</Text>
    },
    {
      title: '分享码',
      dataIndex: 'share_code',
      key: 'share_code',
      width: 150,
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '激活' : '停用'}
        </Tag>
      )
    },
    {
      title: '使用次数',
      key: 'usage',
      width: 120,
      render: (record: ShareCode) => (
        <span>
          {record.usage_count} {record.max_usage !== null ? `/ ${record.max_usage}` : '/ 不限'}
        </span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (record: ShareCode) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此分享码吗？"
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
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>分享码管理</Title>
            <Text type="secondary">创建和管理报告分享码</Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建分享码
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={shareCodes}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      {/* 创建分享码弹窗 */}
      <Modal
        title="创建分享码"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="reading_id"
            label="Reading ID"
            rules={[{ required: true, message: '请输入 Reading ID' }]}
          >
            <Input placeholder="请输入要分享的 Reading ID" />
          </Form.Item>

          <Form.Item
            name="share_code"
            label="分享码"
            rules={[
              { required: true, message: '请输入分享码' },
              { max: 100, message: '分享码长度不能超过100个字符' }
            ]}
          >
            <Input placeholder="支持汉字、英文、数字组合" />
          </Form.Item>

          <Form.Item
            name="max_usage"
            label="最大使用次数"
            help="留空表示不限制使用次数"
          >
            <InputNumber 
              min={1} 
              placeholder="不限制" 
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                createForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑分享码弹窗 */}
      <Modal
        title="编辑分享码"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingCode(null);
          editForm.resetFields();
        }}
        footer={null}
      >
        {editingCode && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">分享码: </Text>
            <Tag color="blue">{editingCode.share_code}</Tag>
          </div>
        )}
        
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="is_active"
            label="激活状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="激活" unCheckedChildren="停用" />
          </Form.Item>

          <Form.Item
            name="max_usage"
            label="最大使用次数"
            help="留空表示不限制使用次数"
          >
            <InputNumber 
              min={1} 
              placeholder="不限制" 
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => {
                setEditModalVisible(false);
                setEditingCode(null);
                editForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShareCodeManagement;

