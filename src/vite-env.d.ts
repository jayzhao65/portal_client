/// <reference types="vite/client" />

// 声明环境变量的类型
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly PROD: boolean
  readonly MODE: string
  // 在这里添加更多的环境变量类型...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 声明Vite全局变量
declare const __API_BASE_URL__: string; 