// src/components/SituationAnalysisModule.tsx
// 现状分析测试模块组件

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

// 现状分析模块组件
interface SituationAnalysisModuleProps {
  configs: PromptConfig[];
  availableModels: string[];
  onSaveAsNewVersion: (values: any) => Promise<void>;
  testResults: any;
  setTestResults: (results: any) => void;
  setSaveVersionModalVisible: (visible: boolean) => void;
  setGlobalEditingConfig: (config: PromptConfig | null) => void;
  globalReadingId: string; // 添加全局reading_id参数
}

const SituationAnalysisModule: React.FC<SituationAnalysisModuleProps> = ({
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 现状补充相关状态
  const [supplementContent, setSupplementContent] = useState<string>("");
  const [isSavingSupplement, setIsSavingSupplement] = useState(false);
  const [supplementSaveStatus, setSupplementSaveStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 阶段名称和占位符
  const stageName = "现状分析";
  const stageConfigs = configs.filter(config => config.stage_name === stageName);
  const activeConfig = configs.find(config => config.stage_name === stageName && config.is_active);

  // 监听globalReadingId的变化
  useEffect(() => {
    setReadingId(globalReadingId);
  }, [globalReadingId]);

  // 保存现状补充信息
  const handleSaveSupplement = async () => {
    if (!readingId.trim()) {
      message.warning('请输入Reading ID');
      return;
    }

    setIsSavingSupplement(true);
    setSupplementSaveStatus(null);
    
    try {
      // 调用现状补充保存API
      const response = await fetch(createApiUrl('/api/v1/situation/supplement'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        },
        body: JSON.stringify({
          reading_id: readingId.trim(),
          supplement_content: supplementContent.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSupplementSaveStatus({
          success: true,
          message: '现状补充信息保存成功'
        });
        message.success('现状补充信息保存成功');
      } else {
        setSupplementSaveStatus({
          success: false,
          message: result.message || '保存失败'
        });
        message.error(result.message || '保存失败');
      }
    } catch (error) {
      const errorMessage = `保存现状补充信息失败: ${error}`;
      setSupplementSaveStatus({
        success: false,
        message: errorMessage
      });
      message.error(errorMessage);
    } finally {
      setIsSavingSupplement(false);
    }
  };

  // 处理现状分析
  const handleSituationAnalysis = async () => {
    if (!editingConfig) {
      message.warning('请先选择一个配置版本');
      return;
    }

    if (!readingId.trim()) {
      message.warning('请输入Reading ID');
      return;
    }

    setIsAnalyzing(true);
    const startTime = Date.now();
    
    try {
      // 调用现状分析测试API
      const response = await fetch(createApiUrl('/test/situation-analysis/analyze'), {
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
      
      const analysisResult = {
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
        [editingConfig.stage_name]: analysisResult
      }));
      
      message.success('现状分析完成');
    } catch (error) {
      message.error(`现状分析失败: ${error}`);
    } finally {
      setIsAnalyzing(false);
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
                <Tag style={{ margin: '4px' }}>{'{ben_gua_name}'}: 本卦名称</Tag>
                <Tag style={{ margin: '4px' }}>{'{ben_gua_prompt}'}: 本卦提示</Tag>
                <Tag style={{ margin: '4px' }}>{'{zhi_gua_name}'}: 之卦名称</Tag>
                <Tag style={{ margin: '4px' }}>{'{zhi_gua_prompt}'}: 之卦提示</Tag>
                <Tag style={{ margin: '4px' }}>{'{yao_name_text}'}: 变爻名称文本</Tag>
                <Tag style={{ margin: '4px' }}>{'{expanded_question_text}'}: 扩写问题文本</Tag>
                <Tag style={{ margin: '4px' }}>{'{question_guidance}'}: 问题指导</Tag>
                <Tag style={{ margin: '4px' }}>{'{final_question}'}: 最终问题</Tag>
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

        {/* 分析结果展示 */}
        <Row gutter={[16, 16]}>
          {/* 左侧：现状分析 */}
          <Col span={12}>
            <div style={{ padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px', height: '100%' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px', color: '#52c41a' }}>
                🔍 现状分析
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
                {result.apiResponse?.data?.situation_analysis || '未获取到现状分析'}
              </div>
            </div>
          </Col>

          {/* 右侧：可能的反驳点 */}
          <Col span={12}>
            <div style={{ padding: '16px', background: '#f0f8ff', border: '1px solid #91d5ff', borderRadius: '6px', height: '100%' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px', color: '#1890ff' }}>
                🤔 可能的反驳点 ({result.apiResponse?.data?.possible_rebuttals?.length || 0}个)
              </Text>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '6px',
                fontSize: '12px',
                maxHeight: '200px',
                overflow: 'auto',
                border: '1px solid #d9d9d9'
              }}>
                {result.apiResponse?.data?.possible_rebuttals?.map((rebuttal: string, index: number) => (
                  <div key={index} style={{ marginBottom: '8px', padding: '8px', background: 'white', borderRadius: '4px' }}>
                    <Text strong>{index + 1}. </Text>
                    {rebuttal}
                  </div>
                )) || '未获取到反驳点'}
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
                <Text strong>Reading ID:</Text>
                <Input
                  value={readingId}
                  onChange={(e) => setReadingId(e.target.value)}
                  placeholder="请输入Reading ID（从占卜计算阶段获得）"
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={handleSituationAnalysis}
                loading={isAnalyzing}
                disabled={!selectedConfig || !readingId.trim()}
                style={{ width: '100%' }}
              >
                开始分析
              </Button>
              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
                请先选择配置版本，然后输入Reading ID开始现状分析
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
              {key: "{ben_gua_name}", description: "本卦名称"},
              {key: "{ben_gua_prompt}", description: "本卦提示"},
              {key: "{zhi_gua_name}", description: "之卦名称"},
              {key: "{zhi_gua_prompt}", description: "之卦提示"},
              {key: "{yao_name_text}", description: "变爻名称文本"},
              {key: "{expanded_question_text}", description: "扩写问题文本"},
              {key: "{question_guidance}", description: "问题指导"},
              {key: "{final_question}", description: "最终问题"}
            ]}
            readingId={readingId}
            onPlaceholderDataUpdate={(data) => {
              console.log(`${stageName} 占位符数据更新:`, data);
            }}
          />
        </Col>
      </Row>

      {/* 现状补充输入区域 */}
      <Card 
        title="现状补充信息" 
        size="small" 
        style={{ marginTop: 16 }}
        extra={
          <Text type="secondary" style={{ fontSize: '12px' }}>
            可以随时保存补充信息
          </Text>
        }
      >
        <div style={{ marginBottom: '12px' }}>
          <TextArea
            value={supplementContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSupplementContent(e.target.value)}
            placeholder="请输入你对现状分析的补充或反馈..."
            rows={4}
            style={{ marginBottom: '8px' }}
          />
          <Button
            type="primary"
            onClick={handleSaveSupplement}
            loading={isSavingSupplement}
            disabled={!supplementContent.trim() || !readingId.trim()}
            style={{ width: '100%' }}
          >
            {isSavingSupplement ? '保存中...' : '保存补充信息'}
          </Button>
        </div>
        
        {/* 保存状态显示 */}
        {supplementSaveStatus && (
          <Alert
            message={supplementSaveStatus.message}
            type={supplementSaveStatus.success ? 'success' : 'error'}
            showIcon
            style={{ marginTop: '8px' }}
          />
        )}
      </Card>

      {/* 配置编辑区域 */}
      {renderConfigEditor()}

      {/* 测试结果展示 */}
      {renderTestResults()}
    </Card>
  );
};

export default SituationAnalysisModule;
