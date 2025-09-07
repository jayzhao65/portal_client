// src/pages/FlowTest.tsx
// 流程测试页面 - 完全模拟iOS的完整占卜流程

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
  Select,
  Row,
  Col,
  Typography,
  Divider,
  List,
  Badge,
  Tooltip,
  Tabs,
  InputNumber
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  SaveOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

// 导入问题扩写模块
import QuestionExpandModule from '../components/QuestionExpandModule';

// 导入占卜计算模块
import DivinationModule from '../components/DivinationModule';

// 导入现状分析模块
import SituationAnalysisModule from '../components/SituationAnalysisModule';
import AnswerGenerationModule from '../components/AnswerGenerationModule';
import FollowUpModule from '../components/FollowUpModule';

// 导入占位符显示模块
import PlaceholderDisplayModule from '../components/PlaceholderDisplayModule';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

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
}

// 阶段名称定义
const STAGE_NAMES = [
  "问题验证",
  "扩写/位置生成", 
  "现状分析",
  "占卜解读",
  "追问"
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
  ]
};

// 流程测试页面组件
function FlowTest() {
  // 状态管理
  const [configs, setConfigs] = useState<PromptConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // 当前选中的配置
  const [selectedConfig, setSelectedConfig] = useState<PromptConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState<PromptConfig | null>(null);
  
  // 全局保存配置状态
  const [globalEditingConfig, setGlobalEditingConfig] = useState<PromptConfig | null>(null);
  
  // 模态框状态
  const [saveVersionModalVisible, setSaveVersionModalVisible] = useState(false);
  const [saveVersionForm] = Form.useForm();
  
  // 问题输入状态
  const [question, setQuestion] = useState<string>('');
  
  // 问题扩写状态
  const [finalQuestion, setFinalQuestion] = useState<string>('');
  const [readingId, setReadingId] = useState<string>('');
  const [isExpanding, setIsExpanding] = useState(false);
  
  // 全局reading_id状态 - 第一个环节生成后自动填充到后续环节
  const [globalReadingId, setGlobalReadingId] = useState<string>('');
  
  // 测试状态
  const [testResults, setTestResults] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isProcessingYellow, setIsProcessingYellow] = useState(false);
  
  // 语言测试状态
  const [testLanguage, setTestLanguage] = useState<string>('zh'); // 默认中文测试

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

  // 选择配置版本
  const handleSelectConfig = (config: PromptConfig) => {
    setSelectedConfig(config);
    setEditingConfig({ ...config }); // 创建副本用于编辑
    message.success(`已选择 ${config.stage_name} 的 ${config.version} 版本，可以直接编辑`);
  };



  // 保存为新版本
  const handleSaveAsNewVersion = async (values: any) => {
    const configToSave = globalEditingConfig || editingConfig;
    if (!configToSave) {
      message.error('没有可保存的配置');
      return;
    }

    try {
      // 根据阶段名称自动设置占位符
      const stageName = configToSave.stage_name;
      const processedPlaceholders = (STAGE_PLACEHOLDERS[stageName as keyof typeof STAGE_PLACEHOLDERS] || []).map(ph => ph.key);
      
      const configData = {
        stage_name: configToSave.stage_name,
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
        setGlobalEditingConfig(null); // 清除全局配置
        fetchConfigs(); // 刷新配置列表
      } else {
        const errorData = await response.json();
        message.error(errorData.detail || '保存失败');
      }
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 运行测试
  const handleRunTest = async () => {
    if (!editingConfig) {
      message.warning('请先选择一个配置版本');
      return;
    }

    if (!question.trim()) {
      message.warning('请输入问题');
      return;
    }

    setIsTesting(true);
    const startTime = Date.now(); // 记录开始时间
    
    try {
      // 调用专门的问题验证测试API，使用选中的配置版本
      const response = await fetch(createApiUrl('/test/question/verify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024',
          'Accept-Language': testLanguage === 'zh' ? 'zh-CN,zh;q=0.9,en;q=0.8' : 'en-US,en;q=0.9,zh;q=0.8'
        },
        body: JSON.stringify({
          question: question.trim(),
          user_tags: [], // 暂时为空，后续可以添加标签输入
          prompt_config_id: editingConfig.id, // 传递选中的配置版本ID
          system_prompt: editingConfig.system_prompt, // 传递系统提示词
          user_prompt: editingConfig.user_prompt, // 传递用户提示词
          model_name: editingConfig.model_name, // 传递模型名称
          ai_model_config: editingConfig.config // 传递模型配置
        })
      });

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }

      const result = await response.json();
      const endTime = Date.now(); // 记录结束时间
      const responseTime = endTime - startTime; // 计算响应时长
      
      // 提取token信息（从API响应中获取）
      const tokenInfo = {
        promptTokens: result.test_info?.prompt_tokens || result.test_info?.input_tokens || 0,
        completionTokens: result.test_info?.completion_tokens || result.test_info?.output_tokens || 0,
        totalTokens: result.test_info?.total_tokens || 0
      };
      
      const testResult = {
        stage: editingConfig.stage_name,
        configVersion: editingConfig.version,
        model: editingConfig.model_name,
        config: editingConfig.config,
        systemPrompt: editingConfig.system_prompt,
        userPrompt: editingConfig.user_prompt,
        timestamp: new Date().toISOString(),
        responseTime: responseTime, // 响应时长（毫秒）
        tokenInfo: tokenInfo, // token统计信息
        apiResponse: result,
        question: question.trim(),
        testLanguage: testLanguage, // 记录测试语言
        acceptLanguage: testLanguage === 'zh' ? 'zh-CN,zh;q=0.9,en;q=0.8' : 'en-US,en;q=0.9,zh;q=0.8' // 记录Accept-Language头部
      };
      
      setTestResults((prev: any) => ({
        ...prev,
        [editingConfig.stage_name]: testResult
      }));
      
      // 如果生成了reading_id，自动设置到全局状态，供后续环节使用
      if (result.data?.reading_id) {
        setGlobalReadingId(result.data.reading_id);
        // 同时更新当前环节的reading_id输入框
        setReadingId(result.data.reading_id);
        message.success(`问题验证完成，已生成Reading ID: ${result.data.reading_id}`);
      } else {
        message.success('问题验证完成');
      }
      
      // 重置黄灯状态
      setSelectedOption('');
      setIsProcessingYellow(false);
    } catch (error) {
      message.error(`测试失败: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  // 处理黄灯状态下的选项选择
  const handleYellowLightOptionSelect = async () => {
    if (!selectedOption) {
      message.warning('请先选择一个选项');
      return;
    }

    const currentResult = testResults[editingConfig?.stage_name || ''];
    if (!currentResult?.apiResponse?.data?.reading_id) {
      message.error('缺少reading_id，无法处理选项选择');
      return;
    }

    setIsProcessingYellow(true);
    try {
      // 调用选择最终问题接口
      const response = await fetch(createApiUrl('/api/v1/question/select-final-question'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        },
        body: JSON.stringify({
          reading_id: currentResult.apiResponse.data.reading_id,
          final_question: selectedOption
        })
      });

      if (!response.ok) {
        throw new Error(`选择最终问题失败: ${response.status}`);
      }

      const result = await response.json();
      
      // 更新测试结果
      setTestResults((prev: any) => ({
        ...prev,
        [editingConfig?.stage_name || '']: {
          ...prev[editingConfig?.stage_name || ''],
          yellowLightResult: result,
          finalQuestion: selectedOption
        }
      }));
      
      message.success('最终问题选择成功');
      setSelectedOption('');
      setIsProcessingYellow(false);
    } catch (error) {
      message.error(`选择最终问题失败: ${error}`);
      setIsProcessingYellow(false);
    }
  };

  // 处理问题扩写
  const handleQuestionExpand = async () => {
    if (!editingConfig) {
      message.warning('请先选择一个配置版本');
      return;
    }

    if (!finalQuestion.trim()) {
      message.warning('请输入最终问题');
      return;
    }

    if (!readingId.trim()) {
      message.warning('请输入Reading ID');
      return;
    }

    setIsExpanding(true);
    const startTime = Date.now();
    
    try {
      // 调用问题扩写测试API
      const response = await fetch(createApiUrl('/test/question-expand/expand'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        },
        body: JSON.stringify({
          final_question: finalQuestion.trim(),
          reading_id: readingId.trim(),
          prompt_config_id: editingConfig.id,
          system_prompt: editingConfig.system_prompt,
          user_prompt: editingConfig.user_prompt,
          model_name: editingConfig.model_name,
          ai_model_config: editingConfig.config
        })
      });

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }

      const result = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 提取token信息（从API响应中获取）
      const tokenInfo = {
        promptTokens: result.test_info?.prompt_tokens || 0,
        completionTokens: result.test_info?.completion_tokens || 0,
        totalTokens: result.test_info?.total_tokens || 0
      };
      
      const expandResult = {
        stage: editingConfig.stage_name,
        configVersion: editingConfig.version,
        model: editingConfig.model_name,
        config: editingConfig.config,
        systemPrompt: editingConfig.system_prompt,
        userPrompt: editingConfig.user_prompt,
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
        tokenInfo: tokenInfo,
        apiResponse: result,
        finalQuestion: finalQuestion.trim(),
        readingId: readingId.trim()
      };
      
      setTestResults((prev: any) => ({
        ...prev,
        [editingConfig.stage_name]: expandResult
      }));
      
      message.success('问题扩写完成');
    } catch (error) {
      message.error(`问题扩写失败: ${error}`);
    } finally {
      setIsExpanding(false);
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

  // 渲染问题验证测试模块（第一个模块）
  const renderQuestionValidationModule = () => {
    const stageName = "问题验证";
    const stageConfigs = getConfigsByStage(stageName);
    const activeConfig = getActiveConfig(stageName);

    return (
      <Card
        title={
          <Space>
            <span>{stageName}测试模块</span>
            {activeConfig && (
              <Badge 
                status="success" 
                text={`当前激活: ${activeConfig.version}`}
              />
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {/* 问题输入、配置版本选择 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {/* 左侧：问题输入 */}
          <Col span={12}>
            <Card size="small" title="问题输入">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {/* 语言选择器 */}
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>测试语言:</Text>
                  <Select
                    value={testLanguage}
                    onChange={setTestLanguage}
                    style={{ width: '100%' }}
                    placeholder="选择测试语言"
                  >
                    <Option value="zh">中文 (zh-CN,zh;q=0.9,en;q=0.8)</Option>
                    <Option value="en">英文 (en-US,en;q=0.9,zh;q=0.8)</Option>
                  </Select>
                </div>
                
                <Input.TextArea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="请输入您的问题，例如：我最近工作压力很大，该怎么办？"
                  rows={4}
                  style={{ width: '100%' }}
                />
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={handleRunTest}
                  loading={isTesting}
                  disabled={!selectedConfig || !question.trim()}
                  style={{ width: '100%' }}
                >
                  开始验证
                </Button>
                <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
                  请先选择配置版本，然后输入问题开始验证
                </Text>
              </Space>
            </Card>
          </Col>

          {/* 右侧：配置版本选择 */}
          <Col span={12}>
            <Card size="small" title="配置版本选择">
              {stageConfigs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  暂无配置版本
                </div>
              ) : (
                <div style={{ 
                  maxHeight: '200px', 
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
                            onClick={() => handleSelectConfig(config)}
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
            </Card>
          </Col>
        </Row>

        {/* 配置编辑区域 */}
        {editingConfig && (
          <Card 
            title="配置编辑" 
            size="small" 
            style={{ marginTop: 16 }}
            extra={
              <Space>
                <Button 
                  icon={<SaveOutlined />}
                  onClick={() => setSaveVersionModalVisible(true)}
                >
                  保存为新版本
                </Button>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>System Prompt:</Text>
                  <TextArea
                    value={editingConfig.system_prompt}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingConfig((prev: PromptConfig | null) => prev ? {...prev, system_prompt: e.target.value} : null)}
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
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingConfig((prev: PromptConfig | null) => prev ? {...prev, user_prompt: e.target.value} : null)}
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
                    onChange={(value) => setEditingConfig((prev: PromptConfig | null) => prev ? {
                      ...prev, 
                      model_name: value
                    } : null)}
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
                        onChange={(value) => setEditingConfig((prev: PromptConfig | null) => prev ? {
                          ...prev, 
                          config: {...prev.config, max_tokens: value}
                        } : null)}
                        style={{ marginLeft: 8, width: 120 }}
                        placeholder="如: 2000"
                      />
                    </div>
                    <div>
                      <Text type="secondary">temperature:</Text>
                      <InputNumber
                        value={editingConfig.config?.temperature}
                        onChange={(value) => setEditingConfig((prev: PromptConfig | null) => prev ? {
                          ...prev, 
                          config: {...prev.config, temperature: value}
                        } : null)}
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
                    {STAGE_PLACEHOLDERS[stageName as keyof typeof STAGE_PLACEHOLDERS]?.map(ph => (
                      <Tag key={ph.key} style={{ margin: '4px' }}>
                        {ph.key}: {ph.description}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* 测试结果展示 */}
        {testResults[stageName] && (
          <Card title="测试结果" size="small" style={{ marginTop: 16 }}>
            {/* 最终问题选择结果 */}
            {testResults[stageName].finalQuestion && (
              <div style={{ marginBottom: 16, padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px', color: '#52c41a' }}>
                  ✅ 最终问题已选择
                </Text>
                <Text>{testResults[stageName].finalQuestion}</Text>
              </div>
            )}

            {/* 测试语言信息 */}
            <div style={{ marginBottom: '16px', padding: '16px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '6px' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px', color: '#1890ff' }}>
                🌍 测试语言
              </Text>
              <Text>
                当前测试语言: <Text strong>{testLanguage === 'zh' ? '中文' : 'English'}</Text>
                <br />
                Accept-Language: <Text code>{testLanguage === 'zh' ? 'zh-CN,zh;q=0.9,en;q=0.8' : 'en-US,en;q=0.9,zh;q=0.8'}</Text>
              </Text>
            </div>

            {/* 性能统计信息 */}
            {(testResults[stageName].responseTime || testResults[stageName].tokenInfo) && (
              <div style={{ marginBottom: '16px', padding: '16px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '6px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px', color: '#d48806' }}>
                  📊 性能统计
                </Text>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    {testResults[stageName].responseTime && (
                      <>
                        <Text type="secondary">响应时长: </Text>
                        <Text strong style={{ color: (testResults[stageName].responseTime / 1000) < 1 ? '#52c41a' : (testResults[stageName].responseTime / 1000) < 3 ? '#faad14' : '#f5222d' }}>
                          {(testResults[stageName].responseTime / 1000).toFixed(2)}s
                        </Text>
                        <br />
                      </>
                    )}
                    {testResults[stageName].tokenInfo?.totalTokens > 0 && (
                      <>
                        <Text type="secondary">总Token数: </Text>
                        <Text strong>{testResults[stageName].tokenInfo.totalTokens}</Text>
                        <br />
                      </>
                    )}
                  </Col>
                  <Col span={12}>
                    {testResults[stageName].tokenInfo?.promptTokens > 0 && (
                      <>
                        <Text type="secondary">输入Token: </Text>
                        <Text type="secondary">{testResults[stageName].tokenInfo.promptTokens}</Text>
                        <br />
                      </>
                    )}
                    {testResults[stageName].tokenInfo?.completionTokens > 0 && (
                      <>
                        <Text type="secondary">输出Token: </Text>
                        <Text type="secondary">{testResults[stageName].tokenInfo.completionTokens}</Text>
                      </>
                    )}
                  </Col>
                </Row>
              </div>
            )}

            {/* 黄灯状态下的选项选择 */}
            {testResults[stageName].apiResponse?.data?.light_color === 'yellow' && 
             testResults[stageName].apiResponse?.data?.options && (
              <div style={{ marginBottom: 16, padding: '16px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '6px' }}>
                <Text strong style={{ display: 'block', marginBottom: '12px', color: '#d48806' }}>
                  🟡 黄灯状态：请选择或确认最终问题
                </Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                  {testResults[stageName].apiResponse.data.reason}
                </Text>
                
                {/* 推荐选项 */}
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>推荐选项：</Text>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {testResults[stageName].apiResponse.data.options.map((option: string, index: number) => (
                      <Button
                        key={index}
                        type={selectedOption === option ? "primary" : "default"}
                        onClick={() => setSelectedOption(option)}
                        style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                      >
                        {option}
                      </Button>
                    ))}
                  </Space>
                </div>
                
                {/* 确认按钮 */}
                <Button
                  type="primary"
                  onClick={handleYellowLightOptionSelect}
                  loading={isProcessingYellow}
                  disabled={!selectedOption}
                  style={{ width: '100%' }}
                >
                  {isProcessingYellow ? '处理中...' : '确认选择'}
                </Button>
              </div>
            )}
            
            {/* 模型原始返回体和API响应结果并排显示 */}
            <Row gutter={[16, 16]}>
              {/* 左侧：模型原始返回体 */}
              <Col span={12}>
                <div style={{ padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px', height: '100%' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px', color: '#52c41a' }}>
                    🤖 模型原始返回体
                  </Text>
                  <div style={{ 
                    fontSize: '12px', 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    border: '1px solid #d9d9d9'
                  }}>
                    {testResults[stageName].apiResponse?.data?.ai_raw_response || 
                     testResults[stageName].apiResponse?.data?.raw_response || 
                     '未获取到原始响应'}
                  </div>
                </div>
              </Col>

              {/* 右侧：API响应结果 */}
              <Col span={12}>
                <div style={{ padding: '16px', background: '#f0f8ff', border: '1px solid #91d5ff', borderRadius: '6px', height: '100%' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px', color: '#1890ff' }}>
                    📋 API 响应结果
                  </Text>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '6px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    fontSize: '12px',
                    margin: 0
                  }}>
                    {(() => {
                      const data = testResults[stageName].apiResponse?.data || {};
                      // 只显示核心的四个字段
                      const coreData = {
                        light_color: data.light_color,
                        reason: data.reason,
                        options: data.options,
                        reading_id: data.reading_id
                      };
                      return JSON.stringify(coreData, null, 2);
                    })()}
                  </pre>
                </div>
              </Col>
            </Row>
          </Card>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>流程测试工作台</Title>
      <Text type="secondary">
        完全模拟iOS的完整占卜流程，每一步输入输出都清晰可见，用于prompt调整和模型测试
      </Text>
      
      <Divider />
      
      {/* 标签页 */}
      <Tabs defaultActiveKey="flow-test">
        <TabPane tab="流程测试" key="flow-test">
          {/* 问题验证测试模块（第一个模块） */}
          {renderQuestionValidationModule()}
          
          {/* 问题扩写测试模块（第二个模块） */}
          <QuestionExpandModule
            configs={configs}
            availableModels={availableModels}
            onSaveAsNewVersion={handleSaveAsNewVersion}
            testResults={testResults}
            setTestResults={setTestResults}
            setSaveVersionModalVisible={setSaveVersionModalVisible}
            setGlobalEditingConfig={setGlobalEditingConfig}
            globalReadingId={globalReadingId}
          />
          
          {/* 占卜计算测试模块（第三个模块） */}
          <DivinationModule
            testResults={testResults}
            setTestResults={setTestResults}
            globalReadingId={globalReadingId}
          />
          
          {/* 现状分析测试模块（第四个模块） */}
          <SituationAnalysisModule
            configs={configs}
            availableModels={availableModels}
            onSaveAsNewVersion={handleSaveAsNewVersion}
            testResults={testResults}
            setTestResults={setTestResults}
            setSaveVersionModalVisible={setSaveVersionModalVisible}
            setGlobalEditingConfig={setGlobalEditingConfig}
            globalReadingId={globalReadingId}
          />
          
          {/* 占卜解读测试模块（第五个模块） */}
          <AnswerGenerationModule
            configs={configs}
            availableModels={availableModels}
            onSaveAsNewVersion={handleSaveAsNewVersion}
            testResults={testResults}
            setTestResults={setTestResults}
            setSaveVersionModalVisible={setSaveVersionModalVisible}
            setGlobalEditingConfig={setGlobalEditingConfig}
            globalReadingId={globalReadingId}
          />
          
          {/* 追问测试模块（第六个模块） */}
          <FollowUpModule
            configs={configs}
            availableModels={availableModels}
            testResults={testResults}
            setTestResults={setTestResults}
            setSaveVersionModalVisible={setSaveVersionModalVisible}
            setGlobalEditingConfig={setGlobalEditingConfig}
            globalReadingId={globalReadingId}
          />
          
          {/* 其他模块待开发 */}
          <Card title="其他测试模块" style={{ marginTop: 16 }}>
            <Text type="secondary">
              所有核心模块已完成开发！
            </Text>
          </Card>
        </TabPane>
        
        <TabPane tab="Prompt管理" key="prompt-config">
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            请切换到"Prompt管理"页面进行配置管理
          </div>
        </TabPane>
      </Tabs>

      {/* 保存为新版本模态框 */}
      <Modal
        title="保存为新版本"
        open={saveVersionModalVisible}
        onCancel={() => {
          setSaveVersionModalVisible(false);
          setGlobalEditingConfig(null); // 清除全局配置
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
              <Button onClick={() => setSaveVersionModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default FlowTest;
