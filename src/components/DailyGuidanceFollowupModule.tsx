// src/components/DailyGuidanceFollowupModule.tsx
// 每日指引追问测试模块组件

import React, { useState } from 'react';
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
  Input,
  Select
} from 'antd';
import { 
  SaveOutlined
} from '@ant-design/icons';

// 导入API配置
import { createApiUrl } from '../config/api';

const { Text } = Typography;
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
}

// 每日指引追问模块组件
interface DailyGuidanceFollowupModuleProps {
  configs: PromptConfig[];
  availableModels: string[];
  testResults: any;
  setTestResults: (results: any) => void;
  setSaveVersionModalVisible: (visible: boolean) => void;
  setGlobalEditingConfig: (config: PromptConfig | null) => void;
}

const DailyGuidanceFollowupModule: React.FC<DailyGuidanceFollowupModuleProps> = ({
  configs,
  availableModels,
  testResults,
  setTestResults,
  setSaveVersionModalVisible,
  setGlobalEditingConfig
}) => {
  // 模块内部状态管理
  const [selectedConfig, setSelectedConfig] = useState<PromptConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState<PromptConfig | null>(null);
  
  // 本地状态
  const [recordId, setRecordId] = useState<string>('');
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [userRizhu, setUserRizhu] = useState<string>('');
  const [todayDayGan, setTodayDayGan] = useState<string>('');
  const [tenGold, setTenGold] = useState<string>('');
  const [guaName, setGuaName] = useState<string>('');
  const [guaDailyGuidance, setGuaDailyGuidance] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 阶段名称和占位符
  const stageName = "每日指引追问";
  const stageConfigs = configs.filter(config => config.stage_name === stageName);
  const activeConfig = configs.find(config => config.stage_name === stageName && config.is_active);

  // 处理每日指引追问生成
  const handleDailyGuidanceFollowup = async () => {
    if (!editingConfig) {
      message.warning('请先选择一个配置版本');
      return;
    }

    if (!recordId.trim()) {
      message.warning('请输入每日指引记录ID');
      return;
    }

    if (!userQuestion.trim()) {
      message.warning('请输入追问问题');
      return;
    }

    if (!userRizhu.trim() || !todayDayGan.trim() || !tenGold.trim() || !guaName.trim() || !guaDailyGuidance.trim()) {
      message.warning('请填写所有必填字段（用户日柱、今日日干、十神、卦名、指引文案）');
      return;
    }

    setIsGenerating(true);
    const startTime = Date.now();
    
    try {
      // 调用每日指引追问测试API（支持配置覆盖）
      const response = await fetch(createApiUrl('/test/daily-guidance-followup/ask'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        body: JSON.stringify({
          record_id: recordId.trim(),
          question: userQuestion.trim(),
          user_rizhu: userRizhu.trim(),
          today_day_gan: todayDayGan.trim(),
          ten_gold: tenGold.trim(),
          gua_name: guaName.trim(),
          gua_daily_guidance: guaDailyGuidance.trim(),
          prompt_config_id: editingConfig.id,
          system_prompt: editingConfig.system_prompt,
          user_prompt: editingConfig.user_prompt,
          model_name: editingConfig.model_name,
          ai_model_config: editingConfig.config
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API调用失败: ${response.status}`);
      }

      const result = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const followupResult = {
        stage: editingConfig.stage_name,
        configVersion: editingConfig.version,
        model: editingConfig.model_name,
        config: editingConfig.config,
        systemPrompt: editingConfig.system_prompt,
        userPrompt: editingConfig.user_prompt,
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
        apiResponse: result,
        testInfo: result.test_info,  // 测试接口返回的测试信息
        recordId: recordId.trim(),
        userQuestion: userQuestion.trim(),
        userRizhu: userRizhu.trim(),
        todayDayGan: todayDayGan.trim(),
        tenGold: tenGold.trim(),
        guaName: guaName.trim(),
        guaDailyGuidance: guaDailyGuidance.trim()
      };
      
      setTestResults((prev: any) => ({
        ...prev,
        [editingConfig.stage_name]: followupResult
      }));
      
      message.success('每日指引追问回答生成完成');
    } catch (error: any) {
      message.error(`每日指引追问生成失败: ${error.message || error}`);
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
              <div style={{ marginTop: 8 }}>
                <Tag style={{ margin: '4px' }}>{'{user_rizhu}'}: 用户日柱</Tag>
                <Tag style={{ margin: '4px' }}>{'{today_day_gan}'}: 今日日干</Tag>
                <Tag style={{ margin: '4px' }}>{'{ten_gold}'}: 十神</Tag>
                <Tag style={{ margin: '4px' }}>{'{gua_name}'}: 卦名</Tag>
                <Tag style={{ margin: '4px' }}>{'{gua_daily_guidance}'}: 指引文案</Tag>
                <Tag style={{ margin: '4px' }}>{'{chat_history_str}'}: 对话历史</Tag>
                <Tag style={{ margin: '4px' }}>{'{user_question}'}: 用户追问问题</Tag>
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

        {/* 追问信息 */}
        {result.apiResponse?.success && (
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
            
            {/* 测试信息（测试接口特有） */}
            {result.testInfo && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '4px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px', color: '#1890ff' }}>
                  🧪 测试信息
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  使用配置: {result.testInfo.used_config || '默认配置'}
                  {result.testInfo.model_name && ` | 模型: ${result.testInfo.model_name}`}
                  {result.testInfo.prompt_override && ' | 已覆盖Prompt'}
                  {result.testInfo.config_override && ' | 已覆盖模型配置'}
                </Text>
              </div>
            )}
          </div>
        )}

        {/* 错误信息 */}
        {!result.apiResponse?.success && (
          <div style={{ marginBottom: '16px', padding: '16px', background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: '6px' }}>
            <Text strong style={{ display: 'block', marginBottom: '8px', color: '#f5222d' }}>
              ❌ 错误信息
            </Text>
            <Text>{result.apiResponse?.error || '未知错误'}</Text>
            {result.apiResponse?.error_code === 'INSUFFICIENT_CREDITS' && (
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">当前积分: {result.apiResponse?.current_balance || 0}</Text>
                <br />
                <Text type="secondary">所需积分: {result.apiResponse?.required_credits || 10}</Text>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <Card
      title={
        <Space>
          <span>每日指引追问测试模块</span>
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
      {/* 输入区域、配置版本选择 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 左侧：输入区域 */}
        <Col span={12}>
          <Card size="small" title="输入参数">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <Text strong>每日指引记录ID:</Text>
                <Input
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                  placeholder="请输入每日指引记录ID"
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <div>
                <Text strong>用户日柱:</Text>
                <Input
                  value={userRizhu}
                  onChange={(e) => setUserRizhu(e.target.value)}
                  placeholder="如: 甲子"
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <div>
                <Text strong>今日日干:</Text>
                <Input
                  value={todayDayGan}
                  onChange={(e) => setTodayDayGan(e.target.value)}
                  placeholder="如: 甲"
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <div>
                <Text strong>十神:</Text>
                <Select
                  value={tenGold}
                  onChange={setTenGold}
                  placeholder="选择十神"
                  style={{ marginTop: 8, width: '100%' }}
                >
                  <Option value="比肩">比肩</Option>
                  <Option value="劫财">劫财</Option>
                  <Option value="食神">食神</Option>
                  <Option value="伤官">伤官</Option>
                  <Option value="偏财">偏财</Option>
                  <Option value="正财">正财</Option>
                  <Option value="七杀">七杀</Option>
                  <Option value="正官">正官</Option>
                  <Option value="偏印">偏印</Option>
                  <Option value="正印">正印</Option>
                </Select>
              </div>
              <div>
                <Text strong>卦名:</Text>
                <Input
                  value={guaName}
                  onChange={(e) => setGuaName(e.target.value)}
                  placeholder="如: 乾卦"
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <div>
                <Text strong>指引文案:</Text>
                <TextArea
                  value={guaDailyGuidance}
                  onChange={(e) => setGuaDailyGuidance(e.target.value)}
                  placeholder="请输入指引文案"
                  rows={3}
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <div>
                <Text strong>追问问题:</Text>
                <TextArea
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="请输入您的追问问题"
                  rows={2}
                  style={{ marginTop: 8, width: '100%' }}
                />
              </div>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={handleDailyGuidanceFollowup}
                loading={isGenerating}
                disabled={!selectedConfig || !recordId.trim() || !userQuestion.trim() || !userRizhu.trim() || !todayDayGan.trim() || !tenGold.trim() || !guaName.trim() || !guaDailyGuidance.trim()}
                style={{ width: '100%' }}
              >
                开始追问
              </Button>
              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
                请先选择配置版本，然后填写所有必填字段开始测试
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
                maxHeight: '400px', 
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

export default DailyGuidanceFollowupModule;

