// src/pages/QuestionClarify.tsx
// 问题澄清页面（AI调试）

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

  // 右侧结果解析区的状态
  const [allSuggestedQuestions, setAllSuggestedQuestions] = useState<string[]>([]);  // 累积的所有追问问题（字符串数组）
  const [extractedTags, setExtractedTags] = useState<string[]>([]);  // AI提取的新标签（仅在最终阶段）
  const [finalQuestion, setFinalQuestion] = useState<string>('');  // 最终明确的问题
  const [needsMoreClarification, setNeedsMoreClarification] = useState<boolean>(true);  // 是否还需要追问

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
  const defaultSystemPrompt = `你是一个专业的问题澄清助手，帮助用户将模糊的问题澄清为具体、明确的问题。

用户信息：
- 用户名：{user_name}
- 用户标签：{user_tags}
- 初始问题：{initial_question}

你的任务是：
1. 分析用户的问题是否足够明确
2. 如果不明确，提出具体的追问来澄清细节
3. 如果已经明确，总结最终问题并提取新的用户标签

**重要：你必须严格按照以下JSON格式返回，不要添加任何其他文字：**

如果还需要追问：
{
  "status": "continue",
  "needs_clarification": true,
  "suggested_questions": "请具体说明你遇到的问题是什么？比如：是技术问题、业务问题还是其他类型的问题？",
  "final_question": "",
  "extracted_tags": []
}

如果问题已经澄清：
{
  "status": "completed", 
  "needs_clarification": false,
  "suggested_questions": "",
  "final_question": "用户最终明确的具体问题",
  "extracted_tags": ["从对话中提取的新标签1", "新标签2"]
}

注意事项：
- suggested_questions应该是一个完整的追问句子，不是数组
- extracted_tags应该是字符串数组，包含从对话中识别出的用户新特征
- 确保JSON格式完全正确，不要有语法错误
- 不要在JSON外添加任何解释文字`;

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
        parseAIResponse(data.ai_response);
        
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
  const parseAIResponse = (aiResponse: any) => {
    console.log('解析AI回复:', aiResponse);
    
    // 判断是否还需要追问
    if (aiResponse.status === 'continue') {
      setNeedsMoreClarification(true);
      
      // 如果有新的追问问题（字符串格式），添加到历史中
      if (aiResponse.suggested_questions && aiResponse.suggested_questions.trim() !== '') {
        setAllSuggestedQuestions(prev => [...prev, aiResponse.suggested_questions]);
      }
    } else if (aiResponse.status === 'completed') {
      setNeedsMoreClarification(false);
      
      // 设置最终问题和新标签
      if (aiResponse.final_question) {
        setFinalQuestion(aiResponse.final_question);
      }
      if (aiResponse.extracted_tags) {
        setExtractedTags(aiResponse.extracted_tags);
      }
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
        parseAIResponse(data.ai_response);
        
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

  // 添加标签到用户
  const handleAddTagsToUser = async () => {
    if (extractedTags.length === 0 || !selectedUserId) {
      return;
    }

    try {
      const response = await fetch(createApiUrl(API_ENDPOINTS.CLARIFY_ADD_TAGS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: selectedUserId?.toString() || '',  // 转换为字符串
          tags: extractedTags,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('标签添加成功！');
        // 清空已添加的标签
        setExtractedTags([]);
        console.log('标签添加成功:', data);
      } else {
        console.error('添加标签失败:', data);
        alert('添加标签失败: ' + (data.detail || '未知错误'));
      }
    } catch (error) {
      console.error('添加标签失败:', error);
      alert('添加标签失败: ' + error);
    }
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
    
    // 清空右侧结果解析区
    setAllSuggestedQuestions([]);
    setExtractedTags([]);
    setFinalQuestion('');
    setNeedsMoreClarification(true);
    
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
          问题澄清（AI调试）
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
                  <Title level={5}>初始问题</Title>
                  <TextArea
                    rows={4}
                    placeholder="请输入用户的初始模糊问题"
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
- 明确needs_clarification字段
- 说明suggested_questions和final_question的用法
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
                  {isStartingConversation ? '正在连接AI...' : '开始对话'}
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
                      (显示完整AI返回体，用于调试JSON格式)
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
                    请配置上方参数并点击"开始对话"
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
                  结果解析区
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2, lineHeight: '14px' }}>
                    期望JSON字段：<br/>
                    • needs_clarification: true/false<br/>
                    • suggested_questions: "..." <br/>
                    • final_question: "..."<br/>
                    • extracted_tags: [...]
                  </div>
                </div>
              }
              style={{ minHeight: 600 }}
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                
                {/* 状态指示器 */}
                <div style={{ 
                  padding: 8, 
                  backgroundColor: needsMoreClarification ? '#fff7e6' : '#f6ffed', 
                  border: `1px solid ${needsMoreClarification ? '#ffd591' : '#b7eb8f'}`,
                  borderRadius: 4,
                  textAlign: 'center'
                }}>
                  <span style={{ 
                    color: needsMoreClarification ? '#fa8c16' : '#52c41a',
                    fontWeight: 'bold'
                  }}>
                    {needsMoreClarification ? '🔄 还需要继续追问' : '✅ 问题已澄清完成'}
                  </span>
                </div>
                
                {/* 第一个区域：AI追问历史 */}
                <div>
                  <Title level={5}>AI追问历史</Title>
                  <div style={{ minHeight: 120, backgroundColor: '#f9f9f9', padding: 8, borderRadius: 4 }}>
                    {allSuggestedQuestions.length > 0 ? (
                      allSuggestedQuestions.map((question: string, index: number) => (
                        <div key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: '#fff', borderRadius: 4 }}>
                          <span style={{ color: '#1890ff', fontWeight: 'bold' }}>第{index + 1}轮追问：</span>
                          <br />
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {question}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#999' }}>暂无追问记录</div>
                    )}
                  </div>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* 第二个区域：最终明确的问题 */}
                <div>
                  <Title level={5}>✅ 最终明确问题</Title>
                  <div style={{ minHeight: 80, backgroundColor: '#f6ffed', padding: 8, borderRadius: 4, border: '1px solid #b7eb8f' }}>
                    {finalQuestion ? (
                      <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
                        {finalQuestion}
                      </div>
                    ) : (
                      <div style={{ color: '#999' }}>等待AI生成最终问题...</div>
                    )}
                  </div>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* 第三个区域：AI提取的新标签 */}
                <div>
                  <Title level={5}>🏷️ AI提取的新标签</Title>
                  <div style={{ minHeight: 60, backgroundColor: '#fff2e8', padding: 8, borderRadius: 4, border: '1px solid #ffd591' }}>
                    {extractedTags.length > 0 ? (
                      <div>
                        {extractedTags.map((tag: string, index: number) => (
                          <span key={index} style={{ 
                            background: '#e6f7ff', 
                            padding: '4px 8px', 
                            borderRadius: 4, 
                            marginRight: 4,
                            marginBottom: 4,
                            display: 'inline-block',
                            border: '1px solid #91d5ff'
                          }}>
                            {tag}
                          </span>
                        ))}
                        <div style={{ marginTop: 8 }}>
                          <Button 
                            size="small" 
                            type="primary" 
                            onClick={() => handleAddTagsToUser()}
                          >
                            确认添加到用户
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#999' }}>暂无新标签</div>
                    )}
                  </div>
                </div>

              </Space>
            </Card>
          </Col>

        </Row>

      </div>
    </div>
  );
}

export default QuestionClarify; 