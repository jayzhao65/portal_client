// src/components/Dashboard/PaymentModule.tsx
// 付费数据模块组件 - 展示付费人次、套餐分布、用户列表、消费行为比例

import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Progress, Tag, Collapse, Typography, Tooltip } from 'antd';
import { DollarOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Text } = Typography;

// 定义付费数据接口类型
interface PaymentStatsData {
  total_purchases: number;
  total_revenue: number;  // 总付费收入（元）
  package_distribution: {
    "600": number;
    "300": number;
    "100": number;
  };
  paid_user_count: number;
  paid_users_list: Array<{
    user_id: string;
    registration_time: string;
    purchase_count: number;
    packages: string[];
    question_count: number;
    report_count: number;
    followup_count: number;
    daily_guidance_count: number;
    image_div_count: number;
    final_questions: string[];
  }>;
  consume_behavior: {
    "-50": number;
    "-20": number;
    "-10": number;
  };
}

// 付费数据模块组件
function PaymentModule({ data }: { data: PaymentStatsData }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 计算套餐分布百分比
  const totalPackages = (data.package_distribution?.["600"] || 0) + 
                        (data.package_distribution?.["300"] || 0) + 
                        (data.package_distribution?.["100"] || 0);
  const package600Percent = totalPackages > 0 
    ? ((data.package_distribution?.["600"] || 0) / totalPackages * 100).toFixed(1)
    : '0';
  const package300Percent = totalPackages > 0
    ? ((data.package_distribution?.["300"] || 0) / totalPackages * 100).toFixed(1)
    : '0';
  const package100Percent = totalPackages > 0
    ? ((data.package_distribution?.["100"] || 0) / totalPackages * 100).toFixed(1)
    : '0';

  // 计算消费行为百分比
  const totalConsumes = (data.consume_behavior?.["-50"] || 0) + 
                        (data.consume_behavior?.["-20"] || 0) + 
                        (data.consume_behavior?.["-10"] || 0);
  const consume50Percent = totalConsumes > 0
    ? ((data.consume_behavior?.["-50"] || 0) / totalConsumes * 100).toFixed(1)
    : '0';
  const consume20Percent = totalConsumes > 0
    ? ((data.consume_behavior?.["-20"] || 0) / totalConsumes * 100).toFixed(1)
    : '0';
  const consume10Percent = totalConsumes > 0
    ? ((data.consume_behavior?.["-10"] || 0) / totalConsumes * 100).toFixed(1)
    : '0';

  // 付费用户列表表格列定义
  const columns = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (text: string) => <Text copyable={{ text }}>{text.substring(0, 8)}...</Text>,
    },
    {
      title: '注册时间',
      dataIndex: 'registration_time',
      key: 'registration_time',
      render: (text: string) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '购买次数',
      dataIndex: 'purchase_count',
      key: 'purchase_count',
      sorter: (a: any, b: any) => a.purchase_count - b.purchase_count,
    },
    {
      title: '套餐',
      dataIndex: 'packages',
      key: 'packages',
      render: (packages: string[]) => (
        <div>
          {packages.map((pkg, index) => (
            <Tag key={index} color={pkg === '600' ? 'gold' : pkg === '300' ? 'blue' : 'green'}>
              {pkg}积分
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '问题数',
      dataIndex: 'question_count',
      key: 'question_count',
      sorter: (a: any, b: any) => a.question_count - b.question_count,
    },
    {
      title: '解读数',
      dataIndex: 'report_count',
      key: 'report_count',
      sorter: (a: any, b: any) => a.report_count - b.report_count,
    },
    {
      title: '追问数',
      dataIndex: 'followup_count',
      key: 'followup_count',
      sorter: (a: any, b: any) => a.followup_count - b.followup_count,
    },
    {
      title: '每日指引',
      dataIndex: 'daily_guidance_count',
      key: 'daily_guidance_count',
      sorter: (a: any, b: any) => a.daily_guidance_count - b.daily_guidance_count,
    },
    {
      title: '观物',
      dataIndex: 'image_div_count',
      key: 'image_div_count',
      sorter: (a: any, b: any) => a.image_div_count - b.image_div_count,
    },
  ];

  // 展开行内容（显示final_questions）
  const expandedRowRender = (record: any) => {
    const finalQuestions = record.final_questions || [];
    return (
      <div style={{ padding: '16px', background: '#fafafa' }}>
        <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Final Questions列表：</div>
        {finalQuestions.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {finalQuestions.map((question: string, index: number) => (
              <li key={index} style={{ marginBottom: 8 }}>
                {question}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#999' }}>暂无final_questions</div>
        )}
      </div>
    );
  };

  return (
    <Card 
      title="付费数据模块" 
      style={{ marginBottom: 16 }}
      extra={<DollarOutlined />}
    >
      <Row gutter={[16, 16]}>
        {/* 基础统计 */}
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title={
                <span>
                  付费总人次
                  <Tooltip title="credit_transactions表中transaction_type='purchase'且status='completed'的记录总数（同一用户多次购买算多次）">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              value={data.total_purchases || 0}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title={
                <span>
                  付费用户数（去重）
                  <Tooltip title="有付费记录的用户总数（去重，一个用户多次购买只算一个人）">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              value={data.paid_user_count || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title={
                <span>
                  总付费收入
                  <Tooltip title="所有付费记录的总收入（600积分=30元，300积分=20元，100积分=10元）">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              value={data.total_revenue || 0}
              suffix="元"
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>

        {/* 付费套餐饼图（用进度条展示） */}
        <Col xs={24}>
          <Card 
            title={
              <span>
                付费套餐分布
                <Tooltip title="根据credit_transactions表中的amount字段统计：600积分=30元，300积分=20元，100积分=10元">
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                </Tooltip>
              </span>
            }
            style={{ marginTop: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="gold" style={{ fontSize: '14px', padding: '4px 8px' }}>
                    600积分套餐（30元）
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {data.package_distribution?.["600"] || 0} ({package600Percent}%)
                  </span>
                </div>
                <Progress 
                  percent={parseFloat(package600Percent)} 
                  strokeColor="#faad14"
                  showInfo={false}
                />
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                    300积分套餐（20元）
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {data.package_distribution?.["300"] || 0} ({package300Percent}%)
                  </span>
                </div>
                <Progress 
                  percent={parseFloat(package300Percent)} 
                  strokeColor="#1890ff"
                  showInfo={false}
                />
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                    100积分套餐（10元）
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {data.package_distribution?.["100"] || 0} ({package100Percent}%)
                  </span>
                </div>
                <Progress 
                  percent={parseFloat(package100Percent)} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 付费后消费行为比例 */}
        <Col xs={24}>
          <Card 
            title={
              <span>
                付费后消费行为比例
                <Tooltip title="统计每笔付费记录紧接着的下一条consume交易，统计amount为-50、-20、-10的比例">
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                </Tooltip>
              </span>
            }
            style={{ marginTop: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="red" style={{ fontSize: '14px', padding: '4px 8px' }}>
                    -50积分消费
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {data.consume_behavior?.["-50"] || 0} ({consume50Percent}%)
                  </span>
                </div>
                <Progress 
                  percent={parseFloat(consume50Percent)} 
                  strokeColor="#ff4d4f"
                  showInfo={false}
                />
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
                    -20积分消费
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {data.consume_behavior?.["-20"] || 0} ({consume20Percent}%)
                  </span>
                </div>
                <Progress 
                  percent={parseFloat(consume20Percent)} 
                  strokeColor="#faad14"
                  showInfo={false}
                />
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                    -10积分消费
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {data.consume_behavior?.["-10"] || 0} ({consume10Percent}%)
                  </span>
                </div>
                <Progress 
                  percent={parseFloat(consume10Percent)} 
                  strokeColor="#1890ff"
                  showInfo={false}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 付费用户详细列表 */}
        <Col xs={24}>
          <Card 
            title={
              <span>
                付费用户详细列表
                <Tooltip title="显示付费用户的详细信息，包括购买次数、套餐类型、问题数、解读数等。点击行可展开查看final_questions列表">
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                </Tooltip>
              </span>
            }
            style={{ marginTop: 16 }}
          >
            <Table
              dataSource={data.paid_users_list || []}
              columns={columns}
              rowKey="user_id"
              pagination={{ pageSize: 10 }}
              expandable={{
                expandedRowRender,
                expandedRowKeys: Array.from(expandedRows),
                onExpandedRowsChange: (expandedKeys) => {
                  setExpandedRows(new Set(expandedKeys as string[]));
                },
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

export default PaymentModule;

