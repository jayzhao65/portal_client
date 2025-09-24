import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://test.yilore.lichen.xin:8002'
  
  console.log('🔧 Vite配置 - API基础URL:', apiBaseUrl)
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        }
      }
    },
    build: {
      // 确保构建时正确处理路由
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    define: {
      // 让前端代码能访问环境变量
      __API_BASE_URL__: JSON.stringify(apiBaseUrl)
    }
  }
}) 