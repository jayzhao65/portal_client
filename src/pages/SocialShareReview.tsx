// src/pages/SocialShareReview.tsx
// 社交媒体分享审核页面 - 管理员审核用户上传的社交分享截图

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
  Image,
  Select,
  Descriptions,
  Spin
} from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { createApiUrl } from '../config/api';

const { Title, Text } = Typography;
const { Option } = Select;

// 提交记录数据类型
interface Submission {
  id: string;
  user_id: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reward_granted: boolean;
  reward_amount: number;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

// 预设拒绝原因
const REJECTION_REASONS = [
  "图片不清晰，无法识别",
  "未包含易罗app截图",
  "未包含'易罗app'文字介绍",
  "点赞数不足3个",
  "非社交媒体分享截图",
  "其他原因"
];

// SocialShareReview 组件
const SocialShareReview = () => {
  // 状态管理
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(REJECTION_REASONS[0]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // 加载提交列表
  const loadSubmissions = async () => {
    setLoading(true);
    try {
      // 根据筛选条件选择不同的API
      let apiPath = statusFilter 
        ? `/api/v1/social-share/admin/all?status_filter=${statusFilter}`
        : '/api/v1/social-share/admin/pending';
      
      const response = await fetch(createApiUrl(apiPath), {
        headers: {
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        }
      });
      const result = await response.json();

      if (result.success) {
        setSubmissions(result.data.submissions);
      } else {
        message.error(result.detail || '获取列表失败');
      }
    } catch (error) {
      message.error('获取列表失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadSubmissions();
  }, [statusFilter]);

  // 审核通过
  const handleApprove = async (submission: Submission) => {
    setReviewLoading(true);
    try {
      const response = await fetch(
        createApiUrl(`/api/v1/social-share/admin/${submission.id}/review`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Dev-Mode': 'true',
            'X-Dev-Token': 'dev-secret-2024'
          },
          body: JSON.stringify({
            action: 'approve'
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        if (result.data?.reward_granted) {
          message.success(`审核通过！已为用户发放 ${submission.reward_amount} 积分`);
        } else {
          message.success('审核通过！（用户已获得过奖励，未重复发放）');
        }
        loadSubmissions(); // 重新加载列表
        setViewModalVisible(false);
      } else {
        message.error(result.detail || '审核失败');
      }
    } catch (error) {
      message.error('审核失败: ' + (error as Error).message);
    } finally {
      setReviewLoading(false);
    }
  };

  // 审核拒绝
  const handleReject = async () => {
    if (!selectedSubmission) return;

    setReviewLoading(true);
    try {
      const response = await fetch(
        createApiUrl(`/api/v1/social-share/admin/${selectedSubmission.id}/review`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Dev-Mode': 'true',
            'X-Dev-Token': 'dev-secret-2024'
          },
          body: JSON.stringify({
            action: 'reject',
            reason: selectedReason
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        message.success('已拒绝该提交');
        loadSubmissions(); // 重新加载列表
        setRejectModalVisible(false);
        setViewModalVisible(false);
      } else {
        message.error(result.detail || '操作失败');
      }
    } catch (error) {
      message.error('操作失败: ' + (error as Error).message);
    } finally {
      setReviewLoading(false);
    }
  };

  // 打开查看详情弹窗
  const showViewModal = (record: Submission) => {
    setSelectedSubmission(record);
    setViewModalVisible(true);
  };

  // 打开拒绝原因弹窗
  const showRejectModal = (record: Submission) => {
    setSelectedSubmission(record);
    setSelectedReason(REJECTION_REASONS[0]);
    setRejectModalVisible(true);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      pending: { color: 'gold', text: '待审核' },
      approved: { color: 'success', text: '已通过' },
      rejected: { color: 'error', text: '已拒绝' }
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
      render: (text: string) => (
        <Text copyable={{ text: text }}>
          {text.substring(0, 8)}...
        </Text>
      )
    },
    {
      title: '截图预览',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 120,
      render: (url: string) => (
        <Image
          src={url}
          width={80}
          height={80}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          placeholder={
            <div style={{ 
              width: 80, 
              height: 80, 
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Spin size="small" />
            </div>
          }
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9teleqENBGYAAAAA"
        />
      )
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => formatDate(text)
    },
    {
      title: '审核状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '奖励状态',
      dataIndex: 'reward_granted',
      key: 'reward_granted',
      width: 100,
      render: (granted: boolean, record: Submission) => (
        granted ? (
          <Tag color="green">已发放 {record.reward_amount}</Tag>
        ) : (
          <Tag color="default">未发放</Tag>
        )
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: Submission) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => showViewModal(record)}
          >
            查看
          </Button>
          {record.status === 'pending' && (
            <>
              <Button 
                type="link" 
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleApprove(record)}
                loading={reviewLoading}
              >
                通过
              </Button>
              <Button 
                type="link" 
                danger
                icon={<CloseOutlined />}
                onClick={() => showRejectModal(record)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>社交分享审核</Title>
            <Text type="secondary">审核用户上传的社交媒体分享截图，通过后发放积分奖励</Text>
          </div>
          <Space>
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 120 }}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || null)}
            >
              <Option value="pending">待审核</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadSubmissions}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={submissions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      {/* 查看详情弹窗 */}
      <Modal
        title="提交详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={700}
        footer={
          selectedSubmission?.status === 'pending' ? (
            <Space>
              <Button onClick={() => setViewModalVisible(false)}>
                关闭
              </Button>
              <Button 
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  showRejectModal(selectedSubmission);
                }}
              >
                拒绝
              </Button>
              <Button 
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(selectedSubmission)}
                loading={reviewLoading}
              >
                通过
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setViewModalVisible(false)}>
              关闭
            </Button>
          )
        }
      >
        {selectedSubmission && (
          <div>
            {/* 截图大图 */}
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <Image
                src={selectedSubmission.image_url}
                style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8 }}
              />
            </div>
            
            {/* 详细信息 */}
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="提交ID">
                <Text copyable>{selectedSubmission.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                <Text copyable>{selectedSubmission.user_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="上传时间">
                {formatDate(selectedSubmission.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="审核状态">
                {getStatusTag(selectedSubmission.status)}
              </Descriptions.Item>
              <Descriptions.Item label="奖励金额">
                {selectedSubmission.reward_amount} 积分
              </Descriptions.Item>
              <Descriptions.Item label="奖励状态">
                {selectedSubmission.reward_granted ? (
                  <Tag color="green">已发放</Tag>
                ) : (
                  <Tag color="default">未发放</Tag>
                )}
              </Descriptions.Item>
              {selectedSubmission.status === 'rejected' && selectedSubmission.rejection_reason && (
                <Descriptions.Item label="拒绝原因" span={2}>
                  <Text type="danger">{selectedSubmission.rejection_reason}</Text>
                </Descriptions.Item>
              )}
              {selectedSubmission.reviewed_at && (
                <Descriptions.Item label="审核时间" span={2}>
                  {formatDate(selectedSubmission.reviewed_at)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* 拒绝原因弹窗 */}
      <Modal
        title="选择拒绝原因"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleReject}
        okText="确认拒绝"
        okButtonProps={{ danger: true, loading: reviewLoading }}
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>请选择拒绝原因：</Text>
        </div>
        <Select
          style={{ width: '100%' }}
          value={selectedReason}
          onChange={(value) => setSelectedReason(value)}
        >
          {REJECTION_REASONS.map((reason) => (
            <Option key={reason} value={reason}>
              {reason}
            </Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
};

export default SocialShareReview;

