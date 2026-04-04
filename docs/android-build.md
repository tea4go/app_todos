# Android 构建指南

本文档说明如何在新机器上编译和运行 Android 应用。

## 前置要求

在运行构建脚本之前，请确保已安装以下软件：

### 1. Node.js 和 npm
```bash
# macOS
brew install node

# Ubuntu/Debian
sudo apt install nodejs npm

# 验证安装
node --version
npm --version
```

### 2. Android Studio 和 Android SDK

#### macOS/Linux:
1. 下载并安装 [Android Studio](https://developer.android.com/studio)
2. 打开 Android Studio，通过 SDK Manager 安装:
   - Android SDK Platform 36
   - Android SDK Build-Tools 36.0.0
   - Android SDK Platform-Tools
   - Android Emulator (可选)

3. 设置环境变量（添加到 `~/.zshrc` 或 `~/.bashrc`）:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# 或
export ANDROID_HOME=$HOME/Android/Sdk  # Linux

export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```

#### Windows:
1. 下载并安装 [Android Studio](https://developer.android.com/studio)
2. 设置环境变量:
```
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
Path=%Path%;%ANDROID_HOME%\platform-tools
```

## 快速开始

### 方法 1: 使用构建脚本（推荐）

```bash
# 克隆项目后，直接运行构建脚本
./build-android.sh
```

脚本会自动完成以下步骤：
1. ✓ 检查环境（Node.js, npm, Android SDK）
2. ✓ 安装项目依赖
3. ✓ 预构建 Android 原生项目
4. ✓ 配置 Android SDK 路径
5. ✓ 编译 APK
6. ✓ 显示构建结果

### 方法 2: 手动步骤

```bash
# 1. 安装依赖
npm install --legacy-peer-deps

# 2. 预构建 Android 项目
npx expo prebuild --platform android

# 3. 配置 Android SDK（如果需要）
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# 4. 编译 APK
cd android
./gradlew assembleDebug
cd ..

# APK 位置: android/app/build/outputs/apk/debug/app-debug.apk
```

## 在设备/模拟器上运行

### 启动模拟器

```bash
# 查看可用的模拟器
emulator -list-avds

# 启动模拟器（替换 AVD_NAME 为你的模拟器名称）
emulator -avd AVD_NAME &
```

### 安装应用

```bash
# 安装 APK 到已连接的设备/模拟器
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### 开发模式运行

如果需要启用热重载功能：

```bash
# 1. 启动 Metro bundler
npm start
# 或
npx expo start

# 2. 在另一个终端设置端口转发
adb reverse tcp:8081 tcp:8081

# 3. 重启应用
adb shell am force-stop com.anonymous.apptodos
adb shell am start -n com.anonymous.apptodos/.MainActivity
```

### 查看日志

```bash
# 查看应用日志
adb logcat | grep -i "ReactNative\|apptodos"

# 清除日志
adb logcat -c
```

## 生产版本构建

```bash
# 编译 Release APK
cd android
./gradlew assembleRelease

# Release APK 位置: android/app/build/outputs/apk/release/app-release.apk
```

**注意**: Release 版本需要签名配置。

## 常见问题

### 1. `ANDROID_HOME not found`

**解决方案**: 设置 Android SDK 路径
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# 或根据实际安装路径调整
```

### 2. `SDK location not found`

**解决方案**: 创建 `android/local.properties` 文件
```bash
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

### 3. 依赖冲突错误

**解决方案**: 使用 `--legacy-peer-deps` 安装
```bash
npm install --legacy-peer-deps
```

### 4. Metro bundler 连接失败

**解决方案**: 设置 ADB 端口转发
```bash
adb reverse tcp:8081 tcp:8081
```

### 5. Gradle 构建失败

**解决方案**: 清理并重新构建
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

## 项目依赖版本

当前项目使用的关键版本：
- Expo SDK: ~54.0.33
- React: 19.1.0
- React Native: 0.81.5
- Node.js: 建议 18.x 或更高

## 目录结构

```
app_todos/
├── android/                    # Android 原生代码（自动生成）
│   ├── app/
│   │   └── build/
│   │       └── outputs/
│   │           └── apk/
│   │               └── debug/
│   │                   └── app-debug.apk  # 编译输出
│   └── local.properties       # Android SDK 配置
├── src/                       # 源代码
├── build-android.sh           # Android 构建脚本
├── package.json               # 项目依赖
└── README.md                  # 项目说明
```

## 更多信息

- [Expo 文档](https://docs.expo.dev/)
- [React Native 文档](https://reactnative.dev/)
- [Android 开发者文档](https://developer.android.com/)
