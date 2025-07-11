# AI周易占卜后台管理系统 - 前端

这是AI周易占卜应用的后台管理系统前端部分。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design 5.x
- **路由**: React Router v6
- **HTTP请求**: Fetch API

## 功能模块

### 1. 用户管理
- 用户列表展示
- 新增、编辑、删除用户
- 标签管理

### 2. 卦和爻管理
- 64卦管理
- 384爻管理
- 树状结构展示
- 批量导入功能

### 3. 问题澄清（AI调试）
- 三栏式布局
- 对话模拟
- 结果解析

### 4. 核心占卜
- 六爻状态选择
- 实时计算
- 结果展示

## 安装和运行

### 1. 安装依赖
```bash
cd portal_client
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

项目将在 http://localhost:3000 启动

### 3. 构建生产版本
```bash
npm run build
```

## 后端接口

前端通过 `/api` 前缀代理到后端 FastAPI 服务（http://localhost:8000）

确保后端服务已启动：
```bash
# 在项目根目录
uvicorn main:app --reload
```

## 项目结构

```
portal_client/
├── src/
│   ├── pages/          # 页面组件
│   │   ├── UserManagement.tsx
│   │   ├── GuaYaoManagement.tsx
│   │   ├── QuestionClarify.tsx
│   │   └── Divination.tsx
│   ├── App.tsx         # 主应用组件
│   ├── main.tsx        # 入口文件
│   └── index.css       # 全局样式
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 开发说明

1. 所有页面都有详细的中文注释
2. 使用 TypeScript 进行类型检查
3. 遵循 React Hooks 最佳实践
4. 使用 Ant Design 组件保持 UI 一致性 