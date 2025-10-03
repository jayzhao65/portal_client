// src/pages/DivinationCalculator.tsx
// 梅花易数计算页面 - 通过三个数字计算本卦、之卦和变爻

import { useState, useEffect } from 'react';
import { createApiUrl, API_ENDPOINTS } from '../config/api';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button,
  Input,
  InputNumber,
  Space,
  Divider,
  Alert,
  Spin,
  message
} from 'antd';
import { CalculatorOutlined, CopyOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// 定义数据类型
interface Gua {
  id: string;
  gua_name: string;
  gua_prompt: string;
  position: number;
  binary_code: string;
  gua_ci?: string;
}

interface Yao {
  id: string;
  gua_position: number;
  position: number;
  yao_name: string;
  yao_prompt: string;
}

// 八卦对应关系
const GUAS_MAPPING: { [key: number]: string } = {
  1: '111', // 乾
  2: '011', // 兑
  3: '101', // 离
  4: '001', // 震
  5: '110', // 巽
  6: '010', // 坎
  7: '100', // 艮
  8: '000'  // 坤
};

// 八卦名称映射
const GUAS_NAMES: { [key: string]: string } = {
  '111': '乾',
  '011': '兑',
  '101': '离',
  '001': '震',
  '110': '巽',
  '010': '坎',
  '100': '艮',
  '000': '坤'
};

function DivinationCalculator() {
  // ========== 状态管理 ==========
  const [inputNumbers, setInputNumbers] = useState<[number | null, number | null, number | null]>([null, null, null]);
  const [guas, setGuas] = useState<Gua[]>([]);
  const [yaos, setYaos] = useState<Yao[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // ========== 数据获取 ==========
  // 获取所有卦信息
  const fetchGuas = async () => {
    try {
      const response = await fetch(createApiUrl(API_ENDPOINTS.GUA_LIST));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setGuas(data);
      console.log('✅ 获取卦信息成功:', data.length, '个卦');
    } catch (error) {
      console.error('❌ 获取卦信息失败:', error);
      setError('获取卦信息失败');
    }
  };

  // 获取所有爻信息
  const fetchYaos = async () => {
    try {
      const response = await fetch(createApiUrl(API_ENDPOINTS.YAO_LIST));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setYaos(data);
      console.log('✅ 获取爻信息成功:', data.length, '个爻');
    } catch (error) {
      console.error('❌ 获取爻信息失败:', error);
      setError('获取爻信息失败');
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchGuas(), fetchYaos()])
      .finally(() => setLoading(false));
  }, []);

  // ========== 计算逻辑 ==========
  // 计算余数（余数为0则视为最大值）
  const calculateRemainder = (number: number, divisor: number): number => {
    const remainder = number % divisor;
    return remainder === 0 ? divisor : remainder;
  };

  // 根据二进制码查找卦信息
  const findGuaByBinary = (binaryCode: string): Gua | null => {
    return guas.find(gua => gua.binary_code === binaryCode) || null;
  };

  // 根据卦位置和爻位置查找爻信息
  const findYaoByPosition = (guaPosition: number, yaoPosition: number): Yao | null => {
    return yaos.find(yao => yao.gua_position === guaPosition && yao.position === yaoPosition) || null;
  };

  // 将二进制码的某一位取反
  const flipBinaryBit = (binaryCode: string, position: number): string => {
    const chars = binaryCode.split('');
    const index = position - 1; // 转换为0基索引
    if (index >= 0 && index < chars.length) {
      chars[index] = chars[index] === '1' ? '0' : '1';
    }
    return chars.join('');
  };

  // 复制结果到剪贴板
  const copyResult = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('结果已复制到剪贴板！');
    } catch (error) {
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success('结果已复制到剪贴板！');
    }
  };

  // 执行梅花易数计算
  const calculateDivination = async () => {
    const [num1, num2, num3] = inputNumbers;
    
    // 验证输入
    if (num1 === null || num2 === null || num3 === null) {
      setError('请完整输入三个数字');
      return;
    }

    if (num1 <= 0 || num2 <= 0 || num3 <= 0) {
      setError('请输入大于0的正整数');
      return;
    }

    setCalculating(true);
    setError('');
    setResult(null);

    try {
      console.log('\n=== 开始梅花易数计算 ===');
      console.log('输入数字:', inputNumbers);

      // 第一步：计算余数
      const xiaGuaRemainder = calculateRemainder(num1, 8); // 下卦余数
      const shangGuaRemainder = calculateRemainder(num2, 8); // 上卦余数
      const yaoRemainder = calculateRemainder(num3, 6); // 动爻余数

      console.log('下卦余数:', xiaGuaRemainder);
      console.log('上卦余数:', shangGuaRemainder);
      console.log('动爻余数:', yaoRemainder);

      // 第二步：获取对应的二进制码
      const xiaGuaBinary = GUAS_MAPPING[xiaGuaRemainder];
      const shangGuaBinary = GUAS_MAPPING[shangGuaRemainder];

      console.log('下卦二进制:', xiaGuaBinary);
      console.log('上卦二进制:', shangGuaBinary);

      // 第三步：生成本卦（下卦在前，上卦在后）
      const benGuaBinary = xiaGuaBinary + shangGuaBinary;
      console.log('本卦二进制:', benGuaBinary);

      // 第四步：生成之卦（将动爻位置取反）
      const zhiGuaBinary = flipBinaryBit(benGuaBinary, yaoRemainder);
      console.log('之卦二进制:', zhiGuaBinary);

      // 第五步：查询本卦信息
      const benGuaInfo = findGuaByBinary(benGuaBinary);
      if (!benGuaInfo) {
        setError(`未找到本卦信息（二进制码：${benGuaBinary}）`);
        return;
      }
      console.log('本卦信息:', benGuaInfo);

      // 第六步：查询之卦信息
      const zhiGuaInfo = findGuaByBinary(zhiGuaBinary);
      if (!zhiGuaInfo) {
        setError(`未找到之卦信息（二进制码：${zhiGuaBinary}）`);
        return;
      }
      console.log('之卦信息:', zhiGuaInfo);

      // 第七步：查询变爻信息
      const yaoInfo = findYaoByPosition(benGuaInfo.position, yaoRemainder);
      if (!yaoInfo) {
        setError(`未找到变爻信息（卦位置：${benGuaInfo.position}，爻位置：${yaoRemainder}）`);
        return;
      }
      console.log('变爻信息:', yaoInfo);

      // 第八步：生成结果
      const calculationResult = {
        inputNumbers: inputNumbers,
        remainders: {
          xiaGua: xiaGuaRemainder,
          shangGua: shangGuaRemainder,
          yao: yaoRemainder
        },
        binaries: {
          xiaGua: xiaGuaBinary,
          shangGua: shangGuaBinary,
          benGua: benGuaBinary,
          zhiGua: zhiGuaBinary
        },
        benGua: benGuaInfo,
        zhiGua: zhiGuaInfo,
        yao: yaoInfo,
        outputText: `占卜结果：本卦为"${benGuaInfo.gua_name}"，之卦为"${zhiGuaInfo.gua_name}"，变爻为 本卦（"${benGuaInfo.gua_name}"）的 "${yaoInfo.yao_name}"`
      };

      setResult(calculationResult);
      console.log('✅ 计算完成:', calculationResult);

    } catch (error) {
      console.error('❌ 计算失败:', error);
      setError('计算过程中发生错误');
    } finally {
      setCalculating(false);
    }
  };

  // ========== 渲染组件 ==========
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>正在加载卦爻数据...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '16px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '16px' }}>
        <CalculatorOutlined /> 梅花易数计算器
      </Title>
      
      <Paragraph style={{ textAlign: 'center', marginBottom: '24px' }}>
        根据梅花易数原理，输入三个数字来计算本卦、之卦和变爻
      </Paragraph>

      <Card title="输入数字" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>第一个数字（下卦）</Text>
            </div>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="输入数字"
              value={inputNumbers[0]}
              onChange={(value: number | null) => setInputNumbers([value, inputNumbers[1], inputNumbers[2]])}
              min={1}
              size="large"
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              除以8取余数，对应下卦
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>第二个数字（上卦）</Text>
            </div>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="输入数字"
              value={inputNumbers[1]}
              onChange={(value: number | null) => setInputNumbers([inputNumbers[0], value, inputNumbers[2]])}
              min={1}
              size="large"
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              除以8取余数，对应上卦
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>第三个数字（动爻）</Text>
            </div>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="输入数字"
              value={inputNumbers[2]}
              onChange={(value: number | null) => setInputNumbers([inputNumbers[0], inputNumbers[1], value])}
              min={1}
              size="large"
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              除以6取余数，对应动爻位置
            </div>
          </Col>
        </Row>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Space size="large">
            <Button 
              type="primary" 
              onClick={calculateDivination}
              loading={calculating}
              icon={<CalculatorOutlined />}
              size="large"
              style={{ minWidth: '120px' }}
            >
              开始计算
            </Button>
            <Button 
              onClick={() => {
                setInputNumbers([null, null, null]);
                setResult(null);
                setError('');
              }}
              size="large"
              style={{ minWidth: '80px' }}
            >
              重置
            </Button>
          </Space>
        </div>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          style={{ marginBottom: '16px' }}
          showIcon
        />
      )}

      {/* 计算结果 */}
      {result && (
        <Card title="计算结果" style={{ marginBottom: '16px' }}>
          <Alert
            message={
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ 
                  fontSize: '16px', 
                  lineHeight: '1.5',
                  wordBreak: 'break-word'
                }}>
                  {result.outputText}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    icon={<CopyOutlined />} 
                    onClick={() => copyResult(result.outputText)}
                    size="large"
                    style={{ minWidth: '120px' }}
                  >
                    复制结果
                  </Button>
                </div>
              </div>
            }
            type="success"
            style={{ marginBottom: '16px' }}
            showIcon
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card size="small" title="本卦信息">
                <p><Text strong>卦名：</Text>{result.benGua.gua_name}</p>
                <p><Text strong>二进制码：</Text><Text code>{result.binaries.benGua}</Text></p>
                <p><Text strong>位置：</Text>{result.benGua.position}</p>
                {result.benGua.gua_ci && (
                  <p><Text strong>卦辞：</Text>{result.benGua.gua_ci}</p>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card size="small" title="之卦信息">
                <p><Text strong>卦名：</Text>{result.zhiGua.gua_name}</p>
                <p><Text strong>二进制码：</Text><Text code>{result.binaries.zhiGua}</Text></p>
                <p><Text strong>位置：</Text>{result.zhiGua.position}</p>
                {result.zhiGua.gua_ci && (
                  <p><Text strong>卦辞：</Text>{result.zhiGua.gua_ci}</p>
                )}
              </Card>
            </Col>
          </Row>

          <Divider />

          <Card size="small" title="变爻信息" style={{ marginBottom: '16px' }}>
            <p><Text strong>爻名：</Text>{result.yao.yao_name}</p>
            <p><Text strong>位置：</Text>第{result.yao.position}爻</p>
            <p><Text strong>所属卦位置：</Text>第{result.yao.gua_position}卦</p>
            {result.yao.yao_prompt && (
              <p><Text strong>爻辞：</Text>{result.yao.yao_prompt}</p>
            )}
          </Card>

          <Card size="small" title="计算详情">
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12} lg={8}>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>输入数字：</Text>{result.inputNumbers.join(', ')}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>下卦余数：</Text>{result.remainders.xiaGua}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>上卦余数：</Text>{result.remainders.shangGua}
                </div>
                <div>
                  <Text strong>动爻余数：</Text>{result.remainders.yao}
                </div>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>下卦二进制：</Text><Text code>{result.binaries.xiaGua}</Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>上卦二进制：</Text><Text code>{result.binaries.shangGua}</Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>本卦二进制：</Text><Text code>{result.binaries.benGua}</Text>
                </div>
                <div>
                  <Text strong>之卦二进制：</Text><Text code>{result.binaries.zhiGua}</Text>
                </div>
              </Col>
              <Col xs={24} lg={8}>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>八卦对应：</Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  {result.remainders.xiaGua} - {GUAS_NAMES[result.binaries.xiaGua]}
                </div>
                <div>
                  {result.remainders.shangGua} - {GUAS_NAMES[result.binaries.shangGua]}
                </div>
              </Col>
            </Row>
          </Card>
        </Card>
      )}

    </div>
  );
}

export default DivinationCalculator;
