// src/pages/OracleChat.tsx
// Oracle AI 聊天页面 - 工作台单独入口，用于联调与测试
// 顶部：Oracle 提示词配置选择、查看 Prompt、激活（与 FlowTest 类似的调试逻辑）
// 下方：会话列表 + 聊天区域；当前为「非流式」展示

import { useState, useEffect, useRef } from 'react';
import { createApiUrl, API_ENDPOINTS, getOracleApiHeaders } from '../config/api';
import {
  Card,
  Button,
  List,
  Input,
  Form,
  Modal,
  message,
  Spin,
  Typography,
  Space,
  Empty,
  Tag,
  Row,
  Col,
  Select,
  InputNumber,
  Segmented,
} from 'antd';
import { PlusOutlined, SendOutlined, CheckCircleOutlined, SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

// Oracle 的 stage_name：主聊天 + 标题生成器（事实抽取器已移至后台，不在此配置）
// 与后端 oracle_service.py / oracle_background_service.py 中的常量一致
const ORACLE_STAGES = [
  { key: 'oracle_system', label: '主聊天 Prompt' },
  { key: 'oracle_title_generator', label: '标题生成器' },
] as const;

type OracleStageKey = typeof ORACLE_STAGES[number]['key'];

// 提示词配置类型（与 prompt_configs 表一致）
interface OraclePromptConfig {
  id: string;
  stage_name: string;
  system_prompt: string;
  user_prompt: string;
  placeholders: unknown;
  model_name: string;
  config: Record<string, unknown>;
  version: string;
  is_active: boolean;
  tools: unknown; // JSONB，工具定义数组
  created_at: string;
  updated_at: string;
}

// 会话类型
interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  context_refs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// 消息类型（与后端 oracle_messages 一致）
interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: unknown;
  tool_call_id?: string | null;
  created_at: string;
}

// SSE 事件类型
type SSEEvent = { type: 'content'; text?: string } | { type: 'tool_calls'; tool_calls?: unknown[] } | { type: 'done' } | { type: 'error'; error?: string };

export default function OracleChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Oracle 提示词配置（顶部调试区）
  const [activeStage, setActiveStage] = useState<OracleStageKey>('oracle_system');
  const [allOracleConfigs, setAllOracleConfigs] = useState<OraclePromptConfig[]>([]);
  const [selectedOracleConfig, setSelectedOracleConfig] = useState<OraclePromptConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState<OraclePromptConfig | null>(null);
  const [loadingOracleConfigs, setLoadingOracleConfigs] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [saveVersionModalVisible, setSaveVersionModalVisible] = useState(false);
  const [saveVersionForm] = Form.useForm();

  // 按当前选中的 stage 过滤出的配置列表
  const oracleConfigs = allOracleConfigs.filter((c) => c.stage_name === activeStage);

  // 拉取所有 Oracle 相关的 Prompt 配置（三个 stage 一起拉）
  const fetchOracleConfigs = async () => {
    setLoadingOracleConfigs(true);
    try {
      const res = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIGS), {
        headers: getOracleApiHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const stageKeys = ORACLE_STAGES.map((s) => s.key);
        const oracleOnly = data.data.filter((c: OraclePromptConfig) => stageKeys.includes(c.stage_name as OracleStageKey));
        setAllOracleConfigs(oracleOnly);
      }
    } catch (e) {
      message.error('获取 Oracle 提示词配置失败');
      console.error(e);
    } finally {
      setLoadingOracleConfigs(false);
    }
  };

  // 切换 stage 时，清空当前选中和编辑状态
  useEffect(() => {
    setSelectedOracleConfig(null);
    setEditingConfig(null);
  }, [activeStage]);

  // 拉取可用模型列表（与 FlowTest 一致，供编辑时选择）
  const fetchAvailableModels = async () => {
    try {
      const res = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIG_MODELS), {
        headers: getOracleApiHeaders(),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setAvailableModels(result.data);
        }
      }
    } catch (e) {
      console.error('获取模型列表失败', e);
    }
  };

  // 选择某一版本：同时用于查看/激活 和 编辑/保存
  const handleSelectOracleConfig = (config: OraclePromptConfig) => {
    setSelectedOracleConfig(config);
    setEditingConfig({ ...config });
    message.success(`已选择 ${config.version}，可编辑 Prompt 或保存为新版本`);
  };

  // 保存为新版本（与 FlowTest 一致：POST 新配置，不激活）
  const handleSaveAsNewVersion = async (values: { version: string }) => {
    if (!editingConfig) {
      message.error('没有可保存的配置');
      return;
    }
    let toolsParsed: unknown = editingConfig.tools;
    if (typeof editingConfig.tools === 'string') {
      try {
        toolsParsed = JSON.parse(editingConfig.tools as string);
      } catch {
        message.error('Tools 不是合法 JSON，请检查后重试');
        return;
      }
    }
    try {
      const configData = {
        stage_name: activeStage,
        version: values.version,
        system_prompt: editingConfig.system_prompt,
        user_prompt: editingConfig.user_prompt ?? '',
        placeholders: Array.isArray(editingConfig.placeholders) ? editingConfig.placeholders : [],
        model_name: editingConfig.model_name,
        config: editingConfig.config ?? {},
        tools: toolsParsed,
        is_active: false,
      };
      const res = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIGS), {
        method: 'POST',
        headers: getOracleApiHeaders(),
        body: JSON.stringify(configData),
      });
      if (res.ok) {
        message.success('新版本保存成功');
        setSaveVersionModalVisible(false);
        saveVersionForm.resetFields();
        fetchOracleConfigs();
      } else {
        const err = await res.json().catch(() => ({}));
        message.error(err.detail?.detail || err.detail || '保存失败');
      }
    } catch (e) {
      message.error('保存失败');
    }
  };

  // 激活该配置（后端聊天将使用此版本）
  const handleActivateOracleConfig = async (id: string) => {
    setActivatingId(id);
    try {
      const res = await fetch(createApiUrl(API_ENDPOINTS.PROMPT_CONFIG_ACTIVATE(id)), {
        method: 'POST',
        headers: getOracleApiHeaders(),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        message.success('已激活，后续聊天将使用此提示词版本');
        fetchOracleConfigs();
      } else {
        message.error(data.detail?.detail || data.detail || '激活失败');
      }
    } catch (e) {
      message.error('激活失败');
    } finally {
      setActivatingId(null);
    }
  };

  // 拉取会话列表
  const fetchConversations = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(createApiUrl(API_ENDPOINTS.ORACLE_CONVERSATIONS), {
        headers: getOracleApiHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setConversations(data.data);
        if (!currentConvId && data.data.length > 0) {
          setCurrentConvId(data.data[0].id);
        }
      } else {
        message.error(data.detail || '获取会话列表失败');
      }
    } catch (e) {
      message.error('网络错误，请检查后端是否启动');
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  // 拉取当前会话消息
  const fetchMessages = async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(createApiUrl(API_ENDPOINTS.ORACLE_CONVERSATION_MESSAGES(convId)), {
        headers: getOracleApiHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      } else {
        message.error(data.detail || '获取消息失败');
        setMessages([]);
      }
    } catch (e) {
      message.error('获取消息失败');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchOracleConfigs();
    fetchAvailableModels();
  }, []);

  useEffect(() => {
    if (currentConvId) {
      fetchMessages(currentConvId);
    } else {
      setMessages([]);
    }
  }, [currentConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 新建会话
  const handleCreateConversation = async () => {
    setSending(true);
    try {
      const res = await fetch(createApiUrl(API_ENDPOINTS.ORACLE_CONVERSATIONS), {
        method: 'POST',
        headers: getOracleApiHeaders(),
        body: JSON.stringify({ context_refs: {} }),
      });
      const data = await res.json();
      if (data.success && data.data?.id) {
        setConversations((prev) => [data.data, ...prev]);
        setCurrentConvId(data.data.id);
        setMessages([]);
        message.success('已创建新会话');
      } else {
        message.error(data.detail?.detail || data.detail || '创建会话失败');
      }
    } catch (e) {
      message.error('创建会话失败');
    } finally {
      setSending(false);
    }
  };

  // 发送消息（消费 SSE，缓冲完整内容后刷新消息列表）
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !currentConvId) return;
    setInputText('');
    setSending(true);

    try {
      const res = await fetch(createApiUrl(API_ENDPOINTS.ORACLE_CHAT), {
        method: 'POST',
        headers: getOracleApiHeaders(),
        body: JSON.stringify({
          conversation_id: currentConvId,
          messages: [{ role: 'user', content: text }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let hadError = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const payload = line.slice(6);
              if (payload === '[DONE]') continue;
              try {
                const event = JSON.parse(payload) as SSEEvent;
                if (event.type === 'content' && event.text) fullContent += event.text;
                if (event.type === 'error') {
                  hadError = true;
                  message.error(event.error || 'AI 返回错误');
                }
              } catch (_) {}
            }
          }
        }
      }

      if (hadError) {
        setSending(false);
        return;
      }
      // 流结束，刷新消息列表即可看到新消息（后端已写入 DB）
      await fetchMessages(currentConvId);
      if (fullContent) message.success('回复已加载');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '发送失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
      {/* 顶部：Oracle 提示词配置选择与调试（类似 FlowTest） */}
      <Card
        title={
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space>
              <Text strong>Oracle 提示词配置</Text>
              <Text type="secondary">选择版本、查看 Prompt、激活后将使用该版本</Text>
            </Space>
            <Segmented
              value={activeStage}
              onChange={(val) => setActiveStage(val as OracleStageKey)}
              options={ORACLE_STAGES.map((s) => ({ label: s.label, value: s.key }))}
            />
          </Space>
        }
        size="small"
        extra={
          <Button size="small" onClick={fetchOracleConfigs} loading={loadingOracleConfigs}>
            刷新配置
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            {loadingOracleConfigs ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Spin />
              </div>
            ) : oracleConfigs.length === 0 ? (
              <Empty description={`暂无 ${activeStage} 配置，请先在「Prompt配置」页添加或执行对应的 SQL 脚本`} />
            ) : (
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: 8 }}>
                <List
                  size="small"
                  dataSource={oracleConfigs}
                  renderItem={(config) => (
                    <List.Item
                      style={{ padding: '8px 0' }}
                      actions={[
                        <Button
                          key="select"
                          type={selectedOracleConfig?.id === config.id ? 'primary' : 'default'}
                          size="small"
                          onClick={() => handleSelectOracleConfig(config)}
                        >
                          {selectedOracleConfig?.id === config.id ? '已选' : '选择'}
                        </Button>,
                        <Button
                          key="activate"
                          size="small"
                          loading={activatingId === config.id}
                          disabled={config.is_active}
                          icon={config.is_active ? <CheckCircleOutlined /> : undefined}
                          onClick={() => handleActivateOracleConfig(config.id)}
                        >
                          {config.is_active ? '已激活' : '激活'}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>版本 {config.version}</Text>
                            {config.is_active && <Tag color="green">当前生效</Tag>}
                          </Space>
                        }
                        description={
                          <Space>
                            <Text type="secondary">模型: {config.model_name}</Text>
                            {config.config && (
                              <Text type="secondary">
                                {[config.config.max_tokens && `max_tokens: ${config.config.max_tokens}`, config.config.temperature != null && `temperature: ${config.config.temperature}`].filter(Boolean).join(', ')}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Col>
          <Col span={12}>
            {editingConfig ? (
              <Card
                size="small"
                title="配置编辑"
                extra={
                  <Button type="primary" size="small" icon={<SaveOutlined />} onClick={() => setSaveVersionModalVisible(true)}>
                    保存为新版本
                  </Button>
                }
              >
                <div style={{ marginBottom: 12 }}>
                  <Text strong>System Prompt:</Text>
                  <TextArea
                    value={editingConfig.system_prompt ?? ''}
                    onChange={(e) => setEditingConfig((prev) => (prev ? { ...prev, system_prompt: e.target.value } : null))}
                    rows={4}
                    style={{ marginTop: 8 }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>User Prompt（可选）:</Text>
                  <TextArea
                    value={editingConfig.user_prompt ?? ''}
                    onChange={(e) => setEditingConfig((prev) => (prev ? { ...prev, user_prompt: e.target.value } : null))}
                    rows={2}
                    style={{ marginTop: 8 }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Tools (JSON，function calling 定义):</Text>
                  <TextArea
                    value={
                      typeof editingConfig.tools === 'string'
                        ? editingConfig.tools
                        : editingConfig.tools != null
                          ? JSON.stringify(editingConfig.tools, null, 2)
                          : ''
                    }
                    onChange={(e) => setEditingConfig((prev) => (prev ? { ...prev, tools: e.target.value } : null))}
                    rows={6}
                    style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12 }}
                    placeholder='[{"type":"function","function":{...}}]'
                  />
                </div>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text strong>模型:</Text>
                    <Select
                      value={editingConfig.model_name}
                      onChange={(value) => setEditingConfig((prev) => (prev ? { ...prev, model_name: value } : null))}
                      style={{ marginTop: 8, width: '100%' }}
                      placeholder="选择模型"
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {availableModels.map((m) => (
                        <Option key={m} value={m}>{m}</Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary">max_tokens:</Text>
                    <InputNumber
                      value={editingConfig.config?.max_tokens as number | undefined}
                      onChange={(value) =>
                        setEditingConfig((prev) =>
                          prev ? { ...prev, config: { ...prev.config, max_tokens: value ?? undefined } } : null
                        )
                      }
                      style={{ marginTop: 8, width: '100%' }}
                      placeholder="如 2000"
                    />
                  </Col>
                  <Col span={6}>
                    <Text type="secondary">temperature:</Text>
                    <InputNumber
                      value={editingConfig.config?.temperature as number | undefined}
                      onChange={(value) =>
                        setEditingConfig((prev) =>
                          prev ? { ...prev, config: { ...prev.config, temperature: value ?? undefined } } : null
                        )
                      }
                      style={{ marginTop: 8, width: '100%' }}
                      placeholder="如 0.7"
                      min={0}
                      max={2}
                      step={0.1}
                    />
                  </Col>
                </Row>
              </Card>
            ) : (
              <Text type="secondary">请先在左侧选择一条配置</Text>
            )}
          </Col>
        </Row>
      </Card>

      {/* 下方：会话列表 + 聊天区域 */}
      <div style={{ flex: 1, display: 'flex', gap: 24, minHeight: 0 }}>
      {/* 左侧：会话列表 */}
      <Card
        title="会话列表"
        style={{ width: 280, flexShrink: 0 }}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleCreateConversation}
            loading={sending}
          >
            新建
          </Button>
        }
      >
        {loadingList ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : conversations.length === 0 ? (
          <Empty description="暂无会话" />
        ) : (
          <List
            dataSource={conversations}
            renderItem={(c) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  background: currentConvId === c.id ? '#e6f7ff' : undefined,
                  borderRadius: 8,
                  padding: '8px 12px',
                }}
                onClick={() => setCurrentConvId(c.id)}
              >
                <div style={{ width: '100%' }}>
                  <Text strong ellipsis>
                    {c.title || '新对话'}
                  </Text>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {new Date(c.updated_at).toLocaleString()}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 右侧：聊天区域 */}
      <Card
        title={currentConvId ? '对话' : '请选择或新建会话'}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}
      >
        {!currentConvId ? (
          <Empty description="在左侧选择会话或点击「新建」" style={{ margin: 'auto' }} />
        ) : (
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <Spin />
                </div>
              ) : messages.length === 0 ? (
                <Empty description="暂无消息，在下方输入并发送" />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {messages.map((msg) => {
                    // 判断这条消息是否包含工具调用（assistant 触发的 tool_calls）
                    const toolCallsList = msg.role === 'assistant' && Array.isArray(msg.tool_calls) ? msg.tool_calls : null;
                    const hasToolCalls = toolCallsList !== null && toolCallsList.length > 0;

                    return (
                      <div key={msg.id}>
                        {/* 文本内容气泡（如果有内容才显示） */}
                        {msg.content ? (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '75%',
                                padding: '10px 14px',
                                borderRadius: 12,
                                background: msg.role === 'user' ? '#1890ff' : msg.role === 'tool' ? '#fff7e6' : '#f0f0f0',
                                color: msg.role === 'user' ? '#fff' : '#000',
                                border: msg.role === 'tool' ? '1px solid #ffd591' : undefined,
                              }}
                            >
                              <Text style={{ fontSize: 12, color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : '#999' }}>
                                {msg.role === 'user' ? '我' : msg.role === 'assistant' ? '易罗' : '工具结果'}
                              </Text>
                              <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {/* 工具调用气泡：assistant 消息如果有 tool_calls，单独显示为一个 JSON 气泡 */}
                        {hasToolCalls && (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-start',
                              marginTop: msg.content ? 8 : 0,
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '80%',
                                padding: '10px 14px',
                                borderRadius: 12,
                                background: '#f6ffed',
                                border: '1px solid #b7eb8f',
                              }}
                            >
                              <Text style={{ fontSize: 12, color: '#52c41a' }}>
                                🔧 工具调用
                              </Text>
                              <pre
                                style={{
                                  margin: 0,
                                  marginTop: 4,
                                  fontSize: 12,
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-all',
                                }}
                              >
                                {JSON.stringify(toolCallsList, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* 没有文本也没有 tool_calls 时显示占位 */}
                        {!msg.content && !hasToolCalls && (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '75%',
                                padding: '10px 14px',
                                borderRadius: 12,
                                background: '#f0f0f0',
                              }}
                            >
                              <Text style={{ fontSize: 12, color: '#999' }}>
                                {msg.role === 'user' ? '我' : msg.role === 'assistant' ? '易罗' : '工具结果'}
                              </Text>
                              <div style={{ marginTop: 4, color: '#999' }}>(无文本)</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Space>
              )}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="输入消息…"
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={sending}
                  disabled={!inputText.trim()}
                >
                  发送
                </Button>
              </Space.Compact>
            </div>
          </>
        )}
      </Card>
      </div>

      {/* 保存为新版本：输入版本号后 POST 新配置 */}
      <Modal
        title="保存为新版本"
        open={saveVersionModalVisible}
        onCancel={() => {
          setSaveVersionModalVisible(false);
          saveVersionForm.resetFields();
        }}
        footer={null}
      >
        <Form form={saveVersionForm} layout="vertical" onFinish={handleSaveAsNewVersion}>
          <Form.Item name="version" label="新版本号" rules={[{ required: true, message: '请输入版本号' }]}>
            <Input placeholder="如: v1.1.0" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setSaveVersionModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
