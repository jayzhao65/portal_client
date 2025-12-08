// src/pages/ImageDivination.tsx
// 图片起卦测试页面 - 上传图片进行占卜

import { useState, useEffect } from 'react';
import { createApiUrl, API_ENDPOINTS } from '../config/api';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button,
  Input,
  Upload,
  Space,
  Divider,
  Alert,
  Spin,
  message,
  Image,
  Select,
  Modal,
  Form,
  List,
  Badge,
  Tag,
  InputNumber
} from 'antd';
import { 
  PictureOutlined, 
  ThunderboltOutlined,
  UploadOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ===========================================
// 数据类型定义
// ===========================================

// 计算过程数据结构
interface CalculationProcess {
  upper_gua_num: number;          // 上卦数字 (1-8)
  upper_gua_name: string;         // 上卦名称（单卦）
  upper_gua_reason: string;       // 上卦识别原因
  lower_gua_num: number;          // 下卦数字 (1-8)
  lower_gua_name: string;         // 下卦名称（单卦）
  moving_line_idx: number;        // 动爻位置 (1-6)
  time_num: number;               // 时辰数 (1-12)
  hour: number;                   // 用户当地小时数 (0-23)
  timezone_offset_minutes: number;// 时区偏移
  ben_gua_binary: string;         // 本卦六爻二进制
  ben_gua_name?: string;          // 本卦名称（64卦）
  ben_gua_ci?: string;            // 本卦卦辞
  ben_gua_prompt?: string;        // 本卦提示
  ben_gua_front_url?: string;     // 本卦正面图片
  ben_gua_back_url?: string;      // 本卦背面图片
  zhi_gua_binary: string;         // 之卦六爻二进制
  zhi_gua_name?: string;          // 之卦名称（64卦）
  zhi_gua_ci?: string;            // 之卦卦辞
  zhi_gua_prompt?: string;        // 之卦提示
  zhi_gua_front_url?: string;     // 之卦正面图片
  zhi_gua_back_url?: string;      // 之卦背面图片
  moving_yao_name?: string;       // 变爻名称
  moving_yao_prompt?: string;     // 变爻提示
  moving_yao_front_url?: string;  // 变爻正面图片
  moving_yao_back_url?: string;   // 变爻背面图片
}

// 第一阶段响应
interface IdentifyResponse {
  success: boolean;
  data?: {
    calculation_process: CalculationProcess;
  };
  message: string;
  test_info?: Record<string, any>;
}

// 第二阶段响应
interface InterpretResponse {
  success: boolean;
  data?: {
    simple_answer: string;
    full_explanation: string;
  };
  message: string;
  test_info?: Record<string, any>;
}

// Prompt配置数据类型
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
}

// ===========================================
// 图片起卦测试组件
// ===========================================

function ImageDivination() {
  const formatTimezone = (offsetMinutes?: number) => {
    if (offsetMinutes === undefined || offsetMinutes === null) return '未知';
    const hours = -(offsetMinutes / 60);
    const sign = hours >= 0 ? '+' : '-';
    const absHours = Math.abs(hours);
    const whole = Math.floor(absHours);
    const minutes = Math.abs(offsetMinutes % 60);
    const minuteStr = minutes ? `:${minutes.toString().padStart(2, '0')}` : '';
    return `UTC${sign}${whole}${minuteStr}`;
  };
  // ========== 状态管理 ==========
  // 输入状态
  const [intentTag, setIntentTag] = useState<string>('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // 流程状态
  const [stage, setStage] = useState<'idle' | 'identifying' | 'identified' | 'interpreting' | 'complete'>('idle');
  const [loading, setLoading] = useState(false);
  
  // 结果状态
  const [calculationProcess, setCalculationProcess] = useState<CalculationProcess | null>(null);
  const [simpleAnswer, setSimpleAnswer] = useState<string>('');
  const [fullExplanation, setFullExplanation] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // 配置管理状态
  const [configs, setConfigs] = useState<PromptConfig[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedIdentifyConfig, setSelectedIdentifyConfig] = useState<PromptConfig | null>(null);
  const [editingIdentifyConfig, setEditingIdentifyConfig] = useState<PromptConfig | null>(null);
  const [selectedInterpretConfig, setSelectedInterpretConfig] = useState<PromptConfig | null>(null);
  const [editingInterpretConfig, setEditingInterpretConfig] = useState<PromptConfig | null>(null);
  const [saveVersionModalVisible, setSaveVersionModalVisible] = useState(false);
  const [saveVersionForm] = Form.useForm();
  const [savingStage, setSavingStage] = useState<'identify' | 'interpret' | null>(null);

  // ========== 配置管理 ==========
  
  // 获取所有配置
  const fetchConfigs = async () => {
    try {
      const response = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIGS), {
        headers: {
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfigs(data.data || []);
        }
      }
    } catch (error) {
      console.error('获取配置失败:', error);
    }
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
        }
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

  // 获取指定阶段的配置
  const getConfigsByStage = (stageName: string) => {
    return configs.filter(config => config.stage_name === stageName);
  };

  // 选择配置版本
  const handleSelectIdentifyConfig = (config: PromptConfig) => {
    setSelectedIdentifyConfig(config);
    setEditingIdentifyConfig({ ...config });
    message.success(`已选择图片识别配置: ${config.version}`);
  };

  const handleSelectInterpretConfig = (config: PromptConfig) => {
    setSelectedInterpretConfig(config);
    setEditingInterpretConfig({ ...config });
    message.success(`已选择卦象解读配置: ${config.version}`);
  };

  // 保存为新版本
  const handleSaveAsNewVersion = async (values: any) => {
    const configToSave = savingStage === 'identify' ? editingIdentifyConfig : editingInterpretConfig;
    if (!configToSave) {
      message.error('没有可保存的配置');
      return;
    }

    try {
      const stageName = configToSave.stage_name;
      const processedPlaceholders = (configToSave.placeholders || []).map((ph: any) => 
        typeof ph === 'string' ? ph : ph.key
      );
      
      const configData = {
        stage_name: stageName,
        version: values.version,
        system_prompt: configToSave.system_prompt,
        user_prompt: configToSave.user_prompt,
        placeholders: processedPlaceholders,
        model_name: configToSave.model_name,
        config: configToSave.config,
        is_active: false
      };

      const response = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIGS), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        },
        body: JSON.stringify(configData)
      });

      if (response.ok) {
        message.success('新版本保存成功');
        setSaveVersionModalVisible(false);
        setSavingStage(null);
        fetchConfigs();
      } else {
        const errorData = await response.json();
        message.error(errorData.detail || '保存失败');
      }
    } catch (error) {
      message.error('保存失败');
    }
  };

  // ========== 图片处理 ==========
  
  // 将图片转换为 Base64
  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // 处理图片上传
  const handleUpload = async (file: RcFile) => {
    try {
      // 验证文件类型
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      
      // 验证文件大小（最大 10MB）
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('图片大小不能超过 10MB！');
        return false;
      }
      
      // 转换为 Base64
      const base64 = await getBase64(file);
      setImageBase64(base64);
      setPreviewUrl(base64);
      
      // 更新文件列表
      setFileList([{
        uid: '-1',
        name: file.name,
        status: 'done',
        originFileObj: file,
      }]);
      
      // 重置结果
      setCalculationProcess(null);
      setSimpleAnswer('');
      setFullExplanation('');
      setError('');
      setStage('idle');
      
      message.success('图片上传成功！');
      return false; // 阻止默认上传行为
      
    } catch (err) {
      message.error('图片处理失败');
      return false;
    }
  };

  // ========== API 调用 ==========
  
  // 第一阶段：图片识别（不需要用户意图，纯粹基于图片内容）
  const handleIdentify = async () => {
    // 验证输入
    if (!imageBase64) {
      setError('请先上传图片');
      return;
    }
    
    setLoading(true);
    setError('');
    setStage('identifying');
    
    try {
      const timestamp = Date.now();
      // 获取用户时区偏移（分钟），东八区返回 -480
      const timezoneOffsetMinutes = new Date().getTimezoneOffset();
      
      const response = await fetch(createApiUrl('/test/image-divination/identify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        body: JSON.stringify({
          image_base64: imageBase64,
          timestamp: timestamp,
          timezone_offset_minutes: timezoneOffsetMinutes,
          language: 'zh',
          // 如果选择了配置，传递配置参数（覆盖数据库配置）
          ...(editingIdentifyConfig ? {
            prompt_config_id: editingIdentifyConfig.id,
            system_prompt: editingIdentifyConfig.system_prompt,
            user_prompt: editingIdentifyConfig.user_prompt,
            model_name: editingIdentifyConfig.model_name,
            ai_model_config: editingIdentifyConfig.config
          } : {})
        }),
      });
      
      const data: IdentifyResponse = await response.json();
      
      if (data.success && data.data) {
        setCalculationProcess(data.data.calculation_process);
        setStage('identified');
        message.success('图片识别成功！');
        console.log('✅ 识别结果:', data.data.calculation_process);
      } else {
        setError(data.message || '图片识别失败');
        setStage('idle');
      }
      
    } catch (err) {
      console.error('❌ 识别请求失败:', err);
      setError('网络请求失败，请检查后端服务');
      setStage('idle');
    } finally {
      setLoading(false);
    }
  };
  
  // 第二阶段：卦象解读（需要用户意图）
  const handleInterpret = async () => {
    if (!calculationProcess) {
      setError('请先完成图片识别');
      return;
    }
    if (!intentTag.trim()) {
      setError('请输入意图标签（用于生成针对性解读）');
      return;
    }
    
    setLoading(true);
    setError('');
    setStage('interpreting');
    
    try {
      const response = await fetch(createApiUrl('/test/image-divination/interpret'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        body: JSON.stringify({
          intent_tag: intentTag.trim(),
          ben_gua_binary: calculationProcess.ben_gua_binary,
          zhi_gua_binary: calculationProcess.zhi_gua_binary,
          moving_line_idx: calculationProcess.moving_line_idx,
          upper_gua_reason: calculationProcess.upper_gua_reason,
          language: 'zh',
          // 如果选择了配置，传递配置参数（覆盖数据库配置）
          ...(editingInterpretConfig ? {
            prompt_config_id: editingInterpretConfig.id,
            system_prompt: editingInterpretConfig.system_prompt,
            user_prompt: editingInterpretConfig.user_prompt,
            model_name: editingInterpretConfig.model_name,
            ai_model_config: editingInterpretConfig.config
          } : {})
        }),
      });
      
      const data: InterpretResponse = await response.json();
      
      if (data.success && data.data) {
        setSimpleAnswer(data.data.simple_answer);
        setFullExplanation(data.data.full_explanation);
        setStage('complete');
        message.success('卦象解读完成！');
        console.log('✅ 解读结果:', data.data);
      } else {
        setError(data.message || '卦象解读失败');
        setStage('identified');
      }
      
    } catch (err) {
      console.error('❌ 解读请求失败:', err);
      setError('网络请求失败，请检查后端服务');
      setStage('identified');
    } finally {
      setLoading(false);
    }
  };
  
  // 重置所有状态
  const handleReset = () => {
    setIntentTag('');
    setFileList([]);
    setImageBase64('');
    setPreviewUrl('');
    setCalculationProcess(null);
    setSimpleAnswer('');
    setFullExplanation('');
    setError('');
    setStage('idle');
  };

  // ========== 渲染组件 ==========
  
  // ========== 渲染配置管理模块 ==========
  
  const renderConfigModule = (stageName: string, selectedConfig: PromptConfig | null, editingConfig: PromptConfig | null, 
                              onSelect: (config: PromptConfig) => void, setEditingConfig: (config: PromptConfig | null) => void) => {
    const stageConfigs = getConfigsByStage(stageName);
    const activeConfig = configs.find(config => config.stage_name === stageName && config.is_active);

    return (
      <Card 
        title={
          <Space>
            <span>{stageName}配置</span>
            {activeConfig && (
              <Badge 
                status="success" 
                text={`当前激活: ${activeConfig.version}`}
              />
            )}
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        {/* 配置版本选择 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>选择配置版本:</Text>
          {stageConfigs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              暂无配置版本
            </div>
          ) : (
            <div style={{ 
              maxHeight: '150px', 
              overflowY: 'auto',
              border: '1px solid #f0f0f0',
              borderRadius: '6px',
              padding: '8px'
            }}>
              <List
                size="small"
                dataSource={stageConfigs}
                renderItem={(config) => (
                  <List.Item
                    style={{ padding: '8px 0' }}
                    actions={[
                      <Button
                        key="select"
                        type={selectedConfig?.id === config.id ? "primary" : "default"}
                        size="small"
                        onClick={() => onSelect(config)}
                      >
                        {selectedConfig?.id === config.id ? "已选择" : "选择"}
                      </Button>
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
                          <Text>模型: {config.model_name}</Text>
                          <Text type="secondary">
                            配置: {config.config?.max_tokens ? `max_tokens: ${config.config.max_tokens}` : ''} 
                            {config.config?.temperature ? `temperature: ${config.config.temperature}` : ''}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>

        {/* 配置编辑区域 */}
        {editingConfig && (
          <div>
            <Divider />
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>配置编辑</Text>
              <Button 
                icon={<SaveOutlined />}
                onClick={() => {
                  setSavingStage(stageName === '图片识别' ? 'identify' : 'interpret');
                  setSaveVersionModalVisible(true);
                }}
              >
                保存为新版本
              </Button>
            </div>
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>System Prompt:</Text>
                  <TextArea
                    value={editingConfig.system_prompt}
                    onChange={(e) => setEditingConfig({ ...editingConfig, system_prompt: e.target.value })}
                    rows={4}
                    style={{ marginTop: 8 }}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>User Prompt:</Text>
                  <TextArea
                    value={editingConfig.user_prompt}
                    onChange={(e) => setEditingConfig({ ...editingConfig, user_prompt: e.target.value })}
                    rows={4}
                    style={{ marginTop: 8 }}
                  />
                </div>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>模型选择:</Text>
                  <Select
                    value={editingConfig.model_name}
                    onChange={(value) => setEditingConfig({ ...editingConfig, model_name: value })}
                    style={{ marginTop: 8, width: '100%' }}
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
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong>模型配置:</Text>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">max_tokens:</Text>
                      <InputNumber
                        value={editingConfig.config?.max_tokens}
                        onChange={(value) => setEditingConfig({ 
                          ...editingConfig, 
                          config: {...editingConfig.config, max_tokens: value}
                        })}
                        style={{ marginLeft: 8, width: 120 }}
                        placeholder="如: 2000"
                      />
                    </div>
                    <div>
                      <Text type="secondary">temperature:</Text>
                      <InputNumber
                        value={editingConfig.config?.temperature}
                        onChange={(value) => setEditingConfig({ 
                          ...editingConfig, 
                          config: {...editingConfig.config, temperature: value}
                        })}
                        style={{ marginLeft: 8, width: 120 }}
                        placeholder="如: 0.7"
                        step={0.1}
                        min={0}
                        max={2}
                      />
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>占位符说明:</Text>
                  <div style={{ marginTop: 8 }}>
                    {(editingConfig.placeholders || []).map((ph: any, index: number) => {
                      const key = typeof ph === 'string' ? ph : ph.key;
                      const desc = typeof ph === 'string' ? ph : ph.description;
                      return (
                        <Tag key={index} style={{ margin: '4px' }}>
                          {key}: {desc || key}
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ 
      padding: '16px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '16px' }}>
        <PictureOutlined /> 图片起卦测试
      </Title>
      
      <Paragraph style={{ textAlign: 'center', marginBottom: '24px' }}>
        上传图片，系统通过梅花易数"观物取象"的方法进行占卜
      </Paragraph>

      {/* ========== Prompt配置管理 ========== */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={12}>
          {/* 图片识别配置 */}
          {renderConfigModule(
            '图片识别',
            selectedIdentifyConfig,
            editingIdentifyConfig,
            handleSelectIdentifyConfig,
            setEditingIdentifyConfig
          )}
        </Col>
        <Col xs={24} lg={12}>
          {/* 卦象解读配置 */}
          {renderConfigModule(
            '卦象解读',
            selectedInterpretConfig,
            editingInterpretConfig,
            handleSelectInterpretConfig,
            setEditingInterpretConfig
          )}
        </Col>
      </Row>

      <Divider />

      {/* ========== 输入区域 ========== */}
      <Card title="第一步：上传图片" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          {/* 图片上传 */}
          <Col xs={24} md={12}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>选择图片</Text>
            </div>
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={handleUpload}
              onRemove={() => {
                setFileList([]);
                setImageBase64('');
                setPreviewUrl('');
              }}
              accept="image/*"
              maxCount={1}
            >
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>点击上传</div>
                </div>
              )}
            </Upload>
            
            {/* 图片预览 */}
            {previewUrl && (
              <div style={{ marginTop: '16px' }}>
                <Image
                  src={previewUrl}
                  alt="预览图片"
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                />
              </div>
            )}
          </Col>
          
          {/* 意图输入（第二阶段使用） */}
          <Col xs={24} md={12}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>意图标签</Text>
              <Text type="secondary" style={{ marginLeft: '8px' }}>
                （用于第二阶段解读）
              </Text>
            </div>
            <Input
              placeholder="例如：事业发展、感情运势、财运、健康..."
              value={intentTag}
              onChange={(e) => setIntentTag(e.target.value)}
              size="large"
              disabled={loading}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              意图标签用于第二阶段解读，帮助AI更准确地理解您的问题方向
            </div>
          </Col>
        </Row>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Space size="large">
            <Button 
              type="primary" 
              onClick={handleIdentify}
              loading={loading && stage === 'identifying'}
              disabled={!imageBase64 || loading}
              icon={<ThunderboltOutlined />}
              size="large"
              style={{ minWidth: '140px' }}
            >
              开始识别
            </Button>
            <Button 
              onClick={handleReset}
              size="large"
              icon={<ReloadOutlined />}
              disabled={loading}
              style={{ minWidth: '80px' }}
            >
              重置
            </Button>
          </Space>
        </div>
      </Card>

      {/* ========== 错误提示 ========== */}
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          style={{ marginBottom: '16px' }}
          showIcon
          closable
          onClose={() => setError('')}
        />
      )}

      {/* ========== 识别结果（阶段1） ========== */}
      {calculationProcess && (
        <Card 
          title="第二步：识别结果（计算过程）" 
          style={{ marginBottom: '16px' }}
          extra={
            <Button 
              type="primary"
              onClick={handleInterpret}
              loading={loading && stage === 'interpreting'}
              disabled={loading || stage === 'complete' || !intentTag.trim()}
              icon={<ThunderboltOutlined />}
            >
              开始解卦
            </Button>
          }
        >
          {/* 识别原因 */}
          <Alert
            message="AI识别分析"
            description={calculationProcess.upper_gua_reason}
            type="info"
            style={{ marginBottom: '16px' }}
            showIcon
          />
          
          <Row gutter={[16, 16]}>
            {/* 上卦信息 */}
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" title="上卦（图片）">
                <p><Text strong>数字：</Text>{calculationProcess.upper_gua_num}</p>
                <p><Text strong>名称：</Text>{calculationProcess.upper_gua_name}</p>
              </Card>
            </Col>
            
            {/* 下卦信息 */}
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" title="下卦（时辰）">
                <p><Text strong>数字：</Text>{calculationProcess.lower_gua_num}</p>
                <p><Text strong>名称：</Text>{calculationProcess.lower_gua_name}</p>
                <p><Text strong>时辰数：</Text>{calculationProcess.time_num}</p>
                <p><Text strong>当地小时：</Text>{calculationProcess.hour}:00</p>
                <p><Text strong>时区：</Text>{formatTimezone(calculationProcess.timezone_offset_minutes)}</p>
              </Card>
            </Col>
            
            {/* 本卦信息 */}
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" title="本卦">
                <p><Text strong>卦名：</Text><Text mark>{calculationProcess.ben_gua_name}</Text></p>
                <p><Text strong>二进制：</Text><Text code>{calculationProcess.ben_gua_binary}</Text></p>
                {calculationProcess.ben_gua_ci && (
                  <Paragraph style={{ marginBottom: 8 }}>
                    <Text strong>卦辞：</Text>{calculationProcess.ben_gua_ci}
                  </Paragraph>
                )}
                {calculationProcess.ben_gua_prompt && (
                  <Paragraph style={{ fontSize: 12, color: '#666' }}>
                    {calculationProcess.ben_gua_prompt}
                  </Paragraph>
                )}
                <Space size="small">
                  {calculationProcess.ben_gua_front_url && (
                    <Image
                      width={80}
                      src={calculationProcess.ben_gua_front_url}
                      alt="本卦正面"
                      placeholder
                    />
                  )}
                  {calculationProcess.ben_gua_back_url && (
                    <Image
                      width={80}
                      src={calculationProcess.ben_gua_back_url}
                      alt="本卦背面"
                      placeholder
                    />
                  )}
                </Space>
              </Card>
            </Col>
            
            {/* 之卦信息 */}
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" title="之卦">
                <p><Text strong>卦名：</Text><Text mark>{calculationProcess.zhi_gua_name}</Text></p>
                <p><Text strong>二进制：</Text><Text code>{calculationProcess.zhi_gua_binary}</Text></p>
                {calculationProcess.zhi_gua_ci && (
                  <Paragraph style={{ marginBottom: 8 }}>
                    <Text strong>卦辞：</Text>{calculationProcess.zhi_gua_ci}
                  </Paragraph>
                )}
                {calculationProcess.zhi_gua_prompt && (
                  <Paragraph style={{ fontSize: 12, color: '#666' }}>
                    {calculationProcess.zhi_gua_prompt}
                  </Paragraph>
                )}
                <Space size="small">
                  {calculationProcess.zhi_gua_front_url && (
                    <Image
                      width={80}
                      src={calculationProcess.zhi_gua_front_url}
                      alt="之卦正面"
                      placeholder
                    />
                  )}
                  {calculationProcess.zhi_gua_back_url && (
                    <Image
                      width={80}
                      src={calculationProcess.zhi_gua_back_url}
                      alt="之卦背面"
                      placeholder
                    />
                  )}
                </Space>
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          {/* 动爻信息 */}
          <Card size="small" title="变爻详情" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>位置：</Text>第 {calculationProcess.moving_line_idx} 爻
              </div>
              {calculationProcess.moving_yao_name && (
                <div>
                  <Text strong>名称：</Text>{calculationProcess.moving_yao_name}
                </div>
              )}
              {calculationProcess.moving_yao_prompt && (
                <Paragraph style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  {calculationProcess.moving_yao_prompt}
                </Paragraph>
              )}
              <Space size="small">
                {calculationProcess.moving_yao_front_url && (
                  <Image
                    width={80}
                    src={calculationProcess.moving_yao_front_url}
                    alt="变爻正面"
                    placeholder
                  />
                )}
                {calculationProcess.moving_yao_back_url && (
                  <Image
                    width={80}
                    src={calculationProcess.moving_yao_back_url}
                    alt="变爻背面"
                    placeholder
                  />
                )}
              </Space>
            </Space>
          </Card>
        </Card>
      )}

      {/* ========== 解读结果（阶段2） ========== */}
      {stage === 'complete' && (
        <Card title="第三步：卦象解读" style={{ marginBottom: '16px' }}>
          {/* 简短答案 */}
          <Alert
            message="简短答案"
            description={
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {simpleAnswer}
              </div>
            }
            type="success"
            style={{ marginBottom: '16px' }}
            showIcon
          />
          
          {/* 完整解释 */}
          <Card size="small" title="完整解释">
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
              {fullExplanation}
            </Paragraph>
          </Card>
        </Card>
      )}

      {/* ========== 加载中提示 ========== */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          background: 'rgba(255,255,255,0.8)',
          borderRadius: '8px'
        }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            {stage === 'identifying' ? '正在识别图片...' : '正在生成解读...'}
          </div>
        </div>
      )}

      {/* 保存为新版本模态框 */}
      <Modal
        title="保存为新版本"
        open={saveVersionModalVisible}
        onCancel={() => {
          setSaveVersionModalVisible(false);
          setSavingStage(null);
        }}
        footer={null}
      >
        <Form
          form={saveVersionForm}
          layout="vertical"
          onFinish={handleSaveAsNewVersion}
        >
          <Form.Item
            name="version"
            label="新版本号"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="如: v1.1.0" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => {
                setSaveVersionModalVisible(false);
                setSavingStage(null);
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ImageDivination;

