// src/components/FollowUpModule.tsx
// 追问测试模块组件

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  message,
  Row,
  Col,
  Typography,
  List,
  Badge,
  Tag,
  Input
} from 'antd';
import { 
  SaveOutlined
} from '@ant-design/icons';

// 导入API配置
import { createApiUrl } from '../config/api';
import PlaceholderDisplayModule from './PlaceholderDisplayModule';
import SchemaEditor from './SchemaEditor';

const { Text } = Typography;
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
  response_format?: any | null;
}

// 追问模块组件
interface FollowUpModuleProps {
  configs: PromptConfig[];
  availableModels: string[];
  testResults: any;
  setTestResults: (results: any) => void;
  setSaveVersionModalVisible: (visible: boolean) => void;
  setGlobalEditingConfig: (config: PromptConfig | null) => void;
  globalReadingId: string; // 添加全局reading_id参数
}

const FollowUpModule: React.FC<FollowUpModuleProps> = ({
  configs,
  availableModels,
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
  const [readingId, setReadingId] = useState<string>(globalReadingId);
  const [followUpQuestion, setFollowUpQuestion] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 阶段名称和占位符
  const stageName = "追问";
  const stageConfigs = configs.filter(config => config.stage_name === stageName);
  const activeConfig = configs.find(config => config.stage_name === stageName && config.is_active);

  // 监听globalReadingId的变化
  useEffect(() => {
    setReadingId(globalReadingId);
  }, [globalReadingId]);

  // 处理追问生成
  const handleFollowUpGeneration = async () => {
    if (!editingConfig) {
      message.warning('请先选择一个配置版本');
      return;
    }

    if (!readingId.trim()) {
      message.warning('请输入Reading ID');
      return;
    }

    if (!followUpQuestion.trim()) {
      message.warning('请输入追问问题');
      return;
    }

    setIsGenerating(true);
    const startTime = Date.now();
    
    try {
      // 调用追问测试API
      const response = await fetch(createApiUrl('/test/followup/ask'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        },
        body: JSON.stringify({
          reading_id: readingId.trim(),
          question: followUpQuestion.trim(),
          prompt_config_id: editingConfig.id,
          system_prompt: editingConfig.system_prompt,
          user_prompt: editingConfig.user_prompt,
          model_name: editingConfig.model_name,
          ai_model_config: editingConfig.config,
          response_format: editingConfig.response_format || null
        })
      });

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }

      const result = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const followUpResult = {
        stage: editingConfig.stage_name,
        configVersion: editingConfig.version,
        model: editingConfig.model_name,
        config: editingConfig.config,
        systemPrompt: editingConfig.system_prompt,
        userPrompt: editingConfig.user_prompt,
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
        apiResponse: result,
        readingId: readingId.trim(),
        userQuestion: followUpQuestion.trim()
      };
      
      setTestResults((prev: any) => ({
        ...prev,
        [editingConfig.stage_name]: followUpResult
      }));
      
      message.success('追问回答生成完成');
    } catch (error) {
      message.error(`追问生成失败: ${error}`);
    } finally {
      setIsGenerating(false);
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
                <Tag style={{ margin: '4px' }}>{'{final_question}'}: 原始占卜问题</Tag>
                <Tag style={{ margin: '4px' }}>{'{original_report_str}'}: 原始占卜报告（JSON格式）</Tag>
                <Tag style={{ margin: '4px' }}>{'{chat_history_str}'}: 对话历史（格式：第X轮追问: 用户问/易罗答）</Tag>
                <Tag style={{ margin: '4px' }}>{'{user_followup_question}'}: 用户最新追问</Tag>
                <Tag style={{ margin: '4px' }}>{'{followup_context}'}: 追问上下文（兼容旧格式）</Tag>
              </div>
            </div>
          </Col>
        </Row>

        {/* 结构化输出 Schema 编辑器 */}
        <SchemaEditor
          value={editingConfig.response_format}
          onChange={(rf) => setEditingConfig({ ...editingConfig, response_format: rf })}
          readonly={false}
        />
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

        {/* 追问信息 */}
        <div style={{ marginBottom: '16px', padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px', color: '#52c41a' }}>
            🤔 用户追问
          </Text>
          <div style={{ 
            fontSize: '14px', 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            border: '1px solid #d9d9d9',
            marginBottom: '12px'
          }}>
            {result.userQuestion || '未获取到追问问题'}
          </div>
          
          <Text strong style={{ display: 'block', marginBottom: '8px', color: '#52c41a' }}>
            📝 AI回答
          </Text>
          <div style={{ 
            fontSize: '14px', 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            border: '1px solid #d9d9d9',
            marginBottom: '12px',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6'
          }}>
            {result.apiResponse?.data?.answer || '未获取到AI回答'}
          </div>
          
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '8px', background: '#f0f8ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                <Text strong style={{ display: 'block', color: '#1890ff' }}>追问序号</Text>
                <Text>{result.apiResponse?.data?.question_order || '未知'}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '8px', background: '#fff2e8', borderRadius: '4px', border: '1px solid #ffbb96' }}>
                <Text strong style={{ display: 'block', color: '#d46b08' }}>问题精炼</Text>
                <Text>{result.apiResponse?.data?.question_refined || '未知'}</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '8px', background: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
                <Text strong style={{ display: 'block', color: '#52c41a' }}>追问ID</Text>
                <Text style={{ fontSize: '12px' }}>{result.apiResponse?.data?.followup_id || '未知'}</Text>
              </div>
            </Col>
          </Row>
        </div>

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
          <span>追问测试模块</span>
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
        <Col span={12}>
          <Card size="small" title="输入参数">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <Text strong>Reading ID:</Text>
                <Input
                  value={readingId}
                  onChange={(e) => setReadingId(e.target.value)}
                  placeholder="请输入Reading ID（从解读生成阶段获得）"
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <div>
                <Text strong>追问问题:</Text>
                <Input
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  placeholder="请输入您的追问问题"
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={handleFollowUpGeneration}
                loading={isGenerating}
                disabled={!selectedConfig || !readingId.trim() || !followUpQuestion.trim()}
                style={{ width: '100%' }}
              >
                开始追问
              </Button>
              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
                请先选择配置版本，然后输入Reading ID和追问问题开始测试
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

      {/* 占位符状态 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <PlaceholderDisplayModule
            stageName={stageName}
            placeholders={[
              {key: "{final_question}", description: "原始占卜问题"},
              {key: "{original_report_str}", description: "原始解读报告"},
              {key: "{chat_history_str}", description: "追问对话历史"}
            ]}
            readingId={readingId}
            onPlaceholderDataUpdate={(data) => {
              console.log(`${stageName} 占位符数据更新:`, data);
            }}
          />
        </Col>
        
        <Col span={8}>
          {/* 用户输入的追问问题（实时显示） */}
          <Card size="small" title="用户输入占位符">
            <div style={{ marginBottom: 8 }}>
              <Tag color="blue">{"{user_followup_question}"}</Tag>
              <span style={{ fontSize: '12px', color: '#666' }}>
                用户追问问题
              </span>
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#333',
              backgroundColor: '#f5f5f5',
              padding: '4px 8px',
              borderRadius: '4px',
              minHeight: '20px'
            }}>
              {followUpQuestion || '请在上方输入框中输入追问问题'}
            </div>
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

export default FollowUpModule;
