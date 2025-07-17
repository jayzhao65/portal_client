// src/config/api.ts
// API配置文件 - 统一管理API调用

// 获取API基础URL
const getApiBaseUrl = (): string => {
  const isProd = import.meta.env.PROD;
  const mode = import.meta.env.MODE;
  const defaultBackendUrl = 'https://oracle-backend-g9sn.onrender.com';
  
  // 尝试获取API基础URL的不同方式
  let apiUrl = '';
  
  // 方式1：使用Vite定义的全局变量（推荐）
  if (typeof __API_BASE_URL__ !== 'undefined') {
    apiUrl = __API_BASE_URL__;
  }
  // 方式2：使用环境变量（备用）
  else if (import.meta.env.VITE_API_BASE_URL) {
    apiUrl = import.meta.env.VITE_API_BASE_URL;
  }
  // 方式3：使用默认值
  else {
    apiUrl = defaultBackendUrl;
  }
  
  // 添加调试日志
  console.log('🔍 API配置调试信息:', {
    isProd,
    mode,
    __API_BASE_URL__: typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : 'undefined',
    envUrl: import.meta.env.VITE_API_BASE_URL,
    defaultBackendUrl,
    finalApiUrl: apiUrl
  });
  
  if (isProd) {
    // 生产环境：使用获取到的API URL
    console.log('✅ 生产环境使用API地址:', apiUrl);
    return apiUrl;
  } else {
    // 开发环境：使用代理，所以直接用相对路径
    console.log('🔧 开发环境使用代理，API URL:', apiUrl);
    return '';
  }
};

// 导出API基础URL
export const API_BASE_URL = getApiBaseUrl();

// 添加启动时的调试信息
console.log('🚀 最终API_BASE_URL:', API_BASE_URL);

// 创建完整的API URL
export const createApiUrl = (endpoint: string): string => {
  // 确保endpoint以/开头
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const finalUrl = `${API_BASE_URL}${cleanEndpoint}`;
  
  // 添加调试日志
  console.log('🔗 创建API URL:', {
    endpoint,
    cleanEndpoint,
    API_BASE_URL,
    finalUrl
  });
  
  return finalUrl;
};

// 常用的API endpoints
export const API_ENDPOINTS = {
  // 用户相关
  USERS: '/api/users',
  USER_BY_ID: (id: number) => `/api/users/${id}`,
  
  // 模型相关
  MODELS: '/api/models',
  
  // 卦和爻相关
  GUAS: '/api/guas',
  GUA_BY_ID: (id: string) => `/api/guas/${id}`,
  GUA_SEARCH: (binaryCode: string) => `/api/guas/search/${binaryCode}`,
  YAOS: '/api/yaos',
  YAO_BY_ID: (id: string) => `/api/yaos/${id}`,
  YAO_SEARCH: (guaPosition: number, yaoPosition: number) => `/api/yaos/search/${guaPosition}/${yaoPosition}`,
  YAO_OPTIONS: '/api/yao-options',
  
  // 占卜相关
  DIVINE: '/api/divine',
  AI_INTERPRETATION: '/api/ai-interpretation',
  
  // 问题澄清相关
  CLARIFY_START: '/api/clarify/start',
  CLARIFY_CONTINUE: '/api/clarify/continue',
  CLARIFY_ADD_TAGS: '/api/clarify/add-tags',
  
  // 占卜设置相关
  SETUP_MODELS: '/api/models',
  SETUP_START: '/api/setup/start',
  SETUP_CONTINUE: '/api/setup/continue',
} as const; 