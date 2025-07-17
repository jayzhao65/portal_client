// src/pages/DivinationSetup.tsx
// 占卜设置页面 - 问题拆解和位置标题生成

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
  Divider,
  Tag,
  List
} from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 定义数据类型
interface User {
  id: number;  // 数据库返回的是数字类型
  user_name: string;
  user_tags: string[];
}

interface AIModel {
  model_id: string;
  model_name: string;
  provider: string;
  api_endpoint: string;
}

// 位置标题数据结构
interface PositionTitles {
  unique_card: string;  // 唯一牌（用九、用六、全部不变时）
  original_gua: string;  // 本卦
  changed_gua: string;  // 之卦
  upper_changing_yao: string;  // 上变爻（主要因素，单个变爻时使用）
  lower_changing_yao: string;  // 下变爻
  upper_unchanging_yao: string;  // 上不变爻
  lower_unchanging_yao: string;  // 下不变爻（主要因素，单个不变爻时使用）
}

function DivinationSetup() {
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
  const [extendedQuestions, setExtendedQuestions] = useState<string[]>([]);  // 细化问题列表
  const [positionTitles, setPositionTitles] = useState<PositionTitles>({
    unique_card: '',
    original_gua: '',
    changed_gua: '',
    upper_changing_yao: '',
    lower_changing_yao: '',
    upper_unchanging_yao: '',
    lower_unchanging_yao: ''
  });  // 位置标题

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
      const response = await fetch(createApiUrl(API_ENDPOINTS.SETUP_MODELS));
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('获取模型列表失败:', error);
    }
  };

  // ========== 默认系统提示词 ==========
  const defaultSystemPrompt = `你是一个专业的占卜设置助手，负责分析用户的问题并为即将进行的六爻占卜做准备工作。

用户信息：
- 用户名：{user_name}
- 用户标签：{user_tags}
- 用户问题：{initial_question}

你的任务包括两个方面：

## 1. 问题拆解（extended_questions）
将用户的问题拆解为更细粒度的子问题，帮助占卜师更全面深入地分析问题：
- 从不同角度思考问题
- 挖掘问题背后的潜在层面
- 提供有助于占卜解读的细化问题
- 通常拆解为3-5个相关子问题

## 2. 位置标题生成（position_titles）
为六爻占卜的各个位置制定专门的标题，这些标题将指导后续的解读：

### 根据变爻情况的使用规则：
- **唯一牌**：用九、用六、全部不变（只有本卦）时使用
- **本卦**：代表当前状态、问题根源
- **之卦**：代表未来状态、问题发展
- **上变爻**：主要因素，当只有一个变爻时重点使用
- **下变爻**：次要变化因素  
- **上不变爻**：稳定的高层面因素
- **下不变爻**：主要因素，当只有一个不变爻时重点使用

### 标题要求：
- 每个标题要与用户的具体问题相关
- 标题要简洁明了，通常6-12个字
- 体现该位置在问题中的特定作用和意义

**重要：你必须严格按照以下JSON格式返回，不要添加任何其他文字：**

{
  "extended_questions": [
    "细化问题1：具体的子问题描述",
    "细化问题2：另一个角度的分析",
    "细化问题3：更深层的思考方向",
    "细化问题4：相关的影响因素",
    "细化问题5：结果导向的追问"
  ],
  "position_titles": {
    "unique_card": "唯一牌标题（适用于用九/用六/全不变）",
    "original_gua": "本卦标题（当前状态）",
    "changed_gua": "之卦标题（未来发展）", 
    "upper_changing_yao": "上变爻标题（主要变化因素）",
    "lower_changing_yao": "下变爻标题（次要变化因素）",
    "upper_unchanging_yao": "上不变爻标题（稳定高层因素）",
    "lower_unchanging_yao": "下不变爻标题（稳定基础因素）"
  }
}

注意事项：
- 确保JSON格式完全正确，不要有语法错误
- 不要在JSON外添加任何解释文字
- 所有标题都要与用户的具体问题高度相关
- 细化问题要有助于占卜师的深度分析`;

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
  
  // 开始占卜设置对话
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
      
      const response = await fetch(createApiUrl(API_ENDPOINTS.SETUP_START), {
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
        console.log('开始占卜设置对话 - 完整返回数据:', data);
        console.log('开始占卜设置对话 - data.ai_response:', data.ai_response);
        console.log('开始占卜设置对话 - data.messages:', data.messages);
        
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
        
        console.log('占卜设置对话开始成功:', data);
      } else {
        console.error('开始占卜设置对话失败:', data);
        alert('开始对话失败: ' + (data.detail || '未知错误'));
      }
    } catch (error) {
      console.error('开始占卜设置对话失败:', error);
      alert('开始对话失败: ' + error);
    } finally {
      // 无论成功还是失败，都要取消加载状态
      setIsStartingConversation(false);
    }
  };

  // 解析AI回复，更新右侧显示
  const parseAIResponse = (aiResponseContent: any) => {
    console.log('解析占卜设置AI回复原始内容:', aiResponseContent);
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
      console.log('extended_questions:', aiResponse.extended_questions);
      console.log('position_titles:', aiResponse.position_titles);
      
      // 更新细化问题
      if (aiResponse.extended_questions && Array.isArray(aiResponse.extended_questions)) {
        console.log('设置细化问题:', aiResponse.extended_questions);
        setExtendedQuestions(aiResponse.extended_questions);
      } else {
        console.log('未找到有效的细化问题数组');
        setExtendedQuestions([]);
      }
      
      // 更新位置标题
      if (aiResponse.position_titles && typeof aiResponse.position_titles === 'object') {
        console.log('设置位置标题:', aiResponse.position_titles);
        setPositionTitles({
          unique_card: aiResponse.position_titles.unique_card || '',
          original_gua: aiResponse.position_titles.original_gua || '',
          changed_gua: aiResponse.position_titles.changed_gua || '',
          upper_changing_yao: aiResponse.position_titles.upper_changing_yao || '',
          lower_changing_yao: aiResponse.position_titles.lower_changing_yao || '',
          upper_unchanging_yao: aiResponse.position_titles.upper_unchanging_yao || '',
          lower_unchanging_yao: aiResponse.position_titles.lower_unchanging_yao || ''
        });
      } else {
        console.log('未找到有效的位置标题对象');
        setPositionTitles({
          unique_card: '',
          original_gua: '',
          changed_gua: '',
          upper_changing_yao: '',
          lower_changing_yao: '',
          upper_unchanging_yao: '',
          lower_unchanging_yao: ''
        });
      }
      
    } catch (error) {
      console.error('❌ 解析占卜设置AI回复JSON失败:', error);
      console.error('原始内容:', aiResponseContent);
      
      // 解析失败时的处理
      setExtendedQuestions([]);
      setPositionTitles({
        unique_card: '',
        original_gua: '',
        changed_gua: '',
        upper_changing_yao: '',
        lower_changing_yao: '',
        upper_unchanging_yao: '',
        lower_unchanging_yao: ''
      });
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
      
      console.log('继续占卜设置对话 - 发送的对话历史:', fullConversationHistory);
      
      const response = await fetch(createApiUrl(API_ENDPOINTS.SETUP_CONTINUE), {
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
        console.log('继续占卜设置对话 - 完整返回数据:', data);
        console.log('继续占卜设置对话 - data.ai_response:', data.ai_response);
        console.log('继续占卜设置对话 - data.new_message:', data.new_message);
        
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
        
        console.log('继续占卜设置对话成功:', data);
      } else {
        console.error('继续占卜设置对话失败:', data);
        alert('继续对话失败: ' + (data.detail || '未知错误'));
      }
    } catch (error) {
      console.error('继续占卜设置对话失败:', error);
      alert('继续对话失败: ' + error);
    } finally {
      // 无论成功还是失败，都要取消发送消息的加载状态
      setIsSendingMessage(false);
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
    setExtendedQuestions([]);
    setPositionTitles({
      unique_card: '',
      original_gua: '',
      changed_gua: '',
      upper_changing_yao: '',
      lower_changing_yao: '',
      upper_unchanging_yao: '',
      lower_unchanging_yao: ''
    });
    
    // 重置加载状态
    setIsStartingConversation(false);
    setIsSendingMessage(false);
    
    console.log('占卜设置对话记录已清空，配置保留');
  };

  // ========== 渲染界面 ==========
  return (
    <div style={{ padding: 16, minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          占卜设置 - 问题拆解与位置标题生成
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
                  <Title level={5}>占卜问题</Title>
                  <TextArea
                    rows={4}
                    placeholder="请输入要进行占卜的问题，AI将进行问题拆解和生成位置标题"
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
- 明确extended_questions和position_titles字段
- 说明问题拆解的要求
- 定义各个位置标题的含义和用法
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
                  {isStartingConversation ? '正在连接AI...' : '开始设置'}
                </Button>
              </Space>
            </Col>

          </Row>
        </Card>

        {/* ==================== 底部：对话区和解析区 ==================== */}
        <Row gutter={16} style={{ minHeight: 600 }}>
          
          {/* 对话区（65%宽度） */}
          <Col span={15}>
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    对话区 
                    <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
                      (显示AI处理过程，用于调试问题拆解和标题生成)
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
                    请配置上方参数并点击"开始设置"
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

          {/* 解析区（35%宽度） */}
          <Col span={9}>
            <Card 
              title={
                <div>
                  占卜设置结果
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2, lineHeight: '14px' }}>
                    期望JSON字段：<br/>
                    • extended_questions: [...]<br/>
                    • position_titles: {'{ ... }'}
                  </div>
                </div>
              }
              style={{ minHeight: 600 }}
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                
                {/* 细化问题列表 */}
                <div>
                  <Title level={5}>🔍 细化问题 ({extendedQuestions.length}个)</Title>
                  <div style={{ 
                    minHeight: 120, 
                    backgroundColor: '#f6ffed', 
                    padding: 8, 
                    borderRadius: 4, 
                    border: '1px solid #b7eb8f' 
                  }}>
                    {extendedQuestions.length > 0 ? (
                      <List
                        size="small"
                        dataSource={extendedQuestions}
                        renderItem={(item, index) => (
                          <List.Item style={{ padding: '4px 0', borderBottom: 'none' }}>
                            <div style={{ width: '100%' }}>
                              <Tag color="processing" style={{ marginBottom: 4 }}>
                                问题 {index + 1}
                              </Tag>
                              <div style={{ 
                                fontSize: 13, 
                                color: '#333', 
                                lineHeight: '1.4',
                                wordBreak: 'break-word'
                              }}>
                                {item}
                              </div>
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <div style={{ color: '#999', textAlign: 'center', paddingTop: 40 }}>
                        等待AI生成细化问题...
                      </div>
                    )}
                  </div>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* 位置标题 */}
                <div>
                  <Title level={5}>🎯 位置标题</Title>
                  <div style={{ 
                    minHeight: 350, 
                    backgroundColor: '#fff7e6', 
                    padding: 12, 
                    borderRadius: 4, 
                    border: '1px solid #ffd591' 
                  }}>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      
                      {/* 唯一牌 */}
                      <div style={{ padding: 8, backgroundColor: '#fff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          <strong>唯一牌</strong> <Text type="secondary">(用九/用六/全不变)</Text>
                        </div>
                        <div style={{ fontSize: 14, color: positionTitles.unique_card ? '#333' : '#999' }}>
                          {positionTitles.unique_card || '等待AI生成...'}
                        </div>
                      </div>

                      {/* 本卦 */}
                      <div style={{ padding: 8, backgroundColor: '#fff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          <strong>本卦</strong> <Text type="secondary">(当前状态)</Text>
                        </div>
                        <div style={{ fontSize: 14, color: positionTitles.original_gua ? '#333' : '#999' }}>
                          {positionTitles.original_gua || '等待AI生成...'}
                        </div>
                      </div>

                      {/* 之卦 */}
                      <div style={{ padding: 8, backgroundColor: '#fff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          <strong>之卦</strong> <Text type="secondary">(未来发展)</Text>
                        </div>
                        <div style={{ fontSize: 14, color: positionTitles.changed_gua ? '#333' : '#999' }}>
                          {positionTitles.changed_gua || '等待AI生成...'}
                        </div>
                      </div>

                      {/* 上变爻 */}
                      <div style={{ padding: 8, backgroundColor: '#fff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          <strong>上变爻</strong> <Text type="secondary">(主要变化因素)</Text>
                        </div>
                        <div style={{ fontSize: 14, color: positionTitles.upper_changing_yao ? '#333' : '#999' }}>
                          {positionTitles.upper_changing_yao || '等待AI生成...'}
                        </div>
                      </div>

                      {/* 下变爻 */}
                      <div style={{ padding: 8, backgroundColor: '#fff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          <strong>下变爻</strong> <Text type="secondary">(次要变化因素)</Text>
                        </div>
                        <div style={{ fontSize: 14, color: positionTitles.lower_changing_yao ? '#333' : '#999' }}>
                          {positionTitles.lower_changing_yao || '等待AI生成...'}
                        </div>
                      </div>

                      {/* 上不变爻 */}
                      <div style={{ padding: 8, backgroundColor: '#fff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          <strong>上不变爻</strong> <Text type="secondary">(稳定高层因素)</Text>
                        </div>
                        <div style={{ fontSize: 14, color: positionTitles.upper_unchanging_yao ? '#333' : '#999' }}>
                          {positionTitles.upper_unchanging_yao || '等待AI生成...'}
                        </div>
                      </div>

                      {/* 下不变爻 */}
                      <div style={{ padding: 8, backgroundColor: '#fff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          <strong>下不变爻</strong> <Text type="secondary">(稳定基础因素)</Text>
                        </div>
                        <div style={{ fontSize: 14, color: positionTitles.lower_unchanging_yao ? '#333' : '#999' }}>
                          {positionTitles.lower_unchanging_yao || '等待AI生成...'}
                        </div>
                      </div>

                    </Space>
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

export default DivinationSetup; 