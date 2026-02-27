// src/components/AnswerGenerationModule.tsx
// 解读生成测试模块组件

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
  Alert,
  Divider,
  Input
} from 'antd';
import { 
  PlayCircleOutlined,
  SaveOutlined
} from '@ant-design/icons';

// 导入API配置
import { createApiUrl } from '../config/api';

// 导入占位符显示模块
import PlaceholderDisplayModule from './PlaceholderDisplayModule';
import SchemaEditor from './SchemaEditor';

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
  response_format?: any | null;
}

// 解读生成模块组件
interface AnswerGenerationModuleProps {
  configs: PromptConfig[];
  availableModels: string[];
  onSaveAsNewVersion: (values: any) => Promise<void>;
  testResults: any;
  setTestResults: (results: any) => void;
  setSaveVersionModalVisible: (visible: boolean) => void;
  setGlobalEditingConfig: (config: PromptConfig | null) => void;
  globalReadingId: string; // 添加全局reading_id参数
}

const AnswerGenerationModule: React.FC<AnswerGenerationModuleProps> = ({
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
  const [readingId, setReadingId] = useState<string>(globalReadingId);
  const [isGenerating, setIsGenerating] = useState(false);

  // 阶段名称和占位符
  const stageName = "占卜解读";
  const stageConfigs = configs.filter(config => config.stage_name === stageName);
  const activeConfig = configs.find(config => config.stage_name === stageName && config.is_active);

  // 监听globalReadingId的变化
  useEffect(() => {
    setReadingId(globalReadingId);
  }, [globalReadingId]);

  // 处理解读生成
  const handleAnswerGeneration = async () => {
    if (!editingConfig) {
      message.warning('请先选择一个配置版本');
      return;
    }

    if (!readingId.trim()) {
      message.warning('请输入Reading ID');
      return;
    }

    setIsGenerating(true);
    const startTime = Date.now();
    
    try {
      // 调用解读生成测试API
      const response = await fetch(createApiUrl('/test/answer-generation/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        },
        body: JSON.stringify({
          reading_id: readingId.trim(),
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
      
      const generationResult = {
        stage: editingConfig.stage_name,
        configVersion: editingConfig.version,
        model: editingConfig.model_name,
        config: editingConfig.config,
        systemPrompt: editingConfig.system_prompt,
        userPrompt: editingConfig.user_prompt,
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
        apiResponse: result,
        readingId: readingId.trim()
      };
      
      setTestResults((prev: any) => ({
        ...prev,
        [editingConfig.stage_name]: generationResult
      }));
      
      message.success('解读生成完成');
    } catch (error) {
      message.error(`解读生成失败: ${error}`);
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
                    placeholder="如: 4000"
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
              <div style={{ marginTop: 8, maxHeight: '200px', overflowY: 'auto' }}>
                {/* 用户问题相关 */}
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>用户问题相关:</Text>
                  <div>
                    <Tag style={{ margin: '2px' }}>{'{final_question}'}: 最终问题</Tag>
                    <Tag style={{ margin: '2px' }}>{'{question}'}: 原始问题</Tag>
                    <Tag style={{ margin: '2px' }}>{'{situation_analysis}'}: 现状分析</Tag>
                    <Tag style={{ margin: '2px' }}>{'{situation_supplement}'}: 现状补充</Tag>
                  </div>
                </div>
                
                {/* 格局信息 */}
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>格局信息:</Text>
                  <div>
                    <Tag style={{ margin: '2px' }}>{'{geju_name}'}: 格局名称</Tag>
                    <Tag style={{ margin: '2px' }}>{'{geju_prompt}'}: 格局描述</Tag>
                  </div>
                </div>
                
                {/* 本卦信息 */}
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>本卦信息:</Text>
                  <div>
                    <Tag style={{ margin: '2px' }}>{'{ben_gua_name}'}: 本卦名称</Tag>
                    <Tag style={{ margin: '2px' }}>{'{ben_gua_title}'}: 本卦标题</Tag>
                    <Tag style={{ margin: '2px' }}>{'{ben_gua_prompt}'}: 本卦画面</Tag>
                    <Tag style={{ margin: '2px' }}>{'{ben_gua_ci}'}: 本卦卦辞</Tag>
                  </div>
                </div>
                
                {/* 之卦信息 */}
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>之卦信息:</Text>
                  <div>
                    <Tag style={{ margin: '2px' }}>{'{zhi_gua_name}'}: 之卦名称</Tag>
                    <Tag style={{ margin: '2px' }}>{'{zhi_gua_title}'}: 之卦标题</Tag>
                    <Tag style={{ margin: '2px' }}>{'{zhi_gua_prompt}'}: 之卦画面</Tag>
                    <Tag style={{ margin: '2px' }}>{'{zhi_gua_ci}'}: 之卦卦辞</Tag>
                  </div>
                </div>
                
                {/* 其他信息 */}
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>其他信息:</Text>
                  <div>
                    <Tag style={{ margin: '2px' }}>{'{yao_to_read_formatted}'}: 变爻信息</Tag>
                    <Tag style={{ margin: '2px' }}>{'{historical_contexts}'}: 历史相似问题上下文（JSON格式）</Tag>
                  </div>
                </div>
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

        {/* 解读结果展示 */}
        <Row gutter={[16, 16]}>
          {/* 左侧：开场白和本卦 */}
          <Col span={12}>
            <div style={{ padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px', height: '100%' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px', color: '#52c41a' }}>
                🎭 开场白
              </Text>
              <div style={{ 
                fontSize: '12px', 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                maxHeight: '100px',
                overflow: 'auto',
                border: '1px solid #d9d9d9',
                marginBottom: '12px'
              }}>
                {result.apiResponse?.data?.opening || '未获取到开场白'}
              </div>
              
              <Text strong style={{ display: 'block', marginBottom: '8px', color: '#52c41a' }}>
                🏮 本卦解读
              </Text>
              <div style={{ 
                fontSize: '12px', 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                maxHeight: '100px',
                overflow: 'auto',
                border: '1px solid #d9d9d9'
              }}>
                {result.apiResponse?.data?.ben_gua?.brief || '未获取到本卦解读'}
              </div>
            </div>
          </Col>

          {/* 右侧：总结和建议追问 */}
          <Col span={12}>
            <div style={{ padding: '16px', background: '#f0f8ff', border: '1px solid #91d5ff', borderRadius: '6px', height: '100%' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px', color: '#1890ff' }}>
                📝 总结与建议
              </Text>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '6px',
                fontSize: '12px',
                maxHeight: '100px',
                overflow: 'auto',
                border: '1px solid #d9d9d9',
                marginBottom: '12px'
              }}>
                {result.apiResponse?.data?.summary?.brief || '未获取到总结'}
              </div>
              
              <Text strong style={{ display: 'block', marginBottom: '8px', color: '#1890ff' }}>
                🤔 建议追问 ({result.apiResponse?.data?.suggested_followups?.length || 0}个)
              </Text>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '6px',
                fontSize: '12px',
                maxHeight: '100px',
                overflow: 'auto',
                border: '1px solid #d9d9d9'
              }}>
                {result.apiResponse?.data?.suggested_followups?.map((followup: string, index: number) => (
                  <div key={index} style={{ marginBottom: '4px', padding: '4px', background: 'white', borderRadius: '4px' }}>
                    <Text strong>{index + 1}. </Text>
                    {followup}
                  </div>
                )) || '未获取到建议追问'}
              </div>
            </div>
          </Col>
        </Row>

        {/* 爻位解读列表 */}
        {result.apiResponse?.data?.yao_list && result.apiResponse.data.yao_list.length > 0 && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#fff2e8', border: '1px solid #ffbb96', borderRadius: '6px' }}>
            <Text strong style={{ display: 'block', marginBottom: '8px', color: '#d46b08' }}>
              ⚡ 爻位解读 ({result.apiResponse.data.yao_list.length}个)
            </Text>
            <Row gutter={[16, 16]}>
              {result.apiResponse.data.yao_list.map((yao: any, index: number) => (
                <Col span={8} key={index}>
                  <div style={{ 
                    padding: '8px', 
                    background: '#f5f5f5', 
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9'
                  }}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text strong>{yao.yao_title || `第${yao.position}爻`}</Text>
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.3' }}>
                      {yao.brief}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

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
          <span>占卜解读测试模块</span>
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
                <Text strong>Reading ID:</Text>
                <Input
                  value={readingId}
                  onChange={(e) => setReadingId(e.target.value)}
                  placeholder="请输入Reading ID（从现状分析阶段获得）"
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={handleAnswerGeneration}
                loading={isGenerating}
                disabled={!selectedConfig || !readingId.trim()}
                style={{ width: '100%' }}
              >
                开始生成
              </Button>
              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
                请先选择配置版本，然后输入Reading ID开始解读生成
              </Text>
            </Space>
          </Card>
        </Col>

        {/* 中间：配置版本选择 */}
        <Col span={8}>
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

        {/* 右侧：占位符状态 */}
        <Col span={8}>
          <PlaceholderDisplayModule
            stageName={stageName}
            placeholders={[
              // 用户问题相关
              {key: "{final_question}", description: "最终问题"},
              {key: "{question}", description: "原始问题"},
              {key: "{situation_analysis}", description: "现状分析内容"},
              {key: "{situation_supplement}", description: "现状补充信息"},
              
              // 格局信息
              {key: "{geju_name}", description: "格局名称"},
              {key: "{geju_prompt}", description: "格局描述"},
              
              // 本卦信息
              {key: "{ben_gua_name}", description: "本卦名称"},
              {key: "{ben_gua_title}", description: "本卦标题"},
              {key: "{ben_gua_prompt}", description: "本卦画面描述"},
              {key: "{ben_gua_ci}", description: "本卦卦辞"},
              
              // 之卦信息
              {key: "{zhi_gua_name}", description: "之卦名称"},
              {key: "{zhi_gua_title}", description: "之卦标题"},
              {key: "{zhi_gua_prompt}", description: "之卦画面描述"},
              {key: "{zhi_gua_ci}", description: "之卦卦辞"},
              
              // 爻位信息
              {key: "{yao_to_read_formatted}", description: "需要解读的爻位信息"},
              
              // 其他信息
              {key: "{extended_questions}", description: "扩写问题列表"},
              {key: "{historical_contexts}", description: "历史相似问题上下文（JSON格式）"}
            ]}
            readingId={readingId}
            onPlaceholderDataUpdate={(data) => {
              console.log(`${stageName} 占位符数据更新:`, data);
            }}
          />
        </Col>
      </Row>

      {/* 配置编辑区域 */}
      {renderConfigEditor()}

      {/* 测试结果展示 */}
      {renderTestResults()}
    </Card>
  );
};

export default AnswerGenerationModule;
