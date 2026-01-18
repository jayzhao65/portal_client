// src/components/Dashboard/QuestionModule.tsx
// 占卜问题模块组件 - 展示问题统计、状态分布、解读率、追问率等

import { Card, Row, Col, Statistic, Progress, Tag, Tooltip } from 'antd';
import { QuestionCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

// 定义占卜问题数据接口类型
interface QuestionStatsData {
  total_questions: number;
  status_distribution: {
    green: number;
    yellow: number;
    red: number;
  };
  valid_questions: number;
  valid_question_rate: number;
  invalid_red_rate: number;
  invalid_yellow_rate: number;
  total_reports: number;
  valid_question_report_rate: number;
  non_balance_report_rate: number;
  situation_supplement_rate: number;
  followup_rate: number;
  avg_followup_count: number;
}

// 占卜问题模块组件
function QuestionModule({ data }: { data: QuestionStatsData }) {
  // 计算状态分布百分比
  const total = data.total_questions || 1;
  const greenPercent = ((data.status_distribution?.green || 0) / total * 100).toFixed(1);
  const yellowPercent = ((data.status_distribution?.yellow || 0) / total * 100).toFixed(1);
  const redPercent = ((data.status_distribution?.red || 0) / total * 100).toFixed(1);

  return (
    <Card 
      title="占卜问题模块" 
      style={{ marginBottom: 16 }}
      extra={<QuestionCircleOutlined />}
    >
      <Row gutter={[16, 16]}>
        {/* 问题总数量 */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <span>
                  问题总数量
                  <Tooltip title="readings表中在选定时间范围内的所有问题总数（同时满足Readings时间范围和注册时间范围筛选）">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              value={data.total_questions || 0}
              prefix={<QuestionCircleOutlined />}
            />
          </Card>
        </Col>

        {/* 有效问题数 */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <span>
                  有效问题数
                  <Tooltip title="readings表中final_question字段不为NULL的问题数量">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              value={data.valid_questions || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>

        {/* 有效问题率 */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <span>
                  有效问题率
                  <Tooltip title="有效问题数 / 问题总数量 × 100%">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              value={data.valid_question_rate || 0}
              suffix="%"
              precision={2}
            />
          </Card>
        </Col>

        {/* 解读总数量 */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={
                <span>
                  解读总数量
                  <Tooltip title="readings表中final_report字段不为NULL的问题数量">
                    <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </span>
              }
              value={data.total_reports || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>

        {/* 问题状态饼图（用进度条和标签展示） */}
        <Col xs={24}>
          <Card 
            title={
              <span>
                问题状态分布
                <Tooltip title="根据readings表中的question_status字段统计：green（绿灯）、yellow（黄灯）、red（红灯）">
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                </Tooltip>
              </span>
            }
            style={{ marginTop: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                    <CheckCircleOutlined /> 绿灯
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {data.status_distribution?.green || 0} ({greenPercent}%)
                  </span>
                </div>
                <Progress 
                  percent={parseFloat(greenPercent)} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
                    <ExclamationCircleOutlined /> 黄灯
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {data.status_distribution?.yellow || 0} ({yellowPercent}%)
                  </span>
                </div>
                <Progress 
                  percent={parseFloat(yellowPercent)} 
                  strokeColor="#faad14"
                  showInfo={false}
                />
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="red" style={{ fontSize: '14px', padding: '4px 8px' }}>
                    <CloseCircleOutlined /> 红灯
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {data.status_distribution?.red || 0} ({redPercent}%)
                  </span>
                </div>
                <Progress 
                  percent={parseFloat(redPercent)} 
                  strokeColor="#ff4d4f"
                  showInfo={false}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 无效问题比例 */}
        <Col xs={24}>
          <Card 
            title={
              <span>
                无效问题比例
                <Tooltip title="无效问题指question_status为红灯或黄灯的问题，占问题总数量的比例">
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                </Tooltip>
              </span>
            }
            style={{ marginTop: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="red">
                    红灯无效问题
                    <Tooltip title="question_status='red'的问题数 / 问题总数量 × 100%">
                      <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                    </Tooltip>
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {data.invalid_red_rate?.toFixed(2) || 0}%
                  </span>
                </div>
                <Progress 
                  percent={data.invalid_red_rate || 0} 
                  strokeColor="#ff4d4f"
                />
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="orange">
                    黄灯无效问题
                    <Tooltip title="question_status='yellow'的问题数 / 问题总数量 × 100%">
                      <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                    </Tooltip>
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {data.invalid_yellow_rate?.toFixed(2) || 0}%
                  </span>
                </div>
                <Progress 
                  percent={data.invalid_yellow_rate || 0} 
                  strokeColor="#faad14"
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 解读数据 */}
        <Col xs={24}>
          <Card title="解读数据" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title={
                    <span>
                      有效问题解读率
                      <Tooltip title="有final_report的有效问题数 / 有效问题数 × 100%">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.valid_question_report_rate || 0}
                  suffix="%"
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title={
                    <span>
                      有效问题且非余额导致解读率
                      <Tooltip title="有效问题中，用户余额>=50（非余额不足导致）且有final_report的问题数 / 有效问题数 × 100%">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.non_balance_report_rate || 0}
                  suffix="%"
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title={
                    <span>
                      有效问题现状补充率
                      <Tooltip title="有效问题中，situation_supplement字段不为NULL的问题数 / 有效问题数 × 100%">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.situation_supplement_rate || 0}
                  suffix="%"
                  precision={2}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 追问数据 */}
        <Col xs={24}>
          <Card title="追问数据" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Statistic
                  title={
                    <span>
                      追问率
                      <Tooltip title="有final_report的问题中，在followup_questions表中有至少一条记录的问题数 / 有final_report的问题总数 × 100%">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.followup_rate || 0}
                  suffix="%"
                  precision={2}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic
                  title={
                    <span>
                      平均追问个数
                      <Tooltip title="有final_report的问题的所有追问总数 / 有final_report的问题总数">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                      </Tooltip>
                    </span>
                  }
                  value={data.avg_followup_count || 0}
                  precision={2}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

export default QuestionModule;

