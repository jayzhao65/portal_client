// src/config/api.ts
// API配置文件 - 统一管理API调用

// 获取API基础URL
const getApiBaseUrl = (): string => {
  // 在生产环境中，使用完整的后端URL
  // 在开发环境中，使用代理（相对路径）
  if (import.meta.env.PROD) {
    // 生产环境：使用环境变量或默认的后端地址
    return import.meta.env.VITE_API_BASE_URL || 'https://oracle-backend-g9sn.onrender.com';
  } else {
    // 开发环境：使用代理，所以直接用相对路径
    return '';
  }
};

// 导出API基础URL
export const API_BASE_URL = getApiBaseUrl();

// 创建完整的API URL
export const createApiUrl = (endpoint: string): string => {
  // 确保endpoint以/开头
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

// 常用的API endpoints
export const API_ENDPOINTS = {
  // 用户相关
  USERS: '/api/users',
  
  // 模型相关
  MODELS: '/api/models',
  
  // 问题澄清相关
  CLARIFY_START: '/api/clarify/start',
  CLARIFY_CONTINUE: '/api/clarify/continue',
  CLARIFY_ADD_TAGS: '/api/clarify/add-tags',
  
  // 其他API...
} as const; 