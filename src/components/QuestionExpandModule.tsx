// src/components/QuestionExpandModule.tsx
// 问题扩写测试模块组件

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Space, 
  message,
  Row,
  Col,
  Typography,
  List,
  Badge,
  Tag,
  Alert,
  Divider
} from 'antd';
import { 
  PlayCircleOutlined,
  SaveOutlined
} from '@ant-design/icons';

// 导入API配置
import { createApiUrl } from '../config/api';

const { Title, Text } = Typography;
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

// 问题扩写模块组件
interface QuestionExpandModuleProps {
  configs: PromptConfig[];
  availableModels: string[];
  onSaveAsNewVersion: (values: any) => Promise<void>;
  testResults: any;
  setTestResults: (results: any) => void;
  setSaveVersionModalVisible: (visible: boolean) => void;
  setGlobalEditingConfig: (config: PromptConfig | null) => void;
  globalReadingId: string; // 添加全局reading_id参数
}

const QuestionExpandModule: React.FC<QuestionExpandModuleProps> = ({
  configs,
  availableModels,
  onSaveAsNewVersion,
  testResults,
  setTestResults,
  setSaveVersionModalVisible,
  setGlobalEditingConfig,
  globalReadingId
}) => {
  // 模块内部状态管理
  const [selectedConfig, setSelectedConfig] = useState<PromptConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState<PromptConfig | null>(null);
  
  // 本地状态
  const [finalQuestion, setFinalQuestion] = useState<string>('');
  const [readingId, setReadingId] = useState<string>(globalReadingId); // 使用全局reading_id作为默认值
  const [isExpanding, setIsExpanding] = useState(false);

  // 阶段名称和占位符
  const stageName = "扩写/位置生成";
  const stageConfigs = configs.filter(config => config.stage_name === stageName);
  const activeConfig = configs.find(config => config.stage_name === stageName && config.is_active);

  // 监听globalReadingId的变化
  useEffect(() => {
    setReadingId(globalReadingId);
  }, [globalReadingId]);

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
      
      const expandResult = {
        stage: editingConfig.stage_name,
        configVersion: editingConfig.version,
        model: editingConfig.model_name,
        config: editingConfig.config,
        systemPrompt: editingConfig.system_prompt,
        userPrompt: editingConfig.user_prompt,
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
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

  // 渲染配置编辑区域
  const renderConfigEditor = () => {
    if (!editingConfig) return null;

    return (
      <Card 
        title="配置编辑" 
        size="small" 
        style={{ marginTop: 16 }}
        extra={
          <Button 
            icon={<SaveOutlined />}
            onClick={() => {
              // 设置全局编辑配置，然后打开保存模态框
              setGlobalEditingConfig(editingConfig);
              setSaveVersionModalVisible(true);
            }}
          >
            保存为新版本
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>System Prompt:</Text>
              <TextArea
                value={editingConfig.system_prompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingConfig({
                  ...editingConfig, 
                  system_prompt: e.target.value
                })}
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
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingConfig({
                  ...editingConfig, 
                  user_prompt: e.target.value
                })}
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
              <select
                value={editingConfig.model_name}
                onChange={(e) => setEditingConfig({
                  ...editingConfig, 
                  model_name: e.target.value
                })}
                style={{ marginTop: 8, width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d9d9d9' }}
              >
                {availableModels.map(modelName => (
                  <option key={modelName} value={modelName}>
                    {modelName}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>模型配置:</Text>
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">max_tokens:</Text>
                  <input
                    type="number"
                    value={editingConfig.config?.max_tokens || ''}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig, 
                      config: {...editingConfig.config, max_tokens: parseInt(e.target.value) || undefined}
                    })}
                    style={{ marginLeft: 8, width: 120, padding: '4px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                    placeholder="如: 2000"
                  />
                </div>
                <div>
                  <Text type="secondary">temperature:</Text>
                  <input
                    type="number"
                    value={editingConfig.config?.temperature || ''}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig, 
                      config: {...editingConfig.config, temperature: parseFloat(e.target.value) || undefined}
                    })}
                    style={{ marginLeft: 8, width: 120, padding: '4px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
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
                <Tag style={{ margin: '4px' }}>{'{question}'}: 用户问题</Tag>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染测试结果
  const renderTestResults = () => {
    const result = testResults[stageName];
    if (!result) return null;

    return (
      <Card title="测试结果" size="small" style={{ marginTop: 16 }}>
        {/* 性能统计信息 */}
        {result.responseTime && (
          <div style={{ marginBottom: '16px', padding: '16px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '6px' }}>
            <Text strong style={{ display: 'block', marginBottom: '8px', color: '#d48806' }}>
              📊 性能统计
            </Text>
            <Text type="secondary">响应时长: </Text>
            <Text strong style={{ color: (result.responseTime / 1000) < 1 ? '#52c41a' : (result.responseTime / 1000) < 3 ? '#faad14' : '#f5222d' }}>
              {(result.responseTime / 1000).toFixed(2)}s
            </Text>
          </div>
        )}

        {/* 扩写结果展示 */}
        <Row gutter={[16, 16]}>
          {/* 左侧：追问问题 */}
          <Col span={12}>
            <div style={{ padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px', height: '100%' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px', color: '#52c41a' }}>
                🔍 追问问题 ({result.apiResponse?.data?.extended_questions?.length || 0}个)
              </Text>
              <div style={{ 
                fontSize: '12px', 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                maxHeight: '200px',
                overflow: 'auto',
                border: '1px solid #d9d9d9'
              }}>
                {result.apiResponse?.data?.extended_questions?.map((question: string, index: number) => (
                  <div key={index} style={{ marginBottom: '8px', padding: '8px', background: 'white', borderRadius: '4px' }}>
                    <Text strong>{index + 1}. </Text>
                    {question}
                  </div>
                )) || '未获取到追问问题'}
              </div>
            </div>
          </Col>

          {/* 右侧：位置标题 */}
          <Col span={12}>
            <div style={{ padding: '16px', background: '#f0f8ff', border: '1px solid #91d5ff', borderRadius: '6px', height: '100%' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px', color: '#1890ff' }}>
                🏷️ 位置标题
              </Text>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '6px',
                fontSize: '12px'
              }}>
                {result.apiResponse?.data?.position_titles ? (
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong>本卦标题: </Text>
                      <Text>{result.apiResponse.data.position_titles.ben_gua}</Text>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong>之卦标题: </Text>
                      <Text>{result.apiResponse.data.position_titles.zhi_gua}</Text>
                    </div>
                    <div>
                      <Text strong>唯一牌标题: </Text>
                      <Text>{result.apiResponse.data.position_titles.unique_gua}</Text>
                    </div>
                  </div>
                ) : '未获取到位置标题'}
              </div>
            </div>
          </Col>
        </Row>

        {/* AI原始响应 */}
        {result.apiResponse?.data?.ai_raw_response && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#f9f9f9', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              🤖 AI原始响应
            </Text>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              fontSize: '12px',
              margin: 0
            }}>
              {result.apiResponse.data.ai_raw_response}
            </pre>
          </div>
        )}
      </Card>
    );
  };

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
      {/* 输入区域、配置版本选择和占位符状态 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 左侧：输入区域 */}
        <Col span={8}>
          <Card size="small" title="输入参数">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <Text strong>最终问题:</Text>
                <TextArea
                  value={finalQuestion}
                  onChange={(e) => setFinalQuestion(e.target.value)}
                  placeholder="请输入最终问题，例如：我下半年会加薪升职吗？"
                  rows={3}
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <div>
                <Text strong>Reading ID:</Text>
                <Input
                  value={readingId}
                  onChange={(e) => setReadingId(e.target.value)}
                  placeholder="请输入Reading ID"
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={handleQuestionExpand}
                loading={isExpanding}
                disabled={!selectedConfig || !finalQuestion.trim() || !readingId.trim()}
                style={{ width: '100%' }}
              >
                开始扩写
              </Button>
              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
                请先选择配置版本，然后输入最终问题和Reading ID开始扩写
              </Text>
            </Space>
          </Card>
        </Col>

        {/* 中间：配置版本选择 */}
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
                          onClick={() => {
                            setSelectedConfig(config);
                            setEditingConfig({ ...config }); // 创建副本用于编辑
                          }}
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
      {renderConfigEditor()}

      {/* 测试结果展示 */}
      {renderTestResults()}
    </Card>
  );
};

export default QuestionExpandModule;
