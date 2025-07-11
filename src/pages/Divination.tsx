// src/pages/Divination.tsx
// 核心占卜页面 - 主要功能是进行易经占卜

import { useState, useEffect } from 'react';
import { Card, Select, Button, Typography, Row, Col, message, Modal, Input, Form, Space, Tag } from 'antd';
import { EditOutlined, CopyOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 定义用户的数据结构
interface User {
  id: number;
  user_name: string;
  user_tags: string[];
}

// 定义AI模型的数据结构
interface AIModel {
  model_id: string;
  model_name: string;
  provider: string;
  api_endpoint: string;
}

// 定义爻状态选项的类型
interface YaoOption {
  value: string;
  label: string;
  description: string;
}

// 定义占卜结果的数据结构
interface DivinationResult {
  ben_gua_binary: string;       // 本卦二进制
  zhi_gua_binary: string | null; // 之卦二进制
  bian_yao_positions: number[];  // 变爻位置
  bian_yao_count: number;        // 变爻数量
  geju_name: string;             // 格局名称
  geju_prompt: string;           // 格局解读说明
  yao_to_read: Array<{           // 需要解读的爻
    gua_type: string;
    gua_binary: string;
    position: number;
  }>;
  read_ben_gua: boolean;         // 是否解读本卦
  read_zhi_gua: boolean;         // 是否解读之卦
  read_type: string;             // 解读类型
}

// 定义卦的数据结构
interface GuaInfo {
  id: string;
  gua_name: string;
  gua_prompt: string;
  position: number;
  binary_code: string;
}

// 定义爻的数据结构
interface YaoInfo {
  id: string;
  gua_position: number;
  position: number;
  yao_name: string;
  yao_prompt: string;
}

function Divination() {
  // 状态管理
  // 用户相关状态
  const [users, setUsers] = useState<User[]>([]); // 用户列表
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined); // 选择的用户ID
  
  // 占卜相关状态
  const [yaoOptions, setYaoOptions] = useState<YaoOption[]>([]); // 爻状态选项
  const [selectedYaos, setSelectedYaos] = useState<string[]>(Array(6).fill('')); // 六个爻的选择状态
  const [isCalculating, setIsCalculating] = useState(false); // 是否正在计算
  const [divinationResult, setDivinationResult] = useState<DivinationResult | null>(null); // 占卜结果
  const [benGuaInfo, setBenGuaInfo] = useState<GuaInfo | null>(null); // 本卦信息
  const [zhiGuaInfo, setZhiGuaInfo] = useState<GuaInfo | null>(null); // 之卦信息
  const [yaoInfos, setYaoInfos] = useState<YaoInfo[]>([]); // 需要解读的爻信息
  const [gejuPrompt, setGejuPrompt] = useState<string>(''); // 格局解读说明
  
  // AI解读相关状态
  const [models, setModels] = useState<AIModel[]>([]); // AI模型列表
  const [selectedModelId, setSelectedModelId] = useState<string>(''); // 选择的模型ID
  const [question, setQuestion] = useState<string>(''); // 用户问题
  const [systemPrompt, setSystemPrompt] = useState<string>(''); // 系统提示词
  const [userPrompt, setUserPrompt] = useState<string>(''); // 用户提示词（包含占位符）
  const [aiResponse, setAiResponse] = useState<string>(''); // AI回复
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 是否正在分析
  
  // 编辑弹框相关状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<'gua' | 'yao'>('gua');
  const [editingData, setEditingData] = useState<any>(null);
  const [form] = Form.useForm();

  // 爻位名称（从下到上）
  const yaoPositionNames = ['初', '二', '三', '四', '五', '上'];

  // 组件加载时获取数据
  useEffect(() => {
    fetchUsers(); // 获取用户列表
    fetchYaoOptions(); // 获取爻状态选项
    fetchModels(); // 获取AI模型列表
  }, []);

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        console.log('获取用户列表成功:', data);
      } else {
        console.error('获取用户列表失败:', response.status);
        message.error('获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表出错:', error);
      message.error('获取用户列表失败');
    }
  };

  // 获取爻状态选项
  const fetchYaoOptions = async () => {
    try {
      const response = await fetch('/api/yao-options');
      const data = await response.json();
      
      if (data.success) {
        // 将选项转换为下拉框需要的格式
        const options: YaoOption[] = data.data.options.map((option: string) => ({
          value: option,
          label: option,
          description: data.data.descriptions[option]
        }));
        setYaoOptions(options);
      } else {
        message.error('获取爻状态选项失败');
      }
    } catch (error) {
      console.error('获取爻状态选项出错:', error);
      message.error('获取爻状态选项失败');
    }
  };

  // 获取AI模型列表（参考QuestionClarify.tsx的实现）
  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('获取模型列表失败:', error);
    }
  };

  // 处理爻状态选择变化
  const handleYaoChange = (position: number, value: string) => {
    const newSelectedYaos = [...selectedYaos];
    newSelectedYaos[position] = value;
    setSelectedYaos(newSelectedYaos);
  };

  // 占位符处理功能
  const getAvailablePlaceholders = () => {
    const placeholders = [
      { key: '{user_name}', label: '用户名称', value: users.find(u => u.id === selectedUserId)?.user_name || '' },
      { key: '{user_tags}', label: '用户标签', value: users.find(u => u.id === selectedUserId)?.user_tags.join('、') || '暂无标签' },
      { key: '{final_question}', label: '问题', value: question },
      { key: '{geju}', label: '格局名称', value: divinationResult?.geju_name || '' },
      { key: '{geju_prompt}', label: '格局说明', value: gejuPrompt },
      { key: '{bengua_name}', label: '本卦名称', value: benGuaInfo?.gua_name || '' },
      { key: '{bengua_prompt}', label: '本卦描述', value: benGuaInfo?.gua_prompt || '' },
      { key: '{zhigua_name}', label: '之卦名称', value: zhiGuaInfo?.gua_name || '' },
      { key: '{zhigua_prompt}', label: '之卦描述', value: zhiGuaInfo?.gua_prompt || '' },
    ];

    // 始终显示两个爻的占位符，没有时显示【无】
    const sortedYaos = yaoInfos.length > 0 ? [...yaoInfos].sort((a, b) => a.position - b.position) : [];
    
    // 第一个爻（position最小的）
    placeholders.push(
      { 
        key: '{yao1_name}', 
        label: '第一个爻名称', 
        value: sortedYaos[0] ? sortedYaos[0].yao_name : '【无】' 
      },
      { 
        key: '{yao1_prompt}', 
        label: '第一个爻描述', 
        value: sortedYaos[0] ? sortedYaos[0].yao_prompt : '【无】' 
      }
    );
    
    // 第二个爻
    placeholders.push(
      { 
        key: '{yao2_name}', 
        label: '第二个爻名称', 
        value: sortedYaos[1] ? sortedYaos[1].yao_name : '【无】' 
      },
      { 
        key: '{yao2_prompt}', 
        label: '第二个爻描述', 
        value: sortedYaos[1] ? sortedYaos[1].yao_prompt : '【无】' 
      }
    );

    return placeholders;
  };

  // 插入占位符到prompt中
  const insertPlaceholder = (placeholder: string) => {
    setUserPrompt(prev => prev + placeholder);
  };

  // 处理prompt中的占位符替换
  const processPlaceholders = (prompt: string) => {
    let processedPrompt = prompt;
    const placeholders = getAvailablePlaceholders();
    
    placeholders.forEach(ph => {
      processedPrompt = processedPrompt.replace(new RegExp(ph.key.replace(/[{}]/g, '\\$&'), 'g'), ph.value);
    });
    
    return processedPrompt;
  };

  // 执行占卜计算
  const handleDivination = async () => {
    // 检查是否所有爻都已选择
    if (selectedYaos.some(yao => yao === '')) {
      message.warning('请选择所有六个爻的状态');
      return;
    }

    // 清空上一次的占卜结果
    setDivinationResult(null);
    setBenGuaInfo(null);
    setZhiGuaInfo(null);
    setYaoInfos([]);
    setGejuPrompt(''); // 清空格局说明

    setIsCalculating(true);
    
    try {
      // 调用占卜接口
      const response = await fetch('/api/divine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yao_states: selectedYaos
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setDivinationResult(data.data);
        
        // 设置格局解读说明
        if (data.data.geju_prompt) {
          setGejuPrompt(data.data.geju_prompt);
        }
        
        // 根据结果获取卦和爻的详细信息
        await fetchGuaAndYaoInfo(data.data);
        
        message.success('占卜计算成功');
      } else {
        message.error(data.message || '占卜计算失败');
      }
    } catch (error) {
      console.error('占卜计算出错:', error);
      message.error('占卜计算失败');
    } finally {
      setIsCalculating(false);
    }
  };



  // 根据占卜结果获取卦和爻的详细信息 - 完全顺序执行，避免并发问题
  const fetchGuaAndYaoInfo = async (result: DivinationResult) => {
    try {
      console.log('=== 开始严格顺序获取卦和爻信息（无并发） ===');
      console.log('完整结果:', JSON.stringify(result, null, 2));
      console.log('本卦二进制:', result.ben_gua_binary);
      console.log('之卦二进制:', result.zhi_gua_binary);
      console.log('需要解读的爻:', result.yao_to_read);
      console.log('=========================================');

      let benGuaData: GuaInfo | null = null;
      let zhiGuaData: GuaInfo | null = null;

      // 第一步：获取本卦信息
      if (result.ben_gua_binary) {
        console.log(`\n--- 第1步：查询本卦信息 ---`);
        console.log(`本卦二进制码: ${result.ben_gua_binary}`);
        console.log(`请求URL: /api/guas/search/${result.ben_gua_binary}`);
        
        try {
          const response = await fetch(`/api/guas/search/${result.ben_gua_binary}`);
          if (response.ok) {
            benGuaData = await response.json();
            console.log('✅ 本卦信息获取成功:', benGuaData);
            setBenGuaInfo(benGuaData);
          } else {
            const errorText = await response.text();
            console.error(`❌ 本卦查询失败: ${response.status}`);
            console.error(`错误详情: ${errorText}`);
            message.error(`本卦查询失败（编码：${result.ben_gua_binary}，状态：${response.status}）`);
            return; // 本卦失败就直接返回，不继续后续查询
          }
        } catch (error) {
          console.error('❌ 本卦查询网络错误:', error);
          message.error('本卦查询网络失败');
          return;
        }
        
        // 本卦查询完成后等待，避免并发
        console.log('本卦查询完成，等待300ms避免并发...');
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 第二步：获取之卦信息（如果有）
      if (result.zhi_gua_binary) {
        console.log(`\n--- 第2步：查询之卦信息 ---`);
        console.log(`之卦二进制码: ${result.zhi_gua_binary}`);
        console.log(`请求URL: /api/guas/search/${result.zhi_gua_binary}`);
        
        try {
          const response = await fetch(`/api/guas/search/${result.zhi_gua_binary}`);
          if (response.ok) {
            zhiGuaData = await response.json();
            console.log('✅ 之卦信息获取成功:', zhiGuaData);
            setZhiGuaInfo(zhiGuaData);
          } else {
            const errorText = await response.text();
            console.error(`❌ 之卦查询失败: ${response.status}`);
            console.error(`错误详情: ${errorText}`);
            message.error(`之卦查询失败（编码：${result.zhi_gua_binary}）`);
          }
        } catch (error) {
          console.error('❌ 之卦查询网络错误:', error);
          message.error('之卦查询网络失败');
        }
        
        // 之卦查询完成后等待，避免并发
        console.log('之卦查询完成，等待300ms避免并发...');
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 第三步：严格顺序查询爻信息（绝对不并发）
      if (result.yao_to_read && result.yao_to_read.length > 0) {
        console.log(`\n--- 第3步：严格顺序查询${result.yao_to_read.length}个爻信息 ---`);
        
        const yaoResults: any[] = [];

        // 逐个处理每个爻，确保完全顺序执行
        for (let i = 0; i < result.yao_to_read.length; i++) {
          const yaoToRead = result.yao_to_read[i];
          console.log(`\n>>> 处理第${i + 1}个爻 (共${result.yao_to_read.length}个)`);
          console.log(`爻信息: gua_type=${yaoToRead.gua_type}, position=${yaoToRead.position}`);
          
          try {
            // 根据 gua_type 决定使用哪个卦的position
            let guaPosition: number;
            if (yaoToRead.gua_type === "本卦") {
              if (!benGuaData) {
                console.error(`❌ 本卦数据不可用，跳过第${i + 1}个爻`);
                continue;
              }
              guaPosition = benGuaData.position;
              console.log(`使用本卦位置: ${guaPosition}`);
            } else if (yaoToRead.gua_type === "之卦") {
              if (!zhiGuaData) {
                console.error(`❌ 之卦数据不可用，跳过第${i + 1}个爻`);
                continue;
              }
              guaPosition = zhiGuaData.position;
              console.log(`使用之卦位置: ${guaPosition}`);
            } else {
              console.error(`❌ 未知的卦类型: ${yaoToRead.gua_type}，跳过第${i + 1}个爻`);
              continue;
            }
            
            const requestUrl = `/api/yaos/search/${guaPosition}/${yaoToRead.position}`;
            console.log(`请求URL: ${requestUrl}`);
            
            // 查询单个爻信息
            const yaoResponse = await fetch(requestUrl);
            
            if (yaoResponse.ok) {
              const yaoData = await yaoResponse.json();
              console.log(`✅ 第${i + 1}个爻查询成功:`, yaoData);
              yaoResults.push(yaoData);
            } else {
              const errorText = await yaoResponse.text();
              console.error(`❌ 第${i + 1}个爻查询失败: ${yaoResponse.status} - ${errorText}`);
              console.error(`失败参数: gua_position=${guaPosition}, yao_position=${yaoToRead.position}`);
              
              // 记录失败信息但继续查询下一个
              yaoResults.push({
                error: `查询失败: ${yaoResponse.status}`,
                gua_position: guaPosition,
                position: yaoToRead.position,
                yao_name: '查询失败',
                yao_prompt: '无法获取爻信息'
              });
            }
            
          } catch (error) {
            console.error(`❌ 第${i + 1}个爻查询网络错误:`, error);
            
            // 记录网络错误但继续查询下一个
            yaoResults.push({
              error: `网络错误: ${error}`,
              position: yaoToRead.position,
              yao_name: '网络错误',
              yao_prompt: '查询过程中发生网络错误'
            });
          }
          
          // 每个爻查询完成后强制等待，确保完全避免并发请求
          if (i < result.yao_to_read.length - 1) {
            console.log(`第${i + 1}个爻处理完成，强制等待400ms避免并发...`);
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        }

        console.log('\n=== 所有爻信息严格顺序查询完成 ===');
        console.log('最终获取到的爻信息:', yaoResults);
        setYaoInfos(yaoResults);
      }
      
      console.log('🎉 全部信息获取完成（严格顺序执行）');
      
    } catch (error) {
      console.error('❌ 获取卦和爻信息出错:', error);
      message.error('获取详细信息失败');
    }
  };

  // 打开编辑弹框
  const openEditModal = (type: 'gua' | 'yao', data: any) => {
    setEditingType(type);
    setEditingData(data);
    setEditModalVisible(true);
    
    // 填充表单数据
    if (type === 'gua') {
      form.setFieldsValue({
        gua_name: data.gua_name,
        gua_prompt: data.gua_prompt,
        position: data.position,
        binary_code: data.binary_code
      });
    } else {
      form.setFieldsValue({
        gua_position: data.gua_position,
        position: data.position,
        yao_name: data.yao_name,
        yao_prompt: data.yao_prompt
      });
    }
  };

  // 保存编辑
  const handleEditSave = async (values: any) => {
    try {
      const url = editingType === 'gua' 
        ? `/api/guas/${editingData.id}`
        : `/api/yaos/${editingData.id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(`${editingType === 'gua' ? '卦' : '爻'}信息更新成功`);
        setEditModalVisible(false);
        
        // 重新获取数据
        if (divinationResult) {
          await fetchGuaAndYaoInfo(divinationResult);
        }
      } else {
        message.error('更新失败');
      }
    } catch (error) {
      console.error('更新出错:', error);
      message.error('更新失败');
    }
  };

  // AI解读功能
  const handleAIAnalysis = async () => {
    if (!selectedUserId) {
      message.warning('请先选择用户');
      return;
    }
    if (!selectedModelId) {
      message.warning('请选择AI模型');
      return;
    }
    if (!question.trim()) {
      message.warning('请输入问题');
      return;
    }
    if (!userPrompt.trim()) {
      message.warning('请输入用户提示词');
      return;
    }

    setIsAnalyzing(true);
    setAiResponse(''); // 清空之前的回复
    
    try {
      // 处理占位符
      const processedUserPrompt = processPlaceholders(userPrompt);
      
      console.log('AI解读请求参数:', {
        user_id: selectedUserId.toString(),
        model_id: selectedModelId,
        system_prompt: systemPrompt,
        user_prompt: processedUserPrompt,
        question: question
      });

      const response = await fetch('/api/ai-interpretation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUserId.toString(),
          model_id: selectedModelId,
          system_prompt: systemPrompt,
          user_prompt: processedUserPrompt
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setAiResponse(data.ai_response || '');
        message.success('AI解读完成');
      } else {
        console.error('AI解读失败:', data);
        message.error('AI解读失败: ' + (data.detail || '未知错误'));
      }
    } catch (error) {
      console.error('AI解读出错:', error);
      message.error('AI解读失败: ' + error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card title="核心占卜" style={{ margin: 0 }}>
      {/* 第一部分：用户选择标签（左上） */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <Title level={5}>用户选择</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* 用户选择下拉框 */}
              <Select
                style={{ width: '100%' }}
                placeholder="请选择当前占卜用户"
                value={selectedUserId}
                onChange={setSelectedUserId}
                showSearch
                optionFilterProp="children"
              >
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.user_name}
                  </Option>
                ))}
              </Select>
              
              {/* 显示选中用户的标签 */}
              {selectedUserId && (() => {
                const selectedUser = users.find(u => u.id === selectedUserId);
                return selectedUser ? (
                  <div>
                    <Text strong style={{ fontSize: 12, color: '#666' }}>
                      用户标签：
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      {selectedUser.user_tags.length > 0 ? (
                        selectedUser.user_tags.map((tag, index) => (
                          <Tag 
                            key={index} 
                            color="blue" 
                            style={{ marginBottom: 4, marginRight: 4 }}
                          >
                            {tag}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          该用户暂无标签
                        </Text>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}
            </Space>
          </div>
        </Col>
        
        {/* 第二部分：爻的选择（右上） */}
        <Col span={12}>
          <div style={{ padding: 16, background: '#f0f7ff', borderRadius: 8 }}>
            <Title level={5}>六爻选择（上爻在上，初爻在下）</Title>
            {/* 反转显示顺序，让初爻在最下面 */}
            {[...yaoPositionNames].reverse().map((name, reverseIndex) => {
              const index = yaoPositionNames.length - 1 - reverseIndex; // 计算真实索引
              return (
                <div key={index} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                  <Text style={{ width: 40, textAlign: 'right', marginRight: 8 }}>
                    {name}爻:
                  </Text>
                  <Select
                    style={{ width: 200 }}
                    placeholder={`选择${name}爻状态`}
                    value={selectedYaos[index] || undefined}
                    onChange={(value) => handleYaoChange(index, value)}
                  >
                    {yaoOptions.map((option) => (
                      <Option key={option.value} value={option.value} title={option.description}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              );
            })}
            
            <Button 
              type="primary" 
              onClick={handleDivination}
              loading={isCalculating}
              style={{ marginTop: 16, width: '100%' }}
              disabled={selectedYaos.some(yao => yao === '')}
            >
              确认占卜
            </Button>
          </div>
        </Col>
      </Row>

      {/* 第三部分：占卜结果显示 */}
      {divinationResult && (
        <Card title="占卜结果" style={{ marginTop: 16 }}>
          {/* 格局名称和说明 */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Title level={3} style={{ color: '#1890ff' }}>
              {divinationResult.geju_name}
            </Title>
            {gejuPrompt && (
              <div style={{ 
                marginTop: 16, 
                padding: 16, 
                backgroundColor: '#f0f9ff', 
                border: '1px solid #bae6fd', 
                borderRadius: 8,
                textAlign: 'left'
              }}>
                <Title level={5} style={{ color: '#0369a1', marginBottom: 8 }}>
                  📖 格局解读
                </Title>
                <Paragraph style={{ margin: 0, color: '#0f172a', fontSize: 14, lineHeight: 1.6 }}>
                  {gejuPrompt}
                </Paragraph>
              </div>
            )}
          </div>

          {/* 数据完整性提示 */}
          {(!benGuaInfo || !zhiGuaInfo || yaoInfos.length < divinationResult.yao_to_read.length) && (
            <div style={{ 
              background: '#fff7e6', 
              border: '1px solid #ffd591', 
              borderRadius: 6, 
              padding: 12, 
              marginBottom: 16 
            }}>
              <Text type="warning">
                💡 提示：数据库中缺少部分卦或爻的详细信息，但不影响占卜结果的准确性。
                缺少的数据会在控制台中显示具体信息。
              </Text>
            </div>
          )}

          {/* 本卦信息 */}
          {benGuaInfo && (
            <Card 
              size="small" 
              title={
                <span>
                  本卦：{benGuaInfo.gua_name} (第{benGuaInfo.position}卦)
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => openEditModal('gua', benGuaInfo)}
                    style={{ marginLeft: 8 }}
                  />
                </span>
              }
              style={{ marginBottom: 16 }}
            >
              <Paragraph>{benGuaInfo.gua_prompt}</Paragraph>
              <Text type="secondary">位置: 第{benGuaInfo.position}卦 | 二进制编码: {benGuaInfo.binary_code}</Text>
            </Card>
          )}

          {/* 之卦信息（如果有） */}
          {zhiGuaInfo && (
            <Card 
              size="small" 
              title={
                <span>
                  之卦：{zhiGuaInfo.gua_name} (第{zhiGuaInfo.position}卦)
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => openEditModal('gua', zhiGuaInfo)}
                    style={{ marginLeft: 8 }}
                  />
                </span>
              }
              style={{ marginBottom: 16 }}
            >
              <Paragraph>{zhiGuaInfo.gua_prompt}</Paragraph>
              <Text type="secondary">位置: 第{zhiGuaInfo.position}卦 | 二进制编码: {zhiGuaInfo.binary_code}</Text>
            </Card>
          )}

          {/* 需要解读的爻信息 */}
          {yaoInfos.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Title level={4}>需要解读的爻</Title>
              {yaoInfos.map((yaoInfo, index) => (
                <Card 
                  key={index}
                  size="small" 
                  title={
                    <span>
                      {yaoInfo.yao_name}
                      <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => openEditModal('yao', yaoInfo)}
                        style={{ marginLeft: 8 }}
                      />
                    </span>
                  }
                  style={{ marginBottom: 8 }}
                >
                  <Paragraph>{yaoInfo.yao_prompt}</Paragraph>
                  <Text type="secondary">
                    卦位置: {yaoInfo.gua_position}, 爻位置: {yaoInfo.position}
                  </Text>
                </Card>
              ))}
            </div>
          )}

          {/* 变爻总结 */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Title level={4}>
              共有 {divinationResult.bian_yao_count} 个变爻
            </Title>
            {divinationResult.bian_yao_positions.length > 0 && (
              <Text>
                变爻位置：{divinationResult.bian_yao_positions.map(pos => 
                  yaoPositionNames[pos - 1] + '爻'
                ).join('、')}
              </Text>
            )}
          </div>
        </Card>
      )}

      {/* 第四部分：AI解读功能 */}
      {divinationResult && (
        <Card title="AI解读" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            {/* 左侧：配置区 */}
            <Col span={10}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* 问题输入 */}
                <div>
                  <Title level={5}>问题</Title>
                  <Input
                    placeholder="请输入你想咨询的问题"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>

                {/* 模型选择 */}
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

                {/* 系统提示词 */}
                <div>
                  <Title level={5}>系统提示词（可选）</Title>
                  <TextArea
                    rows={4}
                    placeholder="设置AI的角色和行为规则，如：你是一位精通易经的大师..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                  />
                </div>

                {/* 可用占位符显示 */}
                <div>
                  <Title level={5}>可用占位符</Title>
                  <div style={{ 
                    maxHeight: 200, 
                    overflow: 'auto', 
                    border: '1px solid #f0f0f0', 
                    borderRadius: 6, 
                    padding: 8 
                  }}>
                    {getAvailablePlaceholders().map((ph, index) => (
                      <div key={index} style={{ marginBottom: 8 }}>
                        <Button
                          size="small"
                          type="text"
                          icon={<CopyOutlined />}
                          onClick={() => insertPlaceholder(ph.key)}
                          style={{ padding: '4px 8px', height: 'auto' }}
                        >
                          <Text code style={{ fontSize: 11 }}>{ph.key}</Text>
                        </Button>
                        <Text style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>
                          {ph.label}: {ph.value ? ph.value.substring(0, 20) + (ph.value.length > 20 ? '...' : '') : '暂无'}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 开始解读按钮 */}
                <Button 
                  type="primary" 
                  onClick={handleAIAnalysis}
                  loading={isAnalyzing}
                  disabled={!selectedUserId || !selectedModelId || !question.trim() || !userPrompt.trim()}
                  style={{ width: '100%' }}
                >
                  开始AI解读
                </Button>
              </Space>
            </Col>

            {/* 右侧：Prompt编辑区 */}
            <Col span={14}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* 用户提示词 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={5}>用户提示词</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      点击左侧占位符按钮可快速插入
                    </Text>
                  </div>
                  <TextArea
                    rows={12}
                    placeholder="请输入详细的解读提示词，可以包含占位符，如：
根据用户{user_name}的问题{final_question}，
结合其标签{user_tags}，
基于本卦{bengua_name}：{bengua_prompt}
以及需要解读的爻{yao1_name}：{yao1_prompt}
请给出详细的易经解读..."
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                  />
                </div>

                {/* 占位符预览 */}
                {userPrompt && userPrompt.includes('{') && (
                  <div style={{ 
                    padding: 12, 
                    backgroundColor: '#f6ffed', 
                    border: '1px solid #b7eb8f', 
                    borderRadius: 6 
                  }}>
                    <Title level={5} style={{ margin: '0 0 8px 0', color: '#52c41a' }}>
                      🔍 占位符预览（实际发送给AI的内容）
                    </Title>
                    <div style={{ 
                      fontSize: 12, 
                      color: '#666', 
                      whiteSpace: 'pre-wrap', 
                      maxHeight: 150, 
                      overflow: 'auto',
                      background: '#fff',
                      padding: 8,
                      borderRadius: 4,
                      border: '1px solid #d9f7be'
                    }}>
                      {processPlaceholders(userPrompt)}
                    </div>
                  </div>
                )}

                {/* AI回复显示 */}
                {(aiResponse || isAnalyzing) && (
                  <div>
                    <Title level={5}>AI解读结果</Title>
                    <div style={{ 
                      minHeight: 200, 
                      padding: 16, 
                      backgroundColor: '#fafafa', 
                      border: '1px solid #f0f0f0', 
                      borderRadius: 6 
                    }}>
                      {isAnalyzing ? (
                        <div style={{ textAlign: 'center', color: '#999' }}>
                          AI正在思考中，请稍候...
                        </div>
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {aiResponse || '暂无回复'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* 编辑弹框 */}
      <Modal
        title={`编辑${editingType === 'gua' ? '卦' : '爻'}信息`}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleEditSave}
          layout="vertical"
        >
          {editingType === 'gua' ? (
            <>
              <Form.Item name="gua_name" label="卦名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="gua_prompt" label="卦的描述" rules={[{ required: true }]}>
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item name="position" label="位置" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
              <Form.Item name="binary_code" label="二进制编码" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="gua_position" label="所属卦位置" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
              <Form.Item name="position" label="爻位置" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
              <Form.Item name="yao_name" label="爻名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="yao_prompt" label="爻的描述" rules={[{ required: true }]}>
                <Input.TextArea rows={4} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Card>
  );
}

export default Divination; 