// src/pages/GuaYaoManagement.tsx
// 卦和爻管理页面

import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Space, 
  message,
  Popconfirm,
  Card,
  Radio,
  Select,
  InputNumber
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// 定义卦数据类型
interface Gua {
  id: string;
  gua_name: string;
  gua_prompt: string;
  position: number;
  binary_code: string;
}

// 定义爻数据类型
interface Yao {
  id: string;
  gua_position: number; // 修改：gua_position是卦的位置数字(1-64)，不是UUID
  position: number;
  yao_name: string;
  yao_prompt: string;
}

// 卦和爻管理页面组件
function GuaYaoManagement() {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'gua' | 'yao'>('gua'); // 当前选中的标签页
  const [guas, setGuas] = useState<Gua[]>([]);
  const [yaos, setYaos] = useState<Yao[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Gua | Yao | null>(null);
  const [form] = Form.useForm();

  // 获取卦列表
  const fetchGuas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/guas');
      const data = await response.json();
      setGuas(data);
    } catch (error) {
      message.error('获取卦列表失败');
    }
    setLoading(false);
  };

  // 获取爻列表
  const fetchYaos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/yaos');
      const data = await response.json();
      setYaos(data);
    } catch (error) {
      message.error('获取爻列表失败');
    }
    setLoading(false);
  };

  // 页面加载时获取数据
  useEffect(() => {
    if (activeTab === 'gua') {
      fetchGuas();
    } else {
      fetchYaos();
      // 获取爻数据时也需要获取卦数据，用于下拉选择
      if (guas.length === 0) {
        fetchGuas();
      }
    }
  }, [activeTab]);

  // 切换标签页
  const handleTabChange = (e: any) => {
    setActiveTab(e.target.value);
  };

  // 新增
  const handleAdd = () => {
    setEditingItem(null);
    setModalVisible(true);
    form.resetFields();
  };

  // 编辑
  const handleEdit = (item: Gua | Yao) => {
    setEditingItem(item);
    setModalVisible(true);
    
    if (activeTab === 'gua') {
      const gua = item as Gua;
      form.setFieldsValue({
        gua_name: gua.gua_name,
        gua_prompt: gua.gua_prompt,
        position: gua.position,
        binary_code: gua.binary_code
      });
    } else {
      const yao = item as Yao;
      form.setFieldsValue({
        gua_position: yao.gua_position, // 修改：使用gua_position
        position: yao.position,
        yao_name: yao.yao_name,
        yao_prompt: yao.yao_prompt
      });
    }
  };

  // 删除
  const handleDelete = async (id: string) => {
    try {
      const endpoint = activeTab === 'gua' ? `/api/guas/${id}` : `/api/yaos/${id}`;
      await fetch(endpoint, { method: 'DELETE' });
      message.success('删除成功');
      if (activeTab === 'gua') {
        fetchGuas();
      } else {
        fetchYaos();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 保存（新增或编辑）
  const handleSave = async (values: any) => {
    try {
      let endpoint = '';
      let method = '';
      let data = {};

      if (activeTab === 'gua') {
        data = {
          gua_name: values.gua_name,
          gua_prompt: values.gua_prompt,
          position: values.position,
          binary_code: values.binary_code
        };
        
        if (editingItem) {
          endpoint = `/api/guas/${editingItem.id}`;
          method = 'PUT';
        } else {
          endpoint = '/api/guas';
          method = 'POST';
        }
      } else {
        data = {
          gua_position: values.gua_position, // 修改：使用gua_position
          position: values.position,
          yao_name: values.yao_name,
          yao_prompt: values.yao_prompt
        };
        
        if (editingItem) {
          endpoint = `/api/yaos/${editingItem.id}`;
          method = 'PUT';
        } else {
          endpoint = '/api/yaos';
          method = 'POST';
        }
      }

      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      message.success(editingItem ? '编辑成功' : '新增成功');
      setModalVisible(false);
      
      if (activeTab === 'gua') {
        fetchGuas();
      } else {
        fetchYaos();
      }
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 卦表格列配置
  const guaColumns: ColumnsType<Gua> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
    },
    {
      title: '卦名',
      dataIndex: 'gua_name',
      key: 'gua_name',
    },
    {
      title: '顺序',
      dataIndex: 'position',
      key: 'position',
      width: 80,
    },
    {
      title: '二进制编号',
      dataIndex: 'binary_code',
      key: 'binary_code',
      width: 120,
    },
    {
      title: 'Prompt',
      dataIndex: 'gua_prompt',
      key: 'gua_prompt',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Gua) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个卦吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small"
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

  // 爻表格列配置
  const yaoColumns: ColumnsType<Yao> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
    },
    {
      title: '所属卦',
      dataIndex: 'gua_position',
      key: 'gua_position',
      width: 150,
      render: (gua_position: number) => {
        // 根据gua_position找到对应的卦名
        const gua = guas.find(g => g.position === gua_position);
        return gua ? `第${gua.position}卦 - ${gua.gua_name}` : `第${gua_position}卦`;
      },
    },
    {
      title: '爻位',
      dataIndex: 'position',
      key: 'position',
      width: 80,
    },
    {
      title: '爻名',
      dataIndex: 'yao_name',
      key: 'yao_name',
    },
    {
      title: 'Prompt',
      dataIndex: 'yao_prompt',
      key: 'yao_prompt',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Yao) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个爻吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small"
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
    <Card title="卦和爻管理" style={{ margin: 0 }}>
      {/* 顶部选择器和工具栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* 左侧：卦/爻切换 */}
        <Radio.Group value={activeTab} onChange={handleTabChange}>
          <Radio.Button value="gua">卦管理</Radio.Button>
          <Radio.Button value="yao">爻管理</Radio.Button>
        </Radio.Group>

        {/* 右侧：新增按钮 */}
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新增{activeTab === 'gua' ? '卦' : '爻'}
        </Button>
      </div>

      {/* 数据表格 */}
      {activeTab === 'gua' ? (
        <Table<Gua>
          columns={guaColumns}
          dataSource={guas}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      ) : (
        <Table<Yao>
          columns={yaoColumns}
          dataSource={yaos}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      )}

      {/* 新增/编辑弹窗 */}
      <Modal
        title={`${editingItem ? '编辑' : '新增'}${activeTab === 'gua' ? '卦' : '爻'}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={form.submit}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          {activeTab === 'gua' ? (
            // 卦的表单
            <>
              <Form.Item
                name="gua_name"
                label="卦名"
                rules={[{ required: true, message: '请输入卦名' }]}
              >
                <Input placeholder="请输入卦名" />
              </Form.Item>

              <Form.Item
                name="position"
                label="顺序"
                rules={[{ required: true, message: '请输入顺序' }]}
              >
                <InputNumber min={1} max={64} placeholder="请输入顺序(1-64)" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="binary_code"
                label="二进制编号"
                rules={[{ required: true, message: '请输入二进制编号' }]}
              >
                <Input placeholder="请输入六位二进制编号，如：100101" maxLength={6} />
              </Form.Item>

              <Form.Item
                name="gua_prompt"
                label="Prompt内容"
                rules={[{ required: true, message: '请输入Prompt内容' }]}
              >
                <Input.TextArea rows={4} placeholder="请输入卦的Prompt内容" />
              </Form.Item>
            </>
          ) : (
            // 爻的表单
            <>
              <Form.Item
                name="gua_position"
                label="所属卦"
                rules={[{ required: true, message: '请选择所属卦' }]}
              >
                <Select placeholder="请选择所属卦">
                  {guas.map(gua => (
                    <Select.Option key={gua.id} value={gua.position}>
                      第{gua.position}卦 - {gua.gua_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="position"
                label="爻位"
                rules={[{ required: true, message: '请输入爻位' }]}
              >
                <InputNumber 
                  min={1} 
                  max={7} 
                  placeholder="请输入爻位(1-7，乾坤卦有第7爻)" 
                  style={{ width: '100%' }} 
                />
              </Form.Item>

              <Form.Item
                name="yao_name"
                label="爻名"
                rules={[{ required: true, message: '请输入爻名' }]}
              >
                <Input placeholder="请输入爻名" />
              </Form.Item>

              <Form.Item
                name="yao_prompt"
                label="Prompt内容"
                rules={[{ required: true, message: '请输入Prompt内容' }]}
              >
                <Input.TextArea rows={4} placeholder="请输入爻的Prompt内容" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Card>
  );
}

export default GuaYaoManagement; 