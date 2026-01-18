// src/components/Dashboard/UserProfileModule.tsx
// 用户Profile模块组件 - 展示用户数、年龄、timezone、付费率、engagement、功能激活率

import { Card, Row, Col, Statistic, Table, Tag, Tooltip } from 'antd';
import { UserOutlined, DollarOutlined, QuestionCircleOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

// 定义用户Profile数据接口类型
interface UserProfileData {
  new_user_count: number;
  avg_age: number;
  timezone_distribution: Record<string, number>;
  payment_rate: number;
  arpu: number;
  engagement: {
    avg_questions: number;
    avg_reports: number;
    avg_followups: number;
  };
  activation_rates: {
    destiny_gua: number;
    daily_guidance: number;
    questions: number;
    reports: number;
    image_divination: number;
    followup: number;
  };
}

// 用户Profile模块组件
function UserProfileModule({ data }: { data: UserProfileData }) {
  // 准备Timezone分布表格数据
  const timezoneTableData = Object.entries(data.timezone_distribution || {})
    .map(([timezone, count]) => ({
      key: timezone,
      timezone,
      count
    }))
    .sort((a, b) => b.count - a.count);

  // Timezone表格列定义
  const timezoneColumns = [
    {
      title: 'Timezone',
      dataIndex: 'timezone',
      key: 'timezone',
    },
    {
      title: '用户数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
  ];

  return (
    <Card 
      title="用户Profile模块" 
      style={{ marginBottom: 16 }}
      extra={<UserOutlined />}
    >
      <Row gutter={[16, 16]}>
        {/* 基础统计 */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <span>
                  新增用户数
                  <Tooltip title="在选定注册时间范围内，profiles表中新注册的用户总数">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              value={data.new_user_count}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <span>
                  平均年龄
                  <Tooltip title="根据profiles表中的birth_date字段计算，统计选定注册时间范围内用户的平均年龄">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              value={data.avg_age}
              suffix="岁"
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <span>
                  付费率
                  <Tooltip title="付费用户数 / 新增用户数 × 100%。付费用户指在credit_transactions表中有transaction_type='purchase'且status='completed'记录的用户（去重）">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              value={data.payment_rate}
              suffix="%"
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <span>
                  ARPU（每用户平均收入）
                  <Tooltip title="总收入 / 新增用户数。总收入计算：600积分=30元，300积分=20元，100积分=10元">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              value={data.arpu}
              suffix="元"
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>

        {/* Engagement数据 */}
        <Col xs={24}>
          <Card title="Engagement数据" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title={
                    <span>
                      平均问题数
                      <Tooltip title="readings表中该用户的所有问题总数 / 新增用户数">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.engagement?.avg_questions || 0}
                  prefix={<QuestionCircleOutlined />}
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title={
                    <span>
                      平均解读数
                      <Tooltip title="readings表中有final_report不为NULL的问题总数 / 新增用户数">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.engagement?.avg_reports || 0}
                  prefix={<CheckCircleOutlined />}
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title={
                    <span>
                      平均追问数
                      <Tooltip title="followup_questions表中该用户的所有追问总数 / 新增用户数">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.engagement?.avg_followups || 0}
                  precision={2}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 功能激活率 */}
        <Col xs={24}>
          <Card title="功能激活率" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={
                    <span>
                      本命卦激活率
                      <Tooltip title="profiles表中destiny_gua_binary字段不为NULL的用户数 / 新增用户数 × 100%">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.activation_rates?.destiny_gua || 0}
                  suffix="%"
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={
                    <span>
                      每日指引激活率
                      <Tooltip title="daily_guidance_records表中至少有一条记录的用户数 / 新增用户数 × 100%">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.activation_rates?.daily_guidance || 0}
                  suffix="%"
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={
                    <span>
                      提问激活率
                      <Tooltip title="readings表中至少有一条记录的用户数 / 新增用户数 × 100%">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.activation_rates?.questions || 0}
                  suffix="%"
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={
                    <span>
                      解读激活率
                      <Tooltip title="readings表中至少有一条final_report不为NULL的记录的用户数 / 新增用户数 × 100%">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.activation_rates?.reports || 0}
                  suffix="%"
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={
                    <span>
                      见相激活率
                      <Tooltip title="image_divinations表中至少有一条记录且is_user_deleted=false的用户数 / 新增用户数 × 100%">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.activation_rates?.image_divination || 0}
                  suffix="%"
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title={
                    <span>
                      追问激活率
                      <Tooltip title="followup_questions表中至少有一条记录的用户数 / 新增用户数 × 100%">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.activation_rates?.followup || 0}
                  suffix="%"
                  precision={2}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Timezone分布 */}
        <Col xs={24}>
          <Card 
            title={
              <span>
                Timezone分布
                <Tooltip title="根据profiles表中的timezone字段统计，显示各时区的用户分布情况">
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                </Tooltip>
              </span>
            }
            style={{ marginTop: 16 }}
          >
            <Table
              dataSource={timezoneTableData}
              columns={timezoneColumns}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

export default UserProfileModule;

