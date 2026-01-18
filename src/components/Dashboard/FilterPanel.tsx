// src/components/Dashboard/FilterPanel.tsx
// Dashboard筛选器组件 - 用于选择环境、时间范围等筛选条件

import { useState } from 'react';
import { Card, Select, DatePicker, Space, Button, Row, Col } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 定义筛选器组件的Props类型
interface FilterPanelProps {
  // 环境选择回调函数
  onEnvChange: (env: string) => void;
  // Readings时间范围变化回调函数
  onReadingDateRangeChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  // 注册时间范围变化回调函数
  onRegistrationDateRangeChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  // 查询按钮点击回调函数
  onQuery: () => void;
  // 是否正在加载数据
  loading?: boolean;
}

// 筛选器组件
function FilterPanel({
  onEnvChange,
  onReadingDateRangeChange,
  onRegistrationDateRangeChange,
  onQuery,
  loading = false
}: FilterPanelProps) {
  // 当前选择的环境（test 或 production）
  const [env, setEnv] = useState<string>('test');
  // Readings时间范围
  const [readingDateRange, setReadingDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  // 注册时间范围
  const [registrationDateRange, setRegistrationDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // 处理环境选择变化
  const handleEnvChange = (value: string) => {
    setEnv(value);
    onEnvChange(value);
  };

  // 处理Readings时间范围变化
  const handleReadingDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setReadingDateRange(dates);
    onReadingDateRangeChange(dates);
  };

  // 处理注册时间范围变化
  const handleRegistrationDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setRegistrationDateRange(dates);
    onRegistrationDateRangeChange(dates);
  };

  // 处理"全部"按钮点击 - 清空Readings时间范围
  const handleReadingAll = () => {
    setReadingDateRange(null);
    onReadingDateRangeChange(null);
  };

  // 处理"全部"按钮点击 - 清空注册时间范围
  const handleRegistrationAll = () => {
    setRegistrationDateRange(null);
    onRegistrationDateRangeChange(null);
  };

  // 禁用未来日期
  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    // 不能选择未来的日期
    return current && current > dayjs().endOf('day');
  };

  return (
    <Card 
      title={
        <Space>
          <FilterOutlined />
          <span>筛选条件</span>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={[16, 16]}>
        {/* 环境选择 */}
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 8 }}>
            <strong>环境选择：</strong>
          </div>
          <Select
            value={env}
            onChange={handleEnvChange}
            style={{ width: '100%' }}
            size="large"
          >
            <Option value="test">测试环境</Option>
            <Option value="production">正式环境</Option>
          </Select>
        </Col>

        {/* Readings时间范围选择 */}
        <Col xs={24} sm={12} md={9}>
          <div style={{ marginBottom: 8 }}>
            <strong>Readings时间范围：</strong>
            <Button 
              type="link" 
              size="small" 
              onClick={handleReadingAll}
              style={{ padding: 0, marginLeft: 8 }}
            >
              全部
            </Button>
          </div>
          <RangePicker
            value={readingDateRange}
            onChange={handleReadingDateRangeChange}
            style={{ width: '100%' }}
            size="large"
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            disabledDate={disabledDate}
            placeholder={['开始时间', '结束时间']}
          />
        </Col>

        {/* 注册时间范围选择 */}
        <Col xs={24} sm={12} md={9}>
          <div style={{ marginBottom: 8 }}>
            <strong>注册时间范围：</strong>
            <Button 
              type="link" 
              size="small" 
              onClick={handleRegistrationAll}
              style={{ padding: 0, marginLeft: 8 }}
            >
              全部
            </Button>
          </div>
          <RangePicker
            value={registrationDateRange}
            onChange={handleRegistrationDateRangeChange}
            style={{ width: '100%' }}
            size="large"
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            disabledDate={disabledDate}
            placeholder={['开始时间', '结束时间']}
          />
        </Col>

        {/* 查询按钮 */}
        <Col xs={24} sm={24} md={24}>
          <Button
            type="primary"
            onClick={onQuery}
            loading={loading}
            size="large"
            block
          >
            查询数据
          </Button>
        </Col>
      </Row>
    </Card>
  );
}

export default FilterPanel;

