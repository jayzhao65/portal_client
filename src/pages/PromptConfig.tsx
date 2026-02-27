// src/pages/PromptConfig.tsx
// Prompt配置管理页面

import { useState, useEffect } from 'react';
import { createApiUrl, API_ENDPOINTS } from '../config/api';
import { 
  Card, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Tag, 
  Space, 
  message,
  Popconfirm,
  Select,
  Row,
  Col,
  Typography,
  Divider,
  List,
  Badge,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import SchemaEditor from '../components/SchemaEditor';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 定义Prompt配置数据类型
interface PromptConfig {
  id: string;
  stage_name: string;
  system_prompt: string;
  user_prompt: string;
  placeholders: Array<{key: string; description: string}>;
  model_name: string;
  config: any;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  response_format?: any | null;  // 结构化输出配置（JSON Schema）
}

// 阶段名称定义
const STAGE_NAMES = [
  "问题验证",
  "扩写/位置生成", 
  "现状分析",
  "占卜解读",
  "追问",
  "每日指引追问",
  "图片识别",
  "图片占卜解读"
];

// 阶段占位符定义
const STAGE_PLACEHOLDERS = {
  "问题验证": [
    {key: "{user_tags}", description: "用户标签"},
    {key: "{question}", description: "用户问题"}
  ],
  "扩写/位置生成": [
    {key: "{reading_id}", description: "Reading记录ID"},
    {key: "{question}", description: "用户问题"},
    {key: "{user_tags}", description: "用户标签"}
  ],
  "现状分析": [
    {key: "{reading_id}", description: "Reading记录ID"},
    {key: "{divination_result}", description: "占卜结果"}
  ],
  "占卜解读": [
    {key: "{reading_id}", description: "Reading记录ID"},
    {key: "{situation_analysis}", description: "现状分析结果"}
  ],
  "追问": [
    {key: "{reading_id}", description: "Reading记录ID"},
    {key: "{previous_analysis}", description: "之前的分析结果"}
  ],
  "每日指引追问": [
    {key: "{user_rizhu}", description: "用户日柱"},
    {key: "{today_day_gan}", description: "今日日干"},
    {key: "{ten_gold}", description: "十神"},
    {key: "{gua_name}", description: "卦名"},
    {key: "{gua_daily_guidance}", description: "指引文案"},
    {key: "{chat_history_str}", description: "对话历史"},
    {key: "{user_question}", description: "用户追问问题"}
  ],
  "图片识别": [
    {key: "{intent_tag}", description: "用户的意图标签（如：事业、感情、财运）"}
  ],
  "图片占卜解读": [
    {key: "{intent_tag}", description: "用户的意图标签"},
    {key: "{ben_gua_name}", description: "本卦名称（64卦）"},
    {key: "{ben_gua_ci}", description: "本卦卦辞"},
    {key: "{zhi_gua_name}", description: "之卦名称（64卦）"},
    {key: "{zhi_gua_ci}", description: "之卦卦辞"},
    {key: "{moving_yao_name}", description: "变爻名称"},
    {key: "{moving_yao_position}", description: "变爻位置（1-6）"},
    {key: "{calculation_process}", description: "计算过程描述"}
  ]
};

// Prompt配置管理页面组件
function PromptConfig() {
  // 状态管理
  const [configs, setConfigs] = useState<PromptConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PromptConfig | null>(null);
  const [viewingConfig, setViewingConfig] = useState<PromptConfig | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [responseFormat, setResponseFormat] = useState<any | null>(null);
  const [form] = Form.useForm();

  // 获取所有配置
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIGS), {
        headers: {
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('获取配置失败:', response.status, errorText);
        message.error(`获取配置失败: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setConfigs(data.data || []);
        message.success(`成功获取 ${data.data?.length || 0} 个配置`);
      } else {
        message.error(data.message || '获取配置失败');
      }
    } catch (error) {
      console.error('获取配置出错:', error);
      message.error(`获取配置失败: ${error}`);
    }
    setLoading(false);
  };

  // 获取可用模型列表
  const fetchAvailableModels = async () => {
    try {
      const response = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIG_MODELS), {
        headers: {
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAvailableModels(result.data);
        } else {
          console.warn('获取模型列表失败:', result.message);
        }
      } else {
        console.warn('获取模型列表失败');
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchConfigs();
    fetchAvailableModels();
  }, []);

  // 新增配置
  const handleAdd = (stageName: string) => {
    setEditingConfig(null);
    setResponseFormat(null);
    setModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      stage_name: stageName,
      version: `v1.0.0`,
      model_name: availableModels.length > 0 ? availableModels[0] : undefined
    });
  };

  // 查看配置
  const handleView = (config: PromptConfig) => {
    setViewingConfig(config);
    setViewModalVisible(true);
  };

  // 编辑配置
  const handleEdit = (config: PromptConfig) => {
    setEditingConfig(config);
    setResponseFormat(config.response_format || null);
    setModalVisible(true);
    
    // 处理config字段，转换为表单需要的嵌套格式
    let formConfig = {};
    if (config.config && typeof config.config === 'object') {
      if (config.config.max_tokens !== undefined) {
        formConfig = { ...formConfig, max_tokens: config.config.max_tokens };
      }
      if (config.config.temperature !== undefined) {
        formConfig = { ...formConfig, temperature: config.config.temperature };
      }
    }
    
    form.setFieldsValue({
      stage_name: config.stage_name,
      version: config.version,
      system_prompt: config.system_prompt,
      user_prompt: config.user_prompt,
      model_name: config.model_name,
      config: formConfig
    });
    
    // 设置输入框的值
    setTimeout(() => {
      const maxTokensInput = document.getElementById('max_tokens_input') as HTMLInputElement;
      const temperatureInput = document.getElementById('temperature_input') as HTMLInputElement;
      
      if (maxTokensInput && config.config?.max_tokens !== undefined) {
        maxTokensInput.value = config.config.max_tokens.toString();
      }
      if (temperatureInput && config.config?.temperature !== undefined) {
        temperatureInput.value = config.config.temperature.toString();
      }
    }, 100);
  };

  // 删除配置
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIG_BY_ID(id)), { 
        method: 'DELETE',
        headers: {
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        }
      });
      
      if (response.ok) {
        message.success('删除成功');
        fetchConfigs();
      } else {
        const errorData = await response.json();
        message.error(errorData.detail || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 激活配置
  const handleActivate = async (id: string) => {
    try {
      const response = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIG_ACTIVATE(id)), { 
        method: 'POST',
        headers: {
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        }
      });
      
      if (response.ok) {
        message.success('激活成功');
        fetchConfigs();
      } else {
        const errorData = await response.json();
        message.error(errorData.detail || '激活失败');
      }
    } catch (error) {
      message.error('激活失败');
    }
  };

  // 保存配置（新增或编辑）
  const handleSave = async (values: any) => {
    try {
      // 调试：打印表单提交的原始值
      console.log('🔍 表单提交的原始值:', values);
      console.log('🔍 values.config:', values.config);
      console.log('🔍 表单中的config字段值:', {
        max_tokens: form.getFieldValue(['config', 'max_tokens']),
        temperature: form.getFieldValue(['config', 'temperature'])
      });
      
      // 根据阶段名称自动设置占位符
      const stageName = values.stage_name;
      const processedPlaceholders = (STAGE_PLACEHOLDERS[stageName as keyof typeof STAGE_PLACEHOLDERS] || []).map(ph => ph.key);
      
      // 处理config字段，确保格式正确
      let processedConfig: any = values.config || {};
      
      // 如果config为空对象，尝试从表单中获取
      if (!processedConfig || Object.keys(processedConfig).length === 0) {
        const currentConfig = form.getFieldValue('config');
        if (currentConfig && typeof currentConfig === 'object') {
          processedConfig = currentConfig;
        }
      }
      
      console.log('🔍 处理后的config:', processedConfig);
      
      const configData = {
        stage_name: values.stage_name,
        version: values.version,
        system_prompt: values.system_prompt,
        user_prompt: values.user_prompt,
        placeholders: processedPlaceholders,
        model_name: values.model_name,
        config: processedConfig,
        response_format: responseFormat,
        is_active: false
      };
      
      console.log('🔍 最终发送给后端的数据:', configData);

      let response;
      if (editingConfig) {
        // 编辑
        response = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIG_BY_ID(editingConfig.id)), {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-Dev-Mode': 'true',
            'X-Dev-Token': 'dev-secret-2024'
          },
          body: JSON.stringify(configData)
        });
      } else {
        // 新增
        response = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIGS), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Dev-Mode': 'true',
            'X-Dev-Token': 'dev-secret-2024'
          },
          body: JSON.stringify(configData)
        });
      }

      if (response.ok) {
        message.success(editingConfig ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchConfigs();
      } else {
        const errorData = await response.json();
        message.error(errorData.detail || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 获取指定阶段的配置
  const getConfigsByStage = (stageName: string) => {
    return configs.filter(config => config.stage_name === stageName);
  };

  // 获取指定阶段的激活配置
  const getActiveConfig = (stageName: string) => {
    return configs.find(config => config.stage_name === stageName && config.is_active);
  };

  // 渲染阶段卡片
  const renderStageCard = (stageName: string) => {
    const stageConfigs = getConfigsByStage(stageName);
    const activeConfig = getActiveConfig(stageName);

    return (
      <Card
        key={stageName}
        title={
          <Space>
            <span>{stageName}</span>
            {activeConfig ? (
              <Badge 
                status="success" 
                text={`激活版本: ${activeConfig.version}`}
              />
            ) : (
              <Badge 
                status="error" 
                text="⚠️ 未激活配置"
                style={{ 
                  backgroundColor: '#ff4d4f', 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              />
            )}
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => handleAdd(stageName)}
          >
            新增版本
          </Button>
        }
        style={{ 
          marginBottom: 16,
          border: activeConfig ? '1px solid #d9d9d9' : '2px solid #ff4d4f',
          backgroundColor: activeConfig ? '#ffffff' : '#fff2f0'
        }}
      >
        {stageConfigs.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: '#fff2f0',
            border: '1px dashed #ff4d4f',
            borderRadius: '6px'
          }}>
            <Text type="danger" strong style={{ fontSize: '16px' }}>
              ⚠️ 该阶段暂无任何配置版本
            </Text>
            <br />
            <Text type="secondary">
              请点击右上角"新增版本"按钮创建第一个配置
            </Text>
          </div>
        ) : (
          <>
            {!activeConfig && (
              <div style={{ 
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '6px',
                borderLeft: '4px solid #faad14'
              }}>
                <Text type="warning" strong>
                  ⚠️ 该阶段有配置版本，但未激活任何版本
                </Text>
                <br />
                <Text type="secondary">
                  请选择一个配置版本并点击"激活"按钮
                </Text>
              </div>
            )}
            <List
              dataSource={stageConfigs}
              renderItem={(config) => (
              <List.Item
                actions={[
                  <Tooltip title="查看配置">
                    <Button 
                      type="text" 
                      icon={<EyeOutlined />}
                      onClick={() => handleView(config)}
                    />
                  </Tooltip>,
                  config.is_active ? (
                    <Tooltip title="已激活">
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        已激活
                      </Tag>
                    </Tooltip>
                  ) : (
                    <Tooltip title="激活配置">
                      <Button 
                        type="text" 
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleActivate(config.id)}
                      >
                        激活
                      </Button>
                    </Tooltip>
                  ),
                  config.is_active ? null : (
                    <Popconfirm
                      title="确定要删除这个配置吗？"
                      onConfirm={() => handleDelete(config.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Tooltip title="删除配置">
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />}
                        />
                      </Tooltip>
                    </Popconfirm>
                  )
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>版本 {config.version}</Text>
                      {config.is_active && (
                        <Tag color="green">激活版本</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Space>
                        <Text>模型: {config.model_name}</Text>
                        {config.response_format && (
                          <Tag color="geekblue">Schema</Tag>
                        )}
                      </Space>
                      <Text type="secondary">
                        配置: {config.config?.max_tokens ? `max_tokens: ${config.config.max_tokens}` : ''} 
                        {config.config?.temperature ? `temperature: ${config.config.temperature}` : ''}
                      </Text>
                      <Text type="secondary">
                        创建时间: {new Date(config.created_at).toLocaleString()}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
            </>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Prompt配置管理</Title>
      <Text type="secondary">
        管理各个阶段的Prompt配置，支持多版本管理和版本切换
      </Text>
      
      <Divider />
      
      {/* 阶段配置卡片 */}
      <Row gutter={[16, 16]}>
        {STAGE_NAMES.map(stageName => (
          <Col xs={24} lg={12} xl={8} key={stageName}>
            {renderStageCard(stageName)}
          </Col>
        ))}
      </Row>

      {/* 新增/编辑配置模态框 */}
      <Modal
        title={editingConfig ? '编辑配置' : '新增配置'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stage_name"
                label="阶段名称"
                rules={[{ required: true, message: '请选择阶段名称' }]}
              >
                <Select placeholder="选择阶段名称">
                  {STAGE_NAMES.map(name => (
                    <Option key={name} value={name}>{name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="version"
                label="版本号"
                rules={[{ required: true, message: '请输入版本号' }]}
              >
                <Input placeholder="如: v1.0.0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="model_name"
            label="模型名称"
            rules={[{ required: true, message: '请选择模型' }]}
          >
            <Select
              placeholder="请选择AI模型"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableModels.map(modelName => (
                <Option key={modelName} value={modelName}>
                  {modelName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>模型配置参数（可选）</Text>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="最大Token数"
                  style={{ marginBottom: '8px' }}
                >
                  <Input 
                    id="max_tokens_input"
                    type="number" 
                    placeholder="如: 2000"
                    style={{ width: '100%' }}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        form.setFieldsValue({ 
                          config: { 
                            ...form.getFieldValue('config'), 
                            max_tokens: Number(value) 
                          } 
                        });
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="温度值"
                  style={{ marginBottom: '8px' }}
                >
                  <Input 
                    id="temperature_input"
                    type="number" 
                    placeholder="如: 0.7"
                    step="0.1"
                    min="0"
                    max="2"
                    style={{ width: '100%' }}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        form.setFieldsValue({ 
                          config: { 
                            ...form.getFieldValue('config'), 
                            temperature: Number(value) 
                          } 
                        });
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Text type="secondary">
              这些参数将保存到config字段中
            </Text>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>结构化输出（JSON Schema）</Text>
            <SchemaEditor
              value={responseFormat}
              onChange={setResponseFormat}
              stageName={form.getFieldValue('stage_name')}
            />
          </div>

          <Form.Item
            name="system_prompt"
            label="System Prompt"
            rules={[{ required: true, message: '请输入System Prompt' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="输入系统提示词..."
            />
          </Form.Item>

          <Form.Item
            name="user_prompt"
            label="User Prompt"
            rules={[{ required: true, message: '请输入User Prompt' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="输入用户提示词模板..."
            />
          </Form.Item>

          <Form.Item
            label="占位符说明"
          >
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
              <Text type="secondary">
                当前阶段支持的占位符：
              </Text>
              <br />
              {form.getFieldValue('stage_name') && 
                STAGE_PLACEHOLDERS[form.getFieldValue('stage_name') as keyof typeof STAGE_PLACEHOLDERS]?.map(ph => (
                  <Tag key={ph.key} style={{ margin: '4px' }}>
                    {ph.key}
                  </Tag>
                ))
              }
              <br />
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                这些占位符是根据阶段自动确定的，不可修改
              </Text>
            </div>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingConfig ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看配置模态框 */}
      <Modal
        title="查看配置详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={800}
      >
        {viewingConfig && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>阶段名称:</Text> {viewingConfig.stage_name}
              </Col>
              <Col span={12}>
                <Text strong>版本号:</Text> {viewingConfig.version}
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>模型名称:</Text> {viewingConfig.model_name}
              </Col>
              <Col span={12}>
                <Text strong>状态:</Text> 
                {viewingConfig.is_active ? (
                  <Tag color="green">激活版本</Tag>
                ) : (
                  <Tag>未激活</Tag>
                )}
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>最大Token数:</Text> 
                {viewingConfig.config?.max_tokens || '未设置'}
              </Col>
              <Col span={12}>
                <Text strong>温度值:</Text> 
                {viewingConfig.config?.temperature || '未设置'}
              </Col>
            </Row>
            <Divider />
            <div>
              <Text strong>结构化输出（JSON Schema）:</Text>
              <div style={{ marginTop: '8px' }}>
                <SchemaEditor
                  value={viewingConfig.response_format || null}
                  onChange={() => {}}
                  readonly
                />
              </div>
            </div>
            <Divider />
            <div>
              <Text strong>System Prompt:</Text>
              <div style={{ 
                padding: '12px', 
                background: '#f5f5f5', 
                borderRadius: '6px',
                marginTop: '8px',
                whiteSpace: 'pre-wrap'
              }}>
                {viewingConfig.system_prompt}
              </div>
            </div>
            <Divider />
            <div>
              <Text strong>User Prompt:</Text>
              <div style={{ 
                padding: '12px', 
                background: '#f5f5f5', 
                borderRadius: '6px',
                marginTop: '8px',
                whiteSpace: 'pre-wrap'
              }}>
                {viewingConfig.user_prompt}
              </div>
            </div>
            <Divider />
            <div>
              <Text strong>占位符:</Text>
              <div style={{ marginTop: '8px' }}>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(viewingConfig.placeholders, null, 2)}
                </pre>
              </div>
            </div>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>创建时间:</Text> {new Date(viewingConfig.created_at).toLocaleString()}
              </Col>
              <Col span={12}>
                <Text strong>更新时间:</Text> {new Date(viewingConfig.updated_at).toLocaleString()}
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PromptConfig;
