// src/services/authService.ts
// 认证服务 - 管理登录状态和认证逻辑

// localStorage 中存储认证状态的 key
const AUTH_TOKEN_KEY = 'portal_auth_token';

// 从环境变量获取密码，如果没有则使用默认值
const getPortalPassword = (): string => {
  return import.meta.env.VITE_PORTAL_PASSWORD || 'dev-secret-2024';
};

/**
 * 认证服务类
 * 负责管理登录状态、密码验证等功能
 */
class AuthService {
  /**
   * 登录方法
   * 验证密码是否正确，如果正确则保存登录状态到 localStorage
   * 
   * @param password 用户输入的密码
   * @returns 登录是否成功
   */
  login(password: string): boolean {
    const correctPassword = getPortalPassword();
    
    // 验证密码是否正确
    if (password === correctPassword) {
      // 密码正确，保存登录状态
      // 使用时间戳作为 token 值，方便后续扩展（如过期时间检查）
      const token = Date.now().toString();
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      return true;
    }
    
    // 密码错误
    return false;
  }

  /**
   * 登出方法
   * 清除 localStorage 中的登录状态
   */
  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  /**
   * 检查是否已登录
   * 通过检查 localStorage 中是否存在认证 token 来判断
   * 
   * @returns 是否已登录
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return token !== null && token !== '';
  }

  /**
   * 获取认证 token（用于 API 请求）
   * 返回固定的 dev-secret-2024，因为后端使用 X-Dev-Token 头
   * 
   * @returns 认证 token
   */
  getAuthToken(): string {
    return 'dev-secret-2024';
  }
}

// 导出单例实例
export const authService = new AuthService();

// 导出类型（如果需要）
export type { AuthService };

