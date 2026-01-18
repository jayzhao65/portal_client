// src/components/Dashboard/TopStatsModule.tsx
// "最"板块模块组件 - 展示各项最高记录和用户信息

import { Card, Row, Col, Statistic, Descriptions, Tag, Typography, Tooltip } from 'antd';
import { TrophyOutlined, UserOutlined, DollarOutlined, QuestionCircleOutlined, CheckCircleOutlined, MessageOutlined, CalendarOutlined, PictureOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

// 定义"最"板块数据接口类型
interface TopStatsData {
  top_question_user: {
    user_id: string;
    registration_time: string;
    count: number;
  } | null;
  top_payment_user: {
    user_id: string;
    registration_time: string;
    total_payment: number;
  } | null;
  top_report_user: {
    user_id: string;
    registration_time: string;
    count: number;
  } | null;
  top_followup_user: {
    user_id: string;
    registration_time: string;
    count: number;
  } | null;
  top_guidance_user: {
    user_id: string;
    registration_time: string;
    count: number;
  } | null;
  top_image_div_user: {
    user_id: string;
    registration_time: string;
    count: number;
  } | null;
}

// "最"板块模块组件
function TopStatsModule({ data }: { data: TopStatsData }) {
  // 渲染用户信息卡片
  const renderUserCard = (
    title: string,
    icon: React.ReactNode,
    user: any,
    value: number,
    valueSuffix: string = '',
    valuePrefix: React.ReactNode = null,
    tooltip: string = ''
  ) => {
    if (!user) {
      return (
        <Col xs={24} sm={12} md={8} key={title}>
          <Card>
            <Statistic
              title={title}
              value={0}
              prefix={icon}
              suffix={valueSuffix}
            />
            <div style={{ marginTop: 16, color: '#999', textAlign: 'center' }}>
              暂无数据
            </div>
          </Card>
        </Col>
      );
    }

    return (
      <Col xs={24} sm={12} md={8} key={title}>
        <Card>
          <Statistic
            title={
              tooltip ? (
                <span>
                  {title}
                  <Tooltip title={tooltip}>
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              ) : title
            }
            value={value}
            prefix={valuePrefix || icon}
            suffix={valueSuffix}
          />
          <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="用户ID">
              <Text copyable={{ text: user.user_id }}>{user.user_id.substring(0, 8)}...</Text>
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {user.registration_time ? new Date(user.registration_time).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
    );
  };

  return (
    <Card 
      title="'最'板块" 
      style={{ marginBottom: 16 }}
      extra={<TrophyOutlined />}
    >
      <Row gutter={[16, 16]}>
        {/* 问题最多的用户 */}
        {renderUserCard(
          '问题最多的用户',
          <QuestionCircleOutlined />,
          data.top_question_user,
          data.top_question_user?.count || 0,
          '个问题',
          null,
          'readings表中问题数量最多的用户'
        )}

        {/* 付费最多的用户 */}
        {renderUserCard(
          '付费最多的用户',
          <DollarOutlined />,
          data.top_payment_user,
          data.top_payment_user?.total_payment || 0,
          '元',
          <DollarOutlined />,
          '根据credit_transactions表统计，付费总金额最多的用户（600积分=30元，300积分=20元，100积分=10元）'
        )}

        {/* 解读报告最多的用户 */}
        {renderUserCard(
          '解读报告最多的用户',
          <CheckCircleOutlined />,
          data.top_report_user,
          data.top_report_user?.count || 0,
          '个报告',
          null,
          'readings表中有final_report不为NULL的记录数量最多的用户'
        )}

        {/* 追问问题最多的用户 */}
        {renderUserCard(
          '追问问题最多的用户',
          <MessageOutlined />,
          data.top_followup_user,
          data.top_followup_user?.count || 0,
          '个追问',
          null,
          'followup_questions表中追问数量最多的用户'
        )}

        {/* 每日指引最多的用户 */}
        {renderUserCard(
          '每日指引最多的用户',
          <CalendarOutlined />,
          data.top_guidance_user,
          data.top_guidance_user?.count || 0,
          '次',
          null,
          'daily_guidance_records表中记录数量最多的用户'
        )}

        {/* 观物最多的用户 */}
        {renderUserCard(
          '观物最多的用户',
          <PictureOutlined />,
          data.top_image_div_user,
          data.top_image_div_user?.count || 0,
          '次',
          null,
          'image_divinations表中is_user_deleted=false的记录数量最多的用户'
        )}
      </Row>
    </Card>
  );
}

export default TopStatsModule;

