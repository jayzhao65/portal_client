// src/components/DivinationModule.tsx
// 占卜计算测试模块组件

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  message,
  Row,
  Col,
  Typography,
  Select,
  Tag,
  Divider,
  Alert
} from 'antd';
import { 
  PlayCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';

// 导入API配置
import { createApiUrl } from '../config/api';

const { Title, Text } = Typography;
const { Option } = Select;

// 爻状态选项
const YAO_STATES = [
  { value: "老阳", label: "老阳", color: "red" },
  { value: "老阴", label: "老阴", color: "blue" },
  { value: "少阳", label: "少阳", color: "orange" },
  { value: "少阴", label: "少阴", color: "cyan" }
];

// 占卜模块组件
interface DivinationModuleProps {
  testResults: any;
  setTestResults: (results: any) => void;
  globalReadingId: string; // 添加全局reading_id参数
}

const DivinationModule: React.FC<DivinationModuleProps> = ({
  testResults,
  setTestResults,
  globalReadingId
}) => {
  // 模块内部状态管理
  const [selectedYaos, setSelectedYaos] = useState<string[]>(Array(6).fill(''));
  const [readingId, setReadingId] = useState<string>(globalReadingId);
  const [isCalculating, setIsCalculating] = useState(false);

  // 阶段名称
  const stageName = "占卜计算";

  // 监听globalReadingId的变化
  useEffect(() => {
    setReadingId(globalReadingId);
  }, [globalReadingId]);

  // 处理爻状态选择
  const handleYaoStateChange = (position: number, value: string) => {
    const newYaos = [...selectedYaos];
    newYaos[position] = value;
    setSelectedYaos(newYaos);
  };

  // 处理占卜计算
  const handleDivinationCalculate = async () => {
    if (!readingId.trim()) {
      message.warning('请输入Reading ID');
      return;
    }

    if (selectedYaos.some(yao => !yao)) {
      message.warning('请选择所有六个爻的状态');
      return;
    }

    setIsCalculating(true);
    const startTime = Date.now();
    
    try {
      // 调用生产环境的占卜计算接口
      const response = await fetch(createApiUrl('/api/v1/divination/calculate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'  // 设置语言为中文
        },
        body: JSON.stringify({
          reading_id: readingId.trim(),
          yao_states: selectedYaos
        })
      });

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }

      const result = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const divinationResult = {
        stage: stageName,
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
        apiResponse: result,
        readingId: readingId.trim(),
        yaoStates: selectedYaos
      };
      
      setTestResults((prev: any) => ({
        ...prev,
        [stageName]: divinationResult
      }));
      
      message.success('占卜计算完成');
    } catch (error) {
      message.error(`占卜计算失败: ${error}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // 重置爻状态
  const handleResetYaos = () => {
    setSelectedYaos(Array(6).fill(''));
  };

  // 渲染爻状态选择器
  const renderYaoSelector = () => {
    const yaoNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
    
    return (
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>
          选择六个爻的状态（从下到上）：
        </Text>
        <Row gutter={[16, 16]}>
          {yaoNames.map((name, index) => (
            <Col span={8} key={index}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {name}
                </Text>
                <Select
                  value={selectedYaos[index]}
                  onChange={(value) => handleYaoStateChange(index, value)}
                  placeholder="选择爻状态"
                  style={{ width: '100%' }}
                >
                  {YAO_STATES.map(yao => (
                    <Option key={yao.value} value={yao.value}>
                      <Tag color={yao.color}>{yao.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
          ))}
        </Row>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleResetYaos}
            size="small"
          >
            重置爻状态
          </Button>
        </div>
      </div>
    );
  };

  // 渲染占卜结果
  const renderDivinationResult = () => {
    const result = testResults[stageName];
    if (!result) return null;

    const divinationData = result.apiResponse?.data?.divination_result;
    if (!divinationData) return null;

    return (
      <Card title="占卜结果" size="small" style={{ marginTop: 16 }}>
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

        {/* 核心占卜信息 */}
        <Row gutter={[16, 16]}>
          {/* 左侧：本卦信息 */}
          <Col span={12}>
            <div style={{ padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px', height: '100%' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px', color: '#52c41a' }}>
                🏮 本卦信息
              </Text>
              <div style={{ fontSize: '12px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>卦名: </Text>
                  <Text>{divinationData.ben_gua_name}</Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>标题: </Text>
                  <Text>{divinationData.ben_gua_title}</Text>
                </div>
                <div>
                  <Text strong>二进制: </Text>
                  <Text>{divinationData.ben_gua_binary}</Text>
                </div>
              </div>
            </div>
          </Col>

          {/* 右侧：之卦信息 */}
          <Col span={12}>
            <div style={{ padding: '16px', background: '#f0f8ff', border: '1px solid #91d5ff', borderRadius: '6px', height: '100%' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px', color: '#1890ff' }}>
                🔮 之卦信息
              </Text>
              <div style={{ fontSize: '12px' }}>
                {divinationData.zhi_gua_name ? (
                  <>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong>卦名: </Text>
                      <Text>{divinationData.zhi_gua_name}</Text>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong>标题: </Text>
                      <Text>{divinationData.zhi_gua_title}</Text>
                    </div>
                    <div>
                      <Text strong>二进制: </Text>
                      <Text>{divinationData.zhi_gua_binary}</Text>
                    </div>
                  </>
                ) : (
                  <Text type="secondary">无变爻，无之卦</Text>
                )}
              </div>
            </div>
          </Col>
        </Row>

        {/* 变爻信息 */}
        <div style={{ marginTop: '16px', padding: '16px', background: '#fff2e8', border: '1px solid #ffbb96', borderRadius: '6px' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px', color: '#d46b08' }}>
            ⚡ 变爻信息
          </Text>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div>
                <Text strong>变爻数量: </Text>
                <Text>{divinationData.bian_yao_count}</Text>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text strong>变爻位置: </Text>
                <Text>
                  {divinationData.bian_yao_positions?.length > 0 
                    ? divinationData.bian_yao_positions.map((pos: number) => 
                        ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][pos - 1]
                      ).join('、')
                    : '无'
                  }
                </Text>
              </div>
            </Col>
          </Row>
        </div>

        {/* 格局信息 */}
        <div style={{ marginTop: '16px', padding: '16px', background: '#f9f0ff', border: '1px solid #d3adf7', borderRadius: '6px' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px', color: '#722ed1' }}>
            🎯 格局信息
          </Text>
          <div>
            <Text strong>格局名称: </Text>
            <Text>{divinationData.geju_name}</Text>
          </div>
          {divinationData.geju_user_explanation && (
            <div style={{ marginTop: '8px' }}>
              <Text strong>用户解释: </Text>
              <Text>{divinationData.geju_user_explanation}</Text>
            </div>
          )}
          {divinationData.geju_ai_rule && (
            <div style={{ marginTop: '8px' }}>
              <Text strong>AI解读规则: </Text>
              <Text>{divinationData.geju_ai_rule}</Text>
            </div>
          )}
        </div>

        {/* 需要解读的爻位 */}
        {divinationData.yao_to_read && divinationData.yao_to_read.length > 0 && (
          <div style={{ marginTop: '16px', padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
            <Text strong style={{ display: 'block', marginBottom: '8px', color: '#52c41a' }}>
              📖 需要解读的爻位 ({divinationData.yao_to_read.length}个)
            </Text>
            
            {/* 调试信息 */}
            <div style={{ marginBottom: '12px', padding: '8px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '4px', fontSize: '12px' }}>
              <Text type="secondary">调试信息: </Text>
              <Text>数据长度: {divinationData.yao_to_read.length}, 字段: {Object.keys(divinationData.yao_to_read[0] || {}).join(', ')}</Text>
            </div>
            
            <Row gutter={[16, 16]}>
              {divinationData.yao_to_read.map((yao: any, index: number) => (
                <Col span={8} key={index}>
                  <div style={{ 
                    padding: '12px', 
                    background: '#f5f5f5', 
                    borderRadius: '6px',
                    textAlign: 'center',
                    border: '1px solid #d9d9d9'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong style={{ fontSize: '14px' }}>
                        {yao.yao_title || `第${yao.position}爻`}
                      </Text>
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {yao.yao_name || `位置${yao.position}`}
                      </Text>
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                      <div>本卦: {yao.gua_binary}</div>
                      {yao.yao_prompt && (
                        <div style={{ marginTop: '4px', color: '#1890ff', fontSize: '10px', lineHeight: '1.3' }}>
                          {yao.yao_prompt}
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* 完整API响应 */}
        <div style={{ marginTop: '16px', padding: '16px', background: '#f9f9f9', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            📋 完整API响应
          </Text>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '300px',
            fontSize: '12px',
            margin: 0
          }}>
            {JSON.stringify(result.apiResponse, null, 2)}
          </pre>
        </div>
      </Card>
    );
  };

  return (
    <Card
      title={
        <Space>
          <span>{stageName}测试模块</span>
          <Tag color="blue">生产接口</Tag>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {/* 输入区域和占位符状态 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* 左侧：输入区域 */}
        <Col span={12}>
          <Card size="small" title="输入参数" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <Text strong>Reading ID:</Text>
                <input
                  type="text"
                  value={readingId}
                  onChange={(e) => setReadingId(e.target.value)}
                  placeholder="请输入Reading ID（从问题验证阶段获得）"
                  style={{ 
                    marginTop: 8, 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '6px', 
                    border: '1px solid #d9d9d9' 
                  }}
                />
              </div>
              
              {/* 爻状态选择器 */}
              {renderYaoSelector()}
              
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={handleDivinationCalculate}
                loading={isCalculating}
                disabled={!readingId.trim() || selectedYaos.some(yao => !yao)}
                style={{ width: '100%' }}
              >
                开始计算
              </Button>
              
              <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
                请先输入Reading ID，然后选择六个爻的状态开始占卜计算
              </Text>
            </Space>
          </Card>
        </Col>

        {/* 右侧：占位符状态 */}
        <Col span={12}>
          {/* PlaceholderDisplayModule removed */}
        </Col>
      </Row>

      {/* 占卜结果展示 */}
      {renderDivinationResult()}
    </Card>
  );
};

export default DivinationModule;
