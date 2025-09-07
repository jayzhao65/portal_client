// src/components/PlaceholderDisplayModule.tsx
// 占位符显示模块组件

import React, { useState, useEffect } from 'react';
import { Card, Button, List, Tag, Space, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { createApiUrl } from '../config/api';

interface PlaceholderData {
  [key: string]: string;
}

interface PlaceholderDisplayModuleProps {
  stageName: string;
  placeholders: Array<{key: string, description: string}>;
  readingId: string;
  onPlaceholderDataUpdate?: (data: PlaceholderData) => void;
}

const PlaceholderDisplayModule: React.FC<PlaceholderDisplayModuleProps> = ({
  stageName,
  placeholders,
  readingId,
  onPlaceholderDataUpdate
}) => {
  const [placeholderData, setPlaceholderData] = useState<PlaceholderData>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // 当readingId变化时，清空数据
  useEffect(() => {
    setPlaceholderData({});
    setLastUpdated('');
  }, [readingId]);

  const fetchPlaceholderData = async () => {
    if (!readingId) {
      message.warning('请先输入Reading ID');
      return;
    }

    setLoading(true);
    try {
      // 根据阶段名称调用不同的接口
      let endpoint = '';
      if (stageName === '现状分析') {
        endpoint = `/test/situation-analysis/placeholders/${readingId}`;
      } else if (stageName === '占卜解读') {
        endpoint = `/test/answer-generation/placeholders/${readingId}`;
      } else if (stageName === '追问') {
        endpoint = `/test/followup/placeholders/${readingId}`;
      } else {
        // 其他阶段暂时使用通用接口
        endpoint = `/test/placeholders/get-data`;
      }

      const response = await fetch(createApiUrl(endpoint), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Dev-Mode': 'true',
          'X-Dev-Token': 'dev-secret-2024'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setPlaceholderData(result.data);
        setLastUpdated(new Date().toLocaleTimeString());
        
        // 通知父组件数据更新
        if (onPlaceholderDataUpdate) {
          onPlaceholderDataUpdate(result.data);
        }
        
        message.success('占位符数据获取成功');
      } else {
        throw new Error(result.message || '获取数据失败');
      }
    } catch (error) {
      console.error('获取占位符数据失败:', error);
      message.error(`获取数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholderValue = (placeholderKey: string): string => {
    // 移除大括号，获取实际的字段名
    const fieldName = placeholderKey.replace(/[{}]/g, '');
    return placeholderData[fieldName] || '暂无数据';
  };

  return (
    <Card 
      title="占位符状态" 
      size="small"
      extra={
        <Button 
          type="primary" 
          size="small" 
          icon={<ReloadOutlined />}
          onClick={fetchPlaceholderData}
          loading={loading}
        >
          获取数据
        </Button>
      }
    >
      <List
        size="small"
        dataSource={placeholders}
        renderItem={(item) => (
          <List.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Tag color="blue">{item.key}</Tag>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {item.description}
                </span>
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#333',
                backgroundColor: '#f5f5f5',
                padding: '4px 8px',
                borderRadius: '4px',
                minHeight: '20px'
              }}>
                {getPlaceholderValue(item.key)}
              </div>
            </Space>
          </List.Item>
        )}
      />
      {lastUpdated && (
        <div style={{ 
          fontSize: '11px', 
          color: '#999', 
          textAlign: 'center', 
          marginTop: '8px' 
        }}>
          最后更新: {lastUpdated}
        </div>
      )}
    </Card>
  );
};

export default PlaceholderDisplayModule;
