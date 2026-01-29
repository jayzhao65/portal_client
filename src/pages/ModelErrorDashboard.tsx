// src/pages/ModelErrorDashboard.tsx
// AI模型调用错误看板页面 - 展示AI模型调用错误和JSON解析错误

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  message,
  Space,
  Tag,
  Card,
  Typography,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Spin,
  Descriptions,
  Tooltip
} from 'antd';
import {
  ReloadOutlined,
  CheckOutlined,
  EyeOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { createApiUrl } from '../config/api';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 错误数据类型
interface ModelError {
  id: string;
  error_type: 'ai_model_call' | 'json_parse';
  service_name: string;
  model_name: string | null;
  error_message: string;
  error_details: any;
  request_context: any;
  is_retry_error: boolean;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

// 统计数据类型
interface ErrorStats {
  total_errors: number;
  unresolved_count: number;
  by_service: Record<string, number>;
  by_type: Record<string, number>;
  by_hour: Record<string, number>;
  time_range: {
    start: string;
    end: string;
  };
}

// 组件
const ModelErrorDashboard = () => {
  // 状态
  const [errors, setErrors] = useState<ModelError[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedError, setSelectedError] = useState<ModelError | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);

  // 筛选条件
  const [errorTypeFilter, setErrorTypeFilter] = useState<string | undefined>(undefined);
  const [serviceFilter, setServiceFilter] = useState<string | undefined>(undefined);
  const [resolvedFilter, setResolvedFilter] = useState<boolean | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  
  // 分页
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // 加载服务名称列表
  const loadServices = async () => {
    try {
      const response = await fetch(
        createApiUrl('/api/v1/admin/model-errors/services'),
        {
          headers: {
            'X-Dev-Mode': 'true',
            'X-Dev-Token': 'dev-secret-2024'
          }
        }
      );
      const result = await response.json();
      if (result.success) {
        setServices(result.services);
      }
    } catch (error) {
      console.error('加载服务名称列表失败:', error);
    }
  };

  // 加载错误列表
  const loadErrors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
      params.append('exclude_retry', 'true');
      
      if (errorTypeFilter) {
        params.append('error_type', errorTypeFilter);
      }
      if (serviceFilter) {
        params.append('service_name', serviceFilter);
      }
      if (resolvedFilter !== undefined) {
        params.append('resolved', resolvedFilter.toString());
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('start_date', dateRange[0].toISOString());
        params.append('end_date', dateRange[1].toISOString());
      }

      const response = await fetch(
        createApiUrl(`/api/v1/admin/model-errors?${params.toString()}`),
        {
          headers: {
            'X-Dev-Mode': 'true',
            'X-Dev-Token': 'dev-secret-2024'
          }
        }
      );
      const result = await response.json();

      if (result.success) {
        setErrors(result.data);
        setTotal(result.total);
      } else {
        message.error(result.error || '获取错误列表失败');
      }
    } catch (error) {
      message.error('获取错误列表失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('exclude_retry', 'true');
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('start_date', dateRange[0].toISOString());
        params.append('end_date', dateRange[1].toISOString());
      }

      const response = await fetch(
        createApiUrl(`/api/v1/admin/model-errors/stats?${params.toString()}`),
        {
          headers: {
            'X-Dev-Mode': 'true',
            'X-Dev-Token': 'dev-secret-2024'
          }
        }
      );
      const result = await response.json();

      if (result.success) {
        setStats(result);
      } else {
        message.error(result.error || '获取统计信息失败');
      }
    } catch (error) {
      message.error('获取统计信息失败: ' + (error as Error).message);
    } finally {
      setStatsLoading(false);
    }
  };

  // 标记为已解决
  const handleResolve = async (errorId: string) => {
    setResolveLoading(true);
    try {
      const response = await fetch(
        createApiUrl(`/api/v1/admin/model-errors/${errorId}/resolve`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Dev-Mode': 'true',
            'X-Dev-Token': 'dev-secret-2024'
          },
          body: JSON.stringify({ resolved_by: 'admin' })
        }
      );
      const result = await response.json();

      if (result.success) {
        message.success('已标记为已解决');
        loadErrors();
        loadStats();
        setDetailModalVisible(false);
      } else {
        message.error(result.error || '操作失败');
      }
    } catch (error) {
      message.error('操作失败: ' + (error as Error).message);
    } finally {
      setResolveLoading(false);
    }
  };

  // 查看详情
  const showDetailModal = (record: ModelError) => {
    setSelectedError(record);
    setDetailModalVisible(true);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 获取错误类型标签
  const getErrorTypeTag = (errorType: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      ai_model_call: { color: 'red', icon: <ApiOutlined />, text: 'AI调用错误' },
      json_parse: { color: 'orange', icon: <WarningOutlined />, text: 'JSON解析错误' }
    };
    const item = config[errorType] || { color: 'default', icon: null, text: errorType };
    return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>;
  };

  // 获取解决状态标签
  const getResolvedTag = (resolved_at: string | null) => {
    if (resolved_at) {
      return <Tag color="green" icon={<CheckOutlined />}>已解决</Tag>;
    }
    return <Tag color="red" icon={<CloseCircleOutlined />}>未解决</Tag>;
  };

  // 初始化加载
  useEffect(() => {
    loadServices();
    loadErrors();
    loadStats();
  }, []);

  // 筛选条件变化时重新加载
  useEffect(() => {
    loadErrors();
  }, [page, pageSize, errorTypeFilter, serviceFilter, resolvedFilter, dateRange]);

  // 时间范围变化时更新统计
  useEffect(() => {
    loadStats();
  }, [dateRange]);

  // 表格列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => formatDate(text)
    },
    {
      title: '错误类型',
      dataIndex: 'error_type',
      key: 'error_type',
      width: 130,
      render: (text: string) => getErrorTypeTag(text)
    },
    {
      title: '服务名称',
      dataIndex: 'service_name',
      key: 'service_name',
      width: 150,
      render: (text: string) => <Tag>{text}</Tag>
    },
    {
      title: '模型名称',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 180,
      render: (text: string | null) => text ? <Text code>{text}</Text> : <Text type="secondary">-</Text>
    },
    {
      title: '错误消息',
      dataIndex: 'error_message',
      key: 'error_message',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text style={{ maxWidth: 300 }} ellipsis>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'resolved_at',
      key: 'resolved_at',
      width: 100,
      render: (text: string | null) => getResolvedTag(text)
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ModelError) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetailModal(record)}
          >
            详情
          </Button>
          {!record.resolved_at && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleResolve(record.id)}
            >
              解决
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>AI模型错误看板</Title>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="错误总数"
              value={stats?.total_errors || 0}
              loading={statsLoading}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未解决"
              value={stats?.unresolved_count || 0}
              loading={statsLoading}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="AI调用错误"
              value={stats?.by_type?.ai_model_call || 0}
              loading={statsLoading}
              valueStyle={{ color: '#ff7a45' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="JSON解析错误"
              value={stats?.by_type?.json_parse || 0}
              loading={statsLoading}
              valueStyle={{ color: '#ffa940' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 按服务统计 */}
      {stats && Object.keys(stats.by_service).length > 0 && (
        <Card title="按服务统计" size="small" style={{ marginBottom: 24 }}>
          <Space wrap>
            {Object.entries(stats.by_service).map(([service, count]) => (
              <Tag key={service} color="blue">
                {service}: {count}
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* 筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select
            placeholder="错误类型"
            allowClear
            style={{ width: 150 }}
            value={errorTypeFilter}
            onChange={setErrorTypeFilter}
          >
            <Option value="ai_model_call">AI调用错误</Option>
            <Option value="json_parse">JSON解析错误</Option>
          </Select>

          <Select
            placeholder="服务名称"
            allowClear
            style={{ width: 180 }}
            value={serviceFilter}
            onChange={setServiceFilter}
          >
            {services.map(service => (
              <Option key={service} value={service}>{service}</Option>
            ))}
          </Select>

          <Select
            placeholder="解决状态"
            allowClear
            style={{ width: 120 }}
            value={resolvedFilter}
            onChange={setResolvedFilter}
          >
            <Option value={false}>未解决</Option>
            <Option value={true}>已解决</Option>
          </Select>

          <RangePicker
            showTime
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadErrors();
              loadStats();
            }}
          >
            刷新
          </Button>
        </Space>
      </Card>

      {/* 错误列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={errors}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps || 20);
            }
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="错误详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          !selectedError?.resolved_at && (
            <Button
              key="resolve"
              type="primary"
              loading={resolveLoading}
              onClick={() => selectedError && handleResolve(selectedError.id)}
            >
              标记为已解决
            </Button>
          )
        ]}
      >
        {selectedError && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="错误ID" span={2}>
              <Text copyable>{selectedError.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="错误类型">
              {getErrorTypeTag(selectedError.error_type)}
            </Descriptions.Item>
            <Descriptions.Item label="服务名称">
              <Tag>{selectedError.service_name}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="模型名称" span={2}>
              {selectedError.model_name ? (
                <Text code>{selectedError.model_name}</Text>
              ) : (
                <Text type="secondary">无</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDate(selectedError.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {getResolvedTag(selectedError.resolved_at)}
            </Descriptions.Item>
            {selectedError.resolved_at && (
              <>
                <Descriptions.Item label="解决时间">
                  {formatDate(selectedError.resolved_at)}
                </Descriptions.Item>
                <Descriptions.Item label="解决人">
                  {selectedError.resolved_by || '-'}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="错误消息" span={2}>
              <Paragraph
                style={{ maxHeight: 100, overflow: 'auto', marginBottom: 0 }}
              >
                {selectedError.error_message}
              </Paragraph>
            </Descriptions.Item>
            {selectedError.request_context && (
              <Descriptions.Item label="请求上下文" span={2}>
                <pre style={{ 
                  maxHeight: 150, 
                  overflow: 'auto', 
                  backgroundColor: '#f5f5f5',
                  padding: 8,
                  borderRadius: 4,
                  marginBottom: 0,
                  fontSize: 12
                }}>
                  {JSON.stringify(selectedError.request_context, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {selectedError.error_details && (
              <Descriptions.Item label="错误详情" span={2}>
                <pre style={{ 
                  maxHeight: 300, 
                  overflow: 'auto', 
                  backgroundColor: '#f5f5f5',
                  padding: 8,
                  borderRadius: 4,
                  marginBottom: 0,
                  fontSize: 12
                }}>
                  {JSON.stringify(selectedError.error_details, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ModelErrorDashboard;

