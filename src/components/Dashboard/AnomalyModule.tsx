// src/components/Dashboard/AnomalyModule.tsx
// 异常数据模块组件 - 展示异常用户列表和 final_questions

import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Collapse, Typography, Tag, Tooltip } from 'antd';
import { WarningOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Text } = Typography;

// 定义异常数据接口类型
interface AnomalyStatsData {
  anomaly1: {
    count: number;
    users: Array<{
      user_id: string;
      registration_time: string;
      final_questions: string[];
    }>;
  };
  anomaly2: {
    count: number;
    users: Array<{
      user_id: string;
      registration_time: string;
      final_questions: string[];
    }>;
  };
}

// 异常数据模块组件
function AnomalyModule({ data }: { data: AnomalyStatsData }) {
  // 异常1表格列定义
  const anomaly1Columns = [
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
      title: 'Final Questions数量',
      dataIndex: 'final_questions',
      key: 'final_questions_count',
      render: (questions: string[]) => questions?.length || 0,
      sorter: (a: any, b: any) => (a.final_questions?.length || 0) - (b.final_questions?.length || 0),
    },
  ];

  // 异常2表格列定义
  const anomaly2Columns = [
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
      title: 'Final Questions数量',
      dataIndex: 'final_questions',
      key: 'final_questions_count',
      render: (questions: string[]) => questions?.length || 0,
      sorter: (a: any, b: any) => (a.final_questions?.length || 0) - (b.final_questions?.length || 0),
    },
  ];

  // 展开行内容（显示final_questions列表）
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
      title="异常数据模块" 
      style={{ marginBottom: 16 }}
      extra={<WarningOutlined />}
    >
      <Row gutter={[16, 16]}>
        {/* 异常1：提过问题但没有过任何解读报告 */}
        <Col xs={24}>
          <Card 
            title={
              <span>
                <Tag color="red">异常1</Tag>
                提过问题但没有过任何解读报告
                <Tooltip title="在readings表中有问题记录，但在所有readings记录中都没有final_report不为NULL的用户">
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                </Tooltip>
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="用户数"
                  value={data.anomaly1?.count || 0}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col xs={24}>
                <Table
                  dataSource={data.anomaly1?.users || []}
                  columns={anomaly1Columns}
                  rowKey="user_id"
                  pagination={{ pageSize: 10 }}
                  expandable={{
                    expandedRowRender,
                  }}
                  scroll={{ x: 800 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 异常2：获得过一次解读报告，然后再也没有问过问题 */}
        <Col xs={24}>
          <Card 
            title={
              <span>
                <Tag color="orange">异常2</Tag>
                获得过一次解读报告，然后再也没有问过问题
                <Tooltip title="曾经有过final_report不为NULL的记录，但之后再也没有新的readings记录的用户">
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff', cursor: 'help' }} />
                </Tooltip>
              </span>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="用户数"
                  value={data.anomaly2?.count || 0}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col xs={24}>
                <Table
                  dataSource={data.anomaly2?.users || []}
                  columns={anomaly2Columns}
                  rowKey="user_id"
                  pagination={{ pageSize: 10 }}
                  expandable={{
                    expandedRowRender,
                  }}
                  scroll={{ x: 800 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

export default AnomalyModule;

