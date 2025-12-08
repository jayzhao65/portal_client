// src/pages/CacheManagement.tsx
// 缓存管理页面 - 查看和清除服务器内存缓存

import { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Statistic, 
  Row, 
  Col, 
  message, 
  Spin,
  Alert,
  Divider,
  Tag,
  Modal,
  Select
} from 'antd';
import { 
  ReloadOutlined, 
  DeleteOutlined, 
  DatabaseOutlined,
  CloudServerOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// API 基础路径
const API_BASE_URL = '';

// 缓存统计数据类型
interface CacheTypeStats {
  count: number;
  hits: number;
  misses: number;
  hit_rate: string;
}

interface CacheStats {
  prompt: CacheTypeStats;
  gua: CacheTypeStats;
  yao: CacheTypeStats;
  last_cleared_at: string | null;
  total_cached_items: number;
}

// 缓存详情类型
interface CacheDetails {
  prompt: {
    keys: string[];
    count: number;
  };
  gua: {
    keys: string[];
    count: number;
  };
  yao: {
    keys: string[];
    count: number;
  };
}

// 清除结果类型
interface ClearResult {
  prompt?: number;
  gua?: number;
  yao?: number;
}

function CacheManagement() {
  // 状态
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [clearing, setClearing] = useState(false);
  const [selectedCacheType, setSelectedCacheType] = useState<string | null>(null);
  const [details, setDetails] = useState<CacheDetails | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 获取缓存统计
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/cache/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev123'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        message.error('获取缓存统计失败');
      }
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      message.error('获取缓存统计失败，请检查服务器连接');
    } finally {
      setLoading(false);
    }
  };

  // 清除缓存
  const clearCache = async (cacheType: string | null, key: string | null = null) => {
    setClearing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev123'
        },
        body: JSON.stringify({
          cache_type: cacheType,
          key: key
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        message.success(data.message);
        // 刷新统计
        fetchStats();
      } else {
        message.error('清除缓存失败');
      }
    } catch (error) {
      console.error('清除缓存失败:', error);
      message.error('清除缓存失败，请检查服务器连接');
    } finally {
      setClearing(false);
    }
  };

  // 确认清除所有缓存
  const confirmClearAll = () => {
    Modal.confirm({
      title: '确认清除所有缓存？',
      icon: <ExclamationCircleOutlined />,
      content: '这将清除所有 Prompt 配置、卦象信息和爻位信息的缓存。下次请求时会重新从数据库加载。',
      okText: '确认清除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => clearCache(null)
    });
  };

  // 获取缓存详情
  const fetchDetails = async () => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/cache/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev123'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setDetails(data.details);
        setDetailsModalVisible(true);
      } else {
        message.error('获取缓存详情失败');
      }
    } catch (error) {
      console.error('获取缓存详情失败:', error);
      message.error('获取缓存详情失败，请检查服务器连接');
    } finally {
      setLoadingDetails(false);
    }
  };

  // 页面加载时获取统计
  useEffect(() => {
    fetchStats();
  }, []);

  // 渲染缓存类型卡片
  const renderCacheCard = (
    title: string, 
    type: string, 
    data: CacheTypeStats | undefined,
    icon: React.ReactNode,
    color: string
  ) => (
    <Card 
      title={
        <Space>
          {icon}
          <span>{title}</span>
        </Space>
      }
      extra={
        <Button 
          size="small" 
          danger 
          icon={<DeleteOutlined />}
          onClick={() => clearCache(type)}
          loading={clearing}
        >
          清除
        </Button>
      }
      style={{ height: '100%' }}
    >
      <Row gutter={16}>
        <Col span={8}>
          <Statistic 
            title="缓存条目" 
            value={data?.count || 0} 
            valueStyle={{ color }}
          />
        </Col>
        <Col span={8}>
          <Statistic 
            title="命中次数" 
            value={data?.hits || 0}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={8}>
          <Statistic 
            title="未命中" 
            value={data?.misses || 0}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
      </Row>
      <Divider style={{ margin: '12px 0' }} />
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary">命中率: </Text>
        <Tag color={data?.hit_rate === 'N/A' ? 'default' : 'green'}>
          {data?.hit_rate || 'N/A'}
        </Tag>
      </div>
    </Card>
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <CloudServerOutlined style={{ marginRight: '12px' }} />
          缓存管理
        </Title>
        <Paragraph type="secondary">
          管理服务器内存缓存，包括 Prompt 配置、卦象信息和爻位信息。
          缓存永不过期，需要手动清除才会重新从数据库加载。
        </Paragraph>
      </div>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space size="large">
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={fetchStats}
            loading={loading}
          >
            刷新统计
          </Button>
          <Button 
            icon={<EyeOutlined />} 
            onClick={fetchDetails}
            loading={loadingDetails}
          >
            查看缓存详情
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={confirmClearAll}
            loading={clearing}
          >
            清除所有缓存
          </Button>
        </Space>
        <div style={{ marginTop: '12px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 提示：每个缓存卡片右上角都有独立的"清除"按钮，可以单独清除该类型的缓存
          </Text>
        </div>

        {stats?.last_cleared_at && (
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">
              上次清除时间: {new Date(stats.last_cleared_at).toLocaleString()}
            </Text>
          </div>
        )}
      </Card>

      {/* 总体统计 */}
      {stats && (
        <Alert
          message={
            <Space>
              <ThunderboltOutlined />
              <span>当前共缓存 <strong>{stats.total_cached_items}</strong> 条数据</span>
            </Space>
          }
          type="info"
          showIcon={false}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 加载中 */}
      {loading && !stats && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">正在加载缓存统计...</Text>
          </div>
        </div>
      )}

      {/* 缓存类型卡片 */}
      {stats && (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            {renderCacheCard(
              'Prompt 配置缓存',
              'prompt',
              stats.prompt,
              <DatabaseOutlined style={{ color: '#1890ff' }} />,
              '#1890ff'
            )}
          </Col>
          <Col xs={24} md={8}>
            {renderCacheCard(
              '卦象信息缓存',
              'gua',
              stats.gua,
              <DatabaseOutlined style={{ color: '#722ed1' }} />,
              '#722ed1'
            )}
          </Col>
          <Col xs={24} md={8}>
            {renderCacheCard(
              '爻位信息缓存',
              'yao',
              stats.yao,
              <DatabaseOutlined style={{ color: '#eb2f96' }} />,
              '#eb2f96'
            )}
          </Col>
        </Row>
      )}

      {/* 使用说明 */}
      <Card title="使用说明" style={{ marginTop: '24px' }}>
        <Paragraph>
          <Text strong>什么时候需要清除缓存？</Text>
        </Paragraph>
        <ul>
          <li>
            <Text strong>Prompt 配置：</Text> 通过工作台修改了 Prompt 配置，或在 Supabase 中直接修改了 <code>prompt_configs</code> 表的数据后
          </li>
          <li>
            <Text strong>卦象信息：</Text> 在 Supabase 中修改了 <code>gua_info</code> 表的数据后
          </li>
          <li>
            <Text strong>爻位信息：</Text> 在 Supabase 中修改了 <code>yao_info</code> 表的数据后
          </li>
        </ul>
        <Alert
          message="注意"
          description="修改配置后，需要手动清除对应的缓存，新配置才会生效。"
          type="info"
          showIcon
          style={{ marginTop: '12px' }}
        />
        
        <Divider />
        
        <Paragraph>
          <Text strong>清除方式：</Text>
        </Paragraph>
        <ul>
          <li>
            <Text strong>单独清除：</Text> 点击每个缓存卡片右上角的"清除"按钮，只清除该类型的缓存
          </li>
          <li>
            <Text strong>全部清除：</Text> 点击顶部的"清除所有缓存"按钮，一次性清除所有类型的缓存
          </li>
        </ul>
      </Card>

      {/* 缓存详情Modal */}
      <Modal
        title="缓存详情"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {details && (
          <div>
            {/* Prompt 配置缓存 */}
            <Card 
              title={
                <Space>
                  <DatabaseOutlined style={{ color: '#1890ff' }} />
                  <span>Prompt 配置缓存 ({details.prompt.count} 条)</span>
                </Space>
              }
              style={{ marginBottom: '16px' }}
              size="small"
            >
              {details.prompt.keys.length > 0 ? (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {details.prompt.keys.map((key, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: '8px' }}>
                      {key}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Text type="secondary">暂无缓存</Text>
              )}
            </Card>

            {/* 卦象信息缓存 */}
            <Card 
              title={
                <Space>
                  <DatabaseOutlined style={{ color: '#722ed1' }} />
                  <span>卦象信息缓存 ({details.gua.count} 条)</span>
                </Space>
              }
              style={{ marginBottom: '16px' }}
              size="small"
            >
              {details.gua.keys.length > 0 ? (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {details.gua.keys.map((key, index) => (
                    <Tag key={index} color="purple" style={{ marginBottom: '8px' }}>
                      {key}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Text type="secondary">暂无缓存</Text>
              )}
            </Card>

            {/* 爻位信息缓存 */}
            <Card 
              title={
                <Space>
                  <DatabaseOutlined style={{ color: '#eb2f96' }} />
                  <span>爻位信息缓存 ({details.yao.count} 条)</span>
                </Space>
              }
              size="small"
            >
              {details.yao.keys.length > 0 ? (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {details.yao.keys.map((key, index) => (
                    <Tag key={index} color="magenta" style={{ marginBottom: '8px' }}>
                      {key}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Text type="secondary">暂无缓存</Text>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CacheManagement;

