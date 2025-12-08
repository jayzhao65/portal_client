// src/components/ProtectedRoute.tsx
// 路由保护组件 - 实现路由守卫功能

import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 路由保护组件
 * 检查用户是否已登录，未登录则重定向到登录页
 * 
 * @param children 要保护的路由组件
 * @returns 已登录时渲染子组件，未登录时重定向到登录页
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  
  // 检查是否已登录
  if (!authService.isAuthenticated()) {
    // 未登录，重定向到登录页，并保存当前路径以便登录后跳转回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 已登录，渲染子组件
  return <>{children}</>;
}

export default ProtectedRoute;

