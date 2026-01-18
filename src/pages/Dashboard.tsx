// src/pages/Dashboard.tsx
// Dashboard数据看板主页面 - 整合所有数据模块

import { useState, useEffect } from 'react';
import { Spin, message } from 'antd';
import { createApiUrl, API_ENDPOINTS } from '../config/api';
import FilterPanel from '../components/Dashboard/FilterPanel';
import UserProfileModule from '../components/Dashboard/UserProfileModule';
import QuestionModule from '../components/Dashboard/QuestionModule';
import PaymentModule from '../components/Dashboard/PaymentModule';
import AnomalyModule from '../components/Dashboard/AnomalyModule';
import TopStatsModule from '../components/Dashboard/TopStatsModule';
import dayjs, { Dayjs } from 'dayjs';

// 定义Dashboard数据接口类型
interface DashboardData {
  user_profile: any;
  question_stats: any;
  payment_stats: any;
  anomaly_stats: any;
  top_stats: any;
}

// Dashboard主页面组件
function Dashboard() {
  // 当前选择的环境
  const [env, setEnv] = useState<string>('test');
  // Readings时间范围
  const [readingDateRange, setReadingDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  // 注册时间范围
  const [registrationDateRange, setRegistrationDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  // Dashboard数据
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  // 是否正在加载
  const [loading, setLoading] = useState<boolean>(false);

  // 获取Dashboard数据
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      params.append('env', env);
      
      // 添加Readings时间范围参数
      if (readingDateRange && readingDateRange[0] && readingDateRange[1]) {
        params.append('reading_start_date', readingDateRange[0].toISOString());
        params.append('reading_end_date', readingDateRange[1].toISOString());
      }
      
      // 添加注册时间范围参数
      if (registrationDateRange && registrationDateRange[0] && registrationDateRange[1]) {
        params.append('registration_start_date', registrationDateRange[0].toISOString());
        params.append('registration_end_date', registrationDateRange[1].toISOString());
      }

      // 发送请求
      const url = `${createApiUrl(API_ENDPOINTS.DASHBOARD_STATS)}?${params.toString()}`;
      console.log('📊 请求Dashboard数据:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Dashboard数据请求失败:', response.status, errorText);
        message.error(`获取数据失败: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log('✅ Dashboard数据获取成功:', data);
      
      setDashboardData(data);
      message.success('数据加载成功');
      
    } catch (error) {
      console.error('❌ 获取Dashboard数据异常:', error);
      message.error('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理环境变化
  const handleEnvChange = (newEnv: string) => {
    setEnv(newEnv);
  };

  // 处理Readings时间范围变化
  const handleReadingDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setReadingDateRange(dates);
  };

  // 处理注册时间范围变化
  const handleRegistrationDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setRegistrationDateRange(dates);
  };

  // 处理查询按钮点击
  const handleQuery = () => {
    fetchDashboardData();
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 筛选器面板 */}
      <FilterPanel
        onEnvChange={handleEnvChange}
        onReadingDateRangeChange={handleReadingDateRangeChange}
        onRegistrationDateRangeChange={handleRegistrationDateRangeChange}
        onQuery={handleQuery}
        loading={loading}
      />

      {/* 数据展示区域 */}
      {loading && !dashboardData ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="正在加载数据..." />
        </div>
      ) : dashboardData ? (
        <div>
          {/* 用户Profile模块 */}
          <UserProfileModule data={dashboardData.user_profile} />

          {/* 占卜问题模块 */}
          <QuestionModule data={dashboardData.question_stats} />

          {/* 付费数据模块 */}
          <PaymentModule data={dashboardData.payment_stats} />

          {/* 异常数据模块 */}
          <AnomalyModule data={dashboardData.anomaly_stats} />

          {/* "最"板块模块 */}
          <TopStatsModule data={dashboardData.top_stats} />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
          暂无数据，请点击"查询数据"按钮获取数据
        </div>
      )}
    </div>
  );
}

export default Dashboard;

