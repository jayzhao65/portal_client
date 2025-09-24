// src/config/api.ts
// API配置文件 - 统一管理API调用

// 获取API基础URL
const getApiBaseUrl = (): string => {
  const isProd = import.meta.env.PROD;
  const mode = import.meta.env.MODE;
  const defaultBackendUrl = 'https://test.yilore.lichen.xin';
  // 开发环境强制使用localhost:8000
  if (!isProd) {
    console.log('🔧 开发环境强制使用: http://localhost:8000');
    return 'http://localhost:8000';
  }
  
  // 生产环境：强制使用正确的API地址
  console.log('🔍 API配置调试信息:', {
    isProd,
    mode,
    __API_BASE_URL__: typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : 'undefined',
    envUrl: import.meta.env.VITE_API_BASE_URL,
    defaultBackendUrl,
    finalApiUrl: defaultBackendUrl
  });
  
  console.log('✅ 生产环境强制使用API地址:', defaultBackendUrl);
  return defaultBackendUrl;
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
  
  // 卦爻管理相关（新接口）
  GUA_LIST: '/api/v1/gua-list',
  YAO_LIST: '/api/v1/yao-list',
  GUA_MANAGEMENT: (id: string) => `/api/v1/gua/${id}`,
  YAO_MANAGEMENT: (id: string) => `/api/v1/yao/${id}`,
  
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
  
  // Prompt配置相关
  PROMPT_CONFIGS: '/api/v1/prompt-configs/',
  PROMPT_CONFIG_BY_ID: (id: string) => `/api/v1/prompt-configs/${id}`,
  PROMPT_CONFIG_ACTIVATE: (id: string) => `/api/v1/prompt-configs/${id}/activate`,
  PROMPT_CONFIG_MODELS: '/api/v1/prompt-configs/models',
} as const; 