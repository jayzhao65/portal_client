// src/pages/QuestionClarify.tsx
// 问题质量评估页面（红黄绿灯系统）

import { useState, useEffect } from 'react';
import { createApiUrl, API_ENDPOINTS } from '../config/api';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button,
  Select,
  Input,
  Space,
  Divider
} from 'antd';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 定义数据类型
interface User {
  id: number;  // 修正：数据库返回的是数字类型
  user_name: string;
  user_tags: string[];
}

interface AIModel {
  model_id: string;
  model_name: string;
  provider: string;
  api_endpoint: string;
}

function QuestionClarify() {
  // ========== 状态管理 ==========
  // 左侧配置区的状态
  const [users, setUsers] = useState<User[]>([]);  // 用户列表
  const [models, setModels] = useState<AIModel[]>([]);  // AI模型列表
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);  // 选择的用户ID
  const [selectedModelId, setSelectedModelId] = useState<string>('');  // 选择的模型ID
  const [systemPrompt, setSystemPrompt] = useState<string>('');  // 系统提示词
  const [processedSystemPrompt, setProcessedSystemPrompt] = useState<string>('');  // 处理后的系统提示词
  const [initialQuestion, setInitialQuestion] = useState<string>('');  // 初始问题

  // 中间对话区的状态
  const [messages, setMessages] = useState<any[]>([]);  // 对话消息列表
  const [sessionId, setSessionId] = useState<string>('');  // 会话ID
  const [isConversationStarted, setIsConversationStarted] = useState<boolean>(false);  // 是否已开始对话
  const [userInput, setUserInput] = useState<string>('');  // 用户输入内容

  // 右侧结果解析区的状态 - 红黄绿灯评估
  const [lightColor, setLightColor] = useState<string>('');  // 当前灯的颜色：red/yellow/green
  const [lightReason, setLightReason] = useState<string>('');  // 红灯或黄灯的原因
  const [yellowOptions, setYellowOptions] = useState<string[]>([]);  // 黄灯时的改写选项
  const [greenUnderstanding, setGreenUnderstanding] = useState<string>('');  // 绿灯时的理解确认
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);  // 评估历史记录

  // 加载状态
  const [isStartingConversation, setIsStartingConversation] = useState<boolean>(false);  // 是否正在开始对话
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);  // 是否正在发送消息

  // ========== 页面初始化：获取用户和模型数据 ==========
  useEffect(() => {
    // 获取用户列表
    fetchUsers();
    // 获取AI模型列表
    fetchModels();
    // 设置默认系统提示词
    setSystemPrompt(defaultSystemPrompt);
  }, []);

  // 获取用户列表的函数
  const fetchUsers = async () => {
    try {
      const response = await fetch(createApiUrl(API_ENDPOINTS.USERS));
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  // 获取AI模型列表的函数
  const fetchModels = async () => {
    try {
      const response = await fetch(createApiUrl(API_ENDPOINTS.MODELS));
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('获取模型列表失败:', error);
    }
  };

  // ========== 默认系统提示词 ==========
  const defaultSystemPrompt = `你是一个专业的占卜问题质量评估助手，负责判断用户的问题是否适合进行占卜。

用户信息：
- 用户名：{user_name}
- 用户标签：{user_tags}
- 用户问题：{initial_question}

你的任务是评估问题质量，按照红黄绿灯进行分类：

🔴 **红灯（不适合占卜）**：
- 问题本质上不适合占卜（如：明确的事实性问题、已发生的事件、需要专业医疗/法律建议等）
- 问题涉及伤害他人或违法内容
- 过于琐碎或无意义的问题

🟡 **黄灯（需要改写）**：
- 问题意图清晰，但提问方式不够好
- 问题太宽泛或太具体
- 时间框架不明确
- 可以通过改写提升占卜效果

🟢 **绿灯（优质问题）**：
- 问题明确、具体、适合占卜
- 时间框架合理
- 表达清晰，无歧义
- 可以直接进行占卜

**重要：你必须严格按照以下JSON格式返回，不要添加任何其他文字：**

红灯情况：
{
  "light_color": "red",
  "reason": "详细说明为什么这个问题不适合占卜的原因，并建议用户重新思考问题"
}

黄灯情况：
{
  "light_color": "yellow",
  "reason": "简短说明问题意图清晰但提问方式需要改进的原因",
  "options": [
    "改写选项1：具体的改写后问题",
    "改写选项2：具体的改写后问题", 
    "改写选项3：具体的改写后问题"
  ]
}

绿灯情况：
{
  "light_color": "green",
  "understanding": "对问题的理解和确认，表明可以进入占卜环节的连接句"
}

注意事项：
- light_color必须是red/yellow/green之一
- 确保JSON格式完全正确，不要有语法错误
- 不要在JSON外添加任何解释文字
- options必须是3个具体的改写后问题，不是建议性文字`;

  // ========== 占位符处理功能 ==========
  
  // 处理系统提示词中的占位符
  const processPlaceholders = (prompt: string, userId: number, question: string) => {
    // 获取选中用户的信息
    const selectedUser = users.find(u => u.id === userId);
    const userName = selectedUser?.user_name || '';
    const userTags = selectedUser?.user_tags || [];
    const tagsText = userTags.length > 0 ? userTags.join('、') : '暂无标签';
    
    // 替换占位符
    return prompt
      .replace(/{user_name}/g, userName)
      .replace(/{user_tags}/g, tagsText)
      .replace(/{initial_question}/g, question);
  };

  // ========== API调用功能 ==========
  
  // 开始问题澄清对话
  const handleStartConversation = async () => {
    // 确保selectedUserId有值（在设置loading状态前检查）
    if (!selectedUserId) {
      alert('请先选择用户');
      return;
    }
    
    // 设置加载状态
    setIsStartingConversation(true);
    
    try {
      
      // 处理系统提示词中的占位符
      const processedPrompt = processPlaceholders(systemPrompt, selectedUserId, initialQuestion);
      
      // 保存处理后的系统提示词供继续对话使用
      setProcessedSystemPrompt(processedPrompt);
      
      console.log('原始提示词:', systemPrompt);
      console.log('处理后提示词:', processedPrompt);
      
      const response = await fetch(createApiUrl(API_ENDPOINTS.CLARIFY_START), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUserId.toString(),  // 转换为字符串
          model_id: selectedModelId,
          system_prompt: processedPrompt,  // 使用处理后的提示词
          initial_question: initialQuestion,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // 设置会话ID
        setSessionId(data.session_id);
        setIsConversationStarted(true);
        
        // 设置对话消息
        setMessages(data.messages);
        
        // 解析AI回复并更新右侧区域
        console.log('开始对话 - 完整返回数据:', data);
        console.log('开始对话 - data.ai_response:', data.ai_response);
        console.log('开始对话 - data.messages:', data.messages);
        
        // 检查ai_response是否存在，如果不存在则从最后一条AI消息中获取
        let aiResponseContent = data.ai_response;
        if (!aiResponseContent && data.messages && data.messages.length > 0) {
          const lastMessage = data.messages[data.messages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            aiResponseContent = lastMessage.content;
            console.log('从消息中提取AI回复:', aiResponseContent);
          }
        }
        
        if (aiResponseContent) {
          parseAIResponse(aiResponseContent);
        } else {
          console.error('未找到AI回复内容');
        }
        
        console.log('对话开始成功:', data);
      } else {
        console.error('开始对话失败:', data);
        alert('开始对话失败: ' + (data.detail || '未知错误'));
      }
    } catch (error) {
      console.error('开始对话失败:', error);
      alert('开始对话失败: ' + error);
    } finally {
      // 无论成功还是失败，都要取消加载状态
      setIsStartingConversation(false);
    }
  };

  // 解析AI回复，更新右侧显示
  const parseAIResponse = (aiResponseContent: any) => {
    console.log('解析AI回复原始内容:', aiResponseContent);
    console.log('原始内容类型:', typeof aiResponseContent);
    
    if (!aiResponseContent) {
      console.error('AI回复内容为空');
      return;
    }
    
    let aiResponse;
    
    try {
      // 如果已经是对象，直接使用；如果是字符串，尝试解析JSON
      if (typeof aiResponseContent === 'object') {
        console.log('AI回复已经是对象格式');
        aiResponse = aiResponseContent;
      } else {
        console.log('AI回复是字符串，尝试解析JSON');
        aiResponse = JSON.parse(aiResponseContent);
      }
      console.log('✅ JSON解析成功！解析后的AI回复对象:', aiResponse);
      console.log('对象的所有键:', Object.keys(aiResponse));
      console.log('对象类型:', Array.isArray(aiResponse) ? 'Array' : typeof aiResponse);
      
      // 尝试访问字段
      console.log('light_color:', aiResponse.light_color);
      console.log('reason:', aiResponse.reason);
      console.log('options:', aiResponse.options);
      console.log('understanding:', aiResponse.understanding);
      
      // 如果是旧格式，也打印出来
      console.log('旧格式字段 - status:', aiResponse.status);
      console.log('旧格式字段 - suggested_questions:', aiResponse.suggested_questions);
      console.log('旧格式字段 - final_question:', aiResponse.final_question);
      
      // 保存当前评估到历史记录
      const currentEvaluation = {
        timestamp: new Date().toLocaleTimeString(),
        lightColor: aiResponse.light_color,
        reason: aiResponse.reason,
        options: aiResponse.options,
        understanding: aiResponse.understanding
      };
      console.log('添加评估历史记录:', currentEvaluation);
      setEvaluationHistory(prev => [...prev, currentEvaluation]);
      
      // 根据灯的颜色设置相应状态
      console.log('设置灯的颜色:', aiResponse.light_color);
      setLightColor(aiResponse.light_color);
      
      if (aiResponse.light_color === 'red') {
        console.log('🔴 处理红灯状态');
        setLightReason(aiResponse.reason || '');
        setYellowOptions([]);
        setGreenUnderstanding('');
      } else if (aiResponse.light_color === 'yellow') {
        console.log('🟡 处理黄灯状态');
        console.log('设置黄灯原因:', aiResponse.reason);
        console.log('设置黄灯选项:', aiResponse.options);
        setLightReason(aiResponse.reason || '');
        setYellowOptions(aiResponse.options || []);
        setGreenUnderstanding('');
      } else if (aiResponse.light_color === 'green') {
        console.log('🟢 处理绿灯状态');
        setLightReason('');
        setYellowOptions([]);
        setGreenUnderstanding(aiResponse.understanding || '');
      }
      
    } catch (error) {
      console.error('❌ 解析AI回复JSON失败:', error);
      console.error('原始内容:', aiResponseContent);
      
      // 解析失败时的处理
      setLightColor('error');
      setLightReason(`JSON解析错误: ${error}`);
      setYellowOptions([]);
      setGreenUnderstanding('');
    }
  };

  // 继续对话（用户回复）
  const handleContinueConversation = async (userMessage: string) => {
    // 设置发送消息的加载状态
    setIsSendingMessage(true);
    
    try {
      // 构建完整的对话历史（用于发送给后端）
      const fullConversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || null
      }));
      
      console.log('继续对话 - 发送的对话历史:', fullConversationHistory);
      
      const response = await fetch(createApiUrl(API_ENDPOINTS.CLARIFY_CONTINUE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
          model_id: selectedModelId,  // 发送当前选择的模型
          system_prompt: processedSystemPrompt,  // 发送处理后的系统提示词（不含占位符）
          conversation_history: fullConversationHistory  // 发送完整对话历史
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // 添加用户消息和AI回复到对话历史
        setMessages(prev => [
          ...prev,
          { role: 'user', content: userMessage },
          data.new_message
        ]);
        
        // 解析新的AI回复
        console.log('继续对话 - 完整返回数据:', data);
        console.log('继续对话 - data.ai_response:', data.ai_response);
        console.log('继续对话 - data.new_message:', data.new_message);
        
        // 检查ai_response是否存在，如果不存在则从新消息中获取
        let aiResponseContent = data.ai_response;
        if (!aiResponseContent && data.new_message && data.new_message.content) {
          aiResponseContent = data.new_message.content;
          console.log('从新消息中提取AI回复:', aiResponseContent);
        }
        
        if (aiResponseContent) {
          parseAIResponse(aiResponseContent);
        } else {
          console.error('未找到AI回复内容');
        }
        
        console.log('继续对话成功:', data);
      } else {
        console.error('继续对话失败:', data);
        alert('继续对话失败: ' + (data.detail || '未知错误'));
      }
    } catch (error) {
      console.error('继续对话失败:', error);
      alert('继续对话失败: ' + error);
    } finally {
      // 无论成功还是失败，都要取消发送消息的加载状态
      setIsSendingMessage(false);
    }
  };

  // 选择黄灯选项
  const handleSelectYellowOption = (selectedOption: string) => {
    // 将选择的改进问题放入输入框
    setUserInput(selectedOption);
    console.log('选择了改进选项:', selectedOption);
  };

  // 发送用户消息
  const handleSendMessage = async () => {
    if (!userInput.trim() || !sessionId) {
      return;
    }

    const messageText = userInput.trim();
    setUserInput('');  // 清空输入框

    // 调用继续对话API
    await handleContinueConversation(messageText);
  };

  // 清空对话记录（保留左侧配置）
  const handleClearConversation = () => {
    // 清空对话相关状态
    setMessages([]);
    setSessionId('');
    setIsConversationStarted(false);
    setUserInput('');
    setProcessedSystemPrompt('');
    
    // 清空右侧结果解析区 - 新的红黄绿灯状态
    setLightColor('');
    setLightReason('');
    setYellowOptions([]);
    setGreenUnderstanding('');
    setEvaluationHistory([]);
    
    // 重置加载状态
    setIsStartingConversation(false);
    setIsSendingMessage(false);
    
    console.log('对话记录已清空，配置保留');
  };

  // ========== 渲染界面 ==========
  return (
    <div style={{ padding: 16, minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          问题质量评估（红黄绿灯系统）
        </Title>
        
        {/* 状态指示器 */}
        {(isStartingConversation || isSendingMessage) && (
          <div style={{ 
            padding: '4px 12px', 
            backgroundColor: '#e6f7ff', 
            border: '1px solid #91d5ff',
            borderRadius: 4,
            fontSize: 12,
            color: '#1890ff'
          }}>
            {isStartingConversation && '🔄 正在连接AI模型，请稍候...'}
            {isSendingMessage && '💬 正在发送消息，请稍候...'}
          </div>
        )}
      </div>
      
      {/* 上下布局 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* ==================== 顶部：配置区 ==================== */}
        <Card 
          title="配置区" 
          style={{ flexShrink: 0 }}
          size="small"
        >
          <Row gutter={16}>
            
            {/* 左侧：用户和模型选择 */}
            <Col span={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* 用户选择 */}
                <div>
                  <Title level={5}>选择用户</Title>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="请选择用户"
                    value={selectedUserId}
                    onChange={setSelectedUserId}
                  >
                    {users.map(user => (
                      <Option key={user.id} value={user.id}>
                        {user.user_name}
                      </Option>
                    ))}
                  </Select>
                  
                  {/* 显示选中用户的标签 */}
                  {selectedUserId && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                      用户标签：{users.find(u => u.id === selectedUserId)?.user_tags.join('、') || '无'}
                    </div>
                  )}
                </div>

                {/* AI模型选择 */}
                <div>
                  <Title level={5}>AI模型</Title>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="请选择AI模型"
                    value={selectedModelId}
                    onChange={setSelectedModelId}
                  >
                    {models.map(model => (
                      <Option key={model.model_id} value={model.model_id}>
                        {model.model_name}
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* 初始问题输入 */}
                <div>
                  <Title level={5}>待评估问题</Title>
                  <TextArea
                    rows={4}
                    placeholder="请输入用户要进行占卜的问题，系统将评估其质量（红黄绿灯）"
                    value={initialQuestion}
                    onChange={(e) => setInitialQuestion(e.target.value)}
                  />
                </div>
              </Space>
            </Col>

            {/* 中间：系统提示词 */}
            <Col span={12}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Title level={5} style={{ margin: 0 }}>系统提示词</Title>
                  <div style={{ fontSize: 12, color: '#666', textAlign: 'right', lineHeight: '16px' }}>
                    <div><strong>可用占位符：</strong></div>
                    <div>• {'{user_name}'} - 用户名称</div>
                    <div>• {'{user_tags}'} - 用户标签</div>
                    <div>• {'{initial_question}'} - 初始问题</div>
                  </div>
                </div>
                <TextArea
                  rows={12}
                  placeholder="请输入系统提示词，支持占位符替换。
建议包含：
- 要求AI返回JSON格式
- 明确light_color字段（red/yellow/green）
- 说明reason、options、understanding字段的用法
- 详细定义红黄绿灯的判断标准
- 使用占位符插入用户信息"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
                
                {/* 占位符预览 */}
                {systemPrompt && (systemPrompt.includes('{user_name}') || systemPrompt.includes('{user_tags}') || systemPrompt.includes('{initial_question}')) && (
                  <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
                    <div style={{ fontSize: 12, color: '#52c41a', marginBottom: 4 }}>
                      <strong>🔍 占位符预览：</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#666', whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'auto' }}>
                      {selectedUserId && initialQuestion ? 
                        processPlaceholders(systemPrompt, selectedUserId, initialQuestion) :
                        '请先选择用户和输入初始问题以预览替换效果'
                      }
                    </div>
                  </div>
                )}
              </div>
            </Col>

            {/* 右侧：操作按钮 */}
            <Col span={4}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* 开始对话按钮 */}
                <Button 
                  type="primary" 
                  size="large"
                  style={{ width: '100%' }}
                  loading={isStartingConversation}
                  disabled={!selectedUserId || !selectedModelId || !systemPrompt || !initialQuestion || isStartingConversation}
                  onClick={handleStartConversation}
                >
                  {isStartingConversation ? '正在连接AI...' : '开始评估'}
                </Button>
              </Space>
            </Col>

          </Row>
        </Card>

                {/* ==================== 底部：对话区和解析区 ==================== */}
        <Row gutter={16} style={{ minHeight: 600 }}>
          
          {/* 对话区（80%宽度） */}
          <Col span={15}>
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    对话区 
                    <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
                      (显示AI评估过程，用于调试红黄绿灯判断)
                    </span>
                  </div>
                  {/* 重新开始按钮（只有在对话开始后才显示） */}
                  {isConversationStarted && (
                    <Button 
                      type="default" 
                      size="small"
                      onClick={handleClearConversation}
                      icon={<span>🗑️</span>}
                    >
                      重新开始（保留配置）
                    </Button>
                  )}
                </div>
              }
              style={{ display: 'flex', flexDirection: 'column' }}
              size="small"
            >
              {/* 对话内容区域 */}
              <div style={{ minHeight: 400, padding: 16, backgroundColor: '#fafafa' }}>
                {!isConversationStarted ? (
                  <div style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>
                    请配置上方参数并点击"开始评估"
                  </div>
                ) : (
                  <div>
                    {/* 显示对话消息 */}
                    {messages.map((message, index) => (
                      <div key={index} style={{ marginBottom: 16 }}>
                        {message.role === 'user' ? (
                          // 用户消息
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{
                              maxWidth: '70%',
                              padding: 12,
                              backgroundColor: '#1890ff',
                              color: 'white',
                              borderRadius: 8,
                              borderBottomRightRadius: 2
                            }}>
                              {message.content}
                            </div>
                          </div>
                        ) : (
                          // AI消息
                          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <div style={{
                              maxWidth: '85%',
                              padding: 12,
                              backgroundColor: 'white',
                              border: '1px solid #e8e8e8',
                              borderRadius: 8,
                              borderBottomLeftRadius: 2
                            }}>
                              <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
                                🤖 AI回复（完整返回体）
                              </div>
                              <pre style={{ 
                                whiteSpace: 'pre-wrap', 
                                wordBreak: 'break-word',
                                margin: 0,
                                fontFamily: 'inherit',
                                fontSize: 14
                              }}>
                                {message.content}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 用户输入区域 */}
              <div style={{ borderTop: '1px solid #f0f0f0', padding: 16 }}>
                <Input.Group compact>
                  <Input
                    style={{ width: 'calc(100% - 80px)' }}
                    placeholder={isSendingMessage ? "正在发送消息..." : "输入您的回复..."}
                    disabled={!isConversationStarted || isSendingMessage}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onPressEnter={handleSendMessage}
                  />
                  <Button 
                    type="primary"
                    loading={isSendingMessage}
                    disabled={!isConversationStarted || !userInput.trim() || isSendingMessage}
                    onClick={handleSendMessage}
                  >
                    {isSendingMessage ? '发送中...' : '发送'}
                  </Button>
                </Input.Group>
              </div>
            </Card>
          </Col>

          {/* 解析区（20%宽度） */}
          <Col span={9}>
            <Card 
              title={
                <div>
                  问题质量评估区
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2, lineHeight: '14px' }}>
                    期望JSON字段：<br/>
                    • light_color: red/yellow/green<br/>
                    • reason: "..."（红灯/黄灯）<br/>
                    • options: [...]（黄灯）<br/>
                    • understanding: "..."（绿灯）
                  </div>
                </div>
              }
              style={{ minHeight: 600 }}
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                
                {/* 灯色状态指示器 */}
                <div style={{ 
                  padding: 8, 
                  backgroundColor: 
                    lightColor === 'red' ? '#fff2f0' :
                    lightColor === 'yellow' ? '#fffbe6' :
                    lightColor === 'green' ? '#f6ffed' :
                    lightColor === 'error' ? '#fff2f0' : '#f5f5f5',
                  border: `1px solid ${
                    lightColor === 'red' ? '#ffccc7' :
                    lightColor === 'yellow' ? '#ffe58f' :
                    lightColor === 'green' ? '#b7eb8f' :
                    lightColor === 'error' ? '#ffccc7' : '#d9d9d9'
                  }`,
                  borderRadius: 4,
                  textAlign: 'center'
                }}>
                  <span style={{ 
                    color: 
                      lightColor === 'red' ? '#ff4d4f' :
                      lightColor === 'yellow' ? '#faad14' :
                      lightColor === 'green' ? '#52c41a' :
                      lightColor === 'error' ? '#ff4d4f' : '#666',
                    fontWeight: 'bold'
                  }}>
                    {lightColor === 'red' && '🔴 红灯：问题不适合占卜'}
                    {lightColor === 'yellow' && '🟡 黄灯：问题需要改写'}
                    {lightColor === 'green' && '🟢 绿灯：优质问题，可以占卜'}
                    {lightColor === 'error' && '❌ 解析错误'}
                    {!lightColor && '⚪ 等待AI评估...'}
                  </span>
                </div>
                
                {/* 错误状态：显示错误信息 */}
                {lightColor === 'error' && (
                  <div>
                    <Title level={5}>❌ 解析错误</Title>
                    <div style={{ minHeight: 100, backgroundColor: '#fff2f0', padding: 8, borderRadius: 4, border: '1px solid #ffccc7' }}>
                      <div style={{ color: '#ff4d4f', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12 }}>
                        {lightReason || '未知错误'}
                      </div>
                    </div>
                  </div>
                )}

                {/* 红灯：显示原因 */}
                {lightColor === 'red' && (
                  <div>
                    <Title level={5}>🔴 不适合占卜的原因</Title>
                    <div style={{ minHeight: 100, backgroundColor: '#fff2f0', padding: 8, borderRadius: 4, border: '1px solid #ffccc7' }}>
                      <div style={{ color: '#ff4d4f', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {lightReason || '等待AI分析...'}
                      </div>
                    </div>
                  </div>
                )}

                {/* 黄灯：显示原因和选项 */}
                {lightColor === 'yellow' && (
                  <>
                    <div>
                      <Title level={5}>🟡 改写原因</Title>
                      <div style={{ minHeight: 60, backgroundColor: '#fffbe6', padding: 8, borderRadius: 4, border: '1px solid #ffe58f' }}>
                        <div style={{ color: '#faad14', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {lightReason || '等待AI分析...'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Title level={5}>📝 改进后的问题（请选择一个）</Title>
                      <div style={{ minHeight: 120, backgroundColor: '#fffbe6', padding: 8, borderRadius: 4, border: '1px solid #ffe58f' }}>
                        {yellowOptions.length > 0 ? (
                          <Space direction="vertical" style={{ width: '100%' }}>
                            {yellowOptions.map((option: string, index: number) => (
                              <div 
                                key={index}
                                style={{
                                  border: '1px solid #d9d9d9',
                                  borderRadius: 6,
                                  padding: 12,
                                  backgroundColor: '#fff',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s',
                                  position: 'relative'
                                }}
                                className="yellow-option-card"
                                onClick={() => handleSelectYellowOption(option)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#1890ff';
                                  e.currentTarget.style.backgroundColor = '#f6ffed';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#d9d9d9';
                                  e.currentTarget.style.backgroundColor = '#fff';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <div style={{ 
                                  fontSize: 12, 
                                  color: '#666', 
                                  marginBottom: 6,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <span style={{ fontWeight: 'bold' }}>改进问题 {index + 1}</span>
                                  <span style={{ 
                                    backgroundColor: '#e6f7ff', 
                                    color: '#1890ff',
                                    padding: '2px 6px',
                                    borderRadius: 3,
                                    fontSize: 10
                                  }}>
                                    点击选择
                                  </span>
                                </div>
                                <div style={{ 
                                  fontSize: 14, 
                                  color: '#333', 
                                  lineHeight: '1.4',
                                  wordBreak: 'break-word'
                                }}>
                                  {option}
                                </div>
                              </div>
                            ))}
                          </Space>
                        ) : (
                          <div style={{ color: '#999' }}>等待AI生成改进后的问题...</div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* 绿灯：显示理解确认 */}
                {lightColor === 'green' && (
                  <div>
                    <Title level={5}>🟢 问题理解确认</Title>
                    <div style={{ minHeight: 100, backgroundColor: '#f6ffed', padding: 8, borderRadius: 4, border: '1px solid #b7eb8f' }}>
                      <div style={{ color: '#52c41a', fontWeight: 'bold', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {greenUnderstanding || '等待AI确认...'}
                      </div>
                      {greenUnderstanding && (
                        <div style={{ marginTop: 12, textAlign: 'center' }}>
                          <Button type="primary" size="large">
                            进入占卜环节 →
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 评估历史记录 */}
                {evaluationHistory.length > 0 && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <div>
                      <Title level={5}>📋 评估历史</Title>
                      <div style={{ maxHeight: 120, overflowY: 'auto', backgroundColor: '#fafafa', padding: 8, borderRadius: 4 }}>
                        {evaluationHistory.map((evaluation, index) => (
                          <div key={index} style={{ marginBottom: 8, padding: 6, backgroundColor: '#fff', borderRadius: 4, fontSize: 12 }}>
                            <div style={{ color: '#666' }}>{evaluation.timestamp}</div>
                            <div style={{ 
                              color: 
                                evaluation.lightColor === 'red' ? '#ff4d4f' :
                                evaluation.lightColor === 'yellow' ? '#faad14' :
                                evaluation.lightColor === 'green' ? '#52c41a' : '#666'
                            }}>
                              {evaluation.lightColor === 'red' && '🔴 红灯'}
                              {evaluation.lightColor === 'yellow' && '🟡 黄灯'}
                              {evaluation.lightColor === 'green' && '🟢 绿灯'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              </Space>
            </Card>
          </Col>

        </Row>

      </div>
    </div>
  );
}

export default QuestionClarify; 