# 团队待办（app-todos）

一个基于 Expo（React Native）构建的「团队待办」应用：支持本地存储、按条件筛选/排序、以及通过 Gitee 代码片段（Gist）进行团队数据同步（离线时会记录待同步操作，后续可手动同步）。

## 技术栈

- Expo SDK: 54（见 package.json）
- React / React Native: 19.1.0 / 0.81.5
- 导航: React Navigation（Bottom Tabs + Native Stack）
- 存储: AsyncStorage
- 通知: expo-notifications
- 测试: Jest + jest-expo + @testing-library/react-native

## 环境依赖（当前开发机）

- Node.js: v20.10.0
- npm: 10.2.3

## 快速开始

### 安装依赖

```bash
cd app_todos
npm install --legacy-peer-deps
```

### 启动开发服务

启动开发服务（推荐）：

```bash
npm run start
```

分别启动到不同平台：

```bash
npm run ios
npm run android
npm run web
```

### Android 构建（推荐使用脚本）

**快速构建 APK**：
```bash
./build-android.sh
```

详细说明请查看 [Android 构建指南](docs/android-build.md)。

## 常用脚本

项目脚本来自 [package.json](file:///Volumes/SSD-1T/MyCode/TmpCode/app_todos/package.json)：

- start: 启动 Expo 开发服务器（expo start）
- ios: 运行 iOS（expo run:ios）
- android: 运行 Android（expo run:android）
- web: 运行 Web（expo start --web）
- test: 运行单元测试（jest --forceExit）

## 配置说明（Gitee 同步）

应用通过 Gitee API（v5）读写代码片段（Gist）实现团队数据同步：

- 私人令牌（Token）：在「设置」页中输入并保存
- 代码片段 ID（Gist ID）：可手动填写，或点击「初始化代码片段」自动创建

数据文件格式为一个 `todos.json`，内容为 `TodoData`（团队名称、成员列表、待办列表）。

注意事项：

- Token 会被存入本地存储（AsyncStorage）。不要把 Token 写入仓库或分享给他人
- 同步策略为合并：同一条 todo 以 `updatedAt` 更新较新的为准
- 离线或同步失败时会记录待同步操作，后续可在「设置」页手动同步

## 部署与发布

### Web

本项目提供 Web 开发模式脚本（`npm run web`）。若需要生成可部署的静态产物，可使用 Expo 的导出命令：

```bash
npx expo export -p web
```

导出后将生成的静态目录（通常为 `dist/`）部署到任意静态站点托管（Nginx、对象存储、Vercel 等）即可。

### iOS / Android

本项目使用 `expo run:ios` / `expo run:android` 进行本地原生运行，通常用于开发与调试（依赖本机 Xcode/Android Studio 环境）。

如需打包发布到应用商店，通常需要引入 Expo 的构建/发布流程（例如 EAS Build）。当前仓库未包含 `eas.json` 等发布配置，需要按实际发布目标补齐。

## 项目结构

```text
app_todos/
  src/
    components/        复用组件（卡片、筛选条等）
    navigation/        导航配置（Tabs/Stack）
    screens/           页面（列表、详情、筛选、设置）
    services/          数据/存储/通知/Gitee API
    types/             TypeScript 类型定义
  __tests__/           单元测试
  App.tsx              应用入口
  app.json             Expo 应用配置
```

## 测试

```bash
npm test
```

## License

见 [LICENSE](file:///Volumes/SSD-1T/MyCode/TmpCode/app_todos/LICENSE)。
