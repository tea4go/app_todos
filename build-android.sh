#!/bin/bash

# Android Build Script for app-todos
# 此脚本用于在新机器上快速编译 Android APK

set -e  # 遇到错误立即退出

echo "========================================"
echo "  Android 构建脚本"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}步骤 1/6: 检查环境...${NC}"
# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js 版本: $(node --version)${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未找到 npm${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm 版本: $(npm --version)${NC}"

# 检查 Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    # 尝试查找常见的 Android SDK 位置
    if [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
        export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
        echo -e "${YELLOW}自动检测到 Android SDK: $ANDROID_HOME${NC}"
    elif [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
        echo -e "${YELLOW}自动检测到 Android SDK: $ANDROID_HOME${NC}"
    else
        echo -e "${RED}错误: 未找到 Android SDK，请设置 ANDROID_HOME 环境变量${NC}"
        echo "提示: export ANDROID_HOME=/path/to/android/sdk"
        exit 1
    fi
else
    if [ -n "$ANDROID_HOME" ]; then
        SDK_PATH="$ANDROID_HOME"
    else
        SDK_PATH="$ANDROID_SDK_ROOT"
    fi
    echo -e "${GREEN}✓ Android SDK: $SDK_PATH${NC}"
fi

# 添加 Android SDK 工具到 PATH
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin"

echo ""
echo -e "${YELLOW}步骤 2/6: 安装项目依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo "安装依赖包..."
    npm install --legacy-peer-deps
else
    echo -e "${GREEN}✓ node_modules 已存在${NC}"
fi

echo ""
echo -e "${YELLOW}步骤 3/6: 预构建 Android 原生项目...${NC}"
if [ ! -d "android" ]; then
    echo "运行 expo prebuild..."
    npx expo prebuild --platform android
else
    echo -e "${GREEN}✓ android 目录已存在${NC}"
fi

echo ""
echo -e "${YELLOW}步骤 4/6: 配置 Android SDK 路径...${NC}"
# 创建 local.properties
if [ -n "$ANDROID_HOME" ]; then
    echo "sdk.dir=$ANDROID_HOME" > android/local.properties
    echo -e "${GREEN}✓ 已创建 android/local.properties${NC}"
elif [ -n "$ANDROID_SDK_ROOT" ]; then
    echo "sdk.dir=$ANDROID_SDK_ROOT" > android/local.properties
    echo -e "${GREEN}✓ 已创建 android/local.properties${NC}"
fi

echo ""
echo -e "${YELLOW}步骤 5/6: 编译 Android APK...${NC}"
cd android
./gradlew assembleDebug --no-daemon
cd ..

echo ""
echo -e "${YELLOW}步骤 6/6: 检查编译结果...${NC}"
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
    echo -e "${GREEN}✓ APK 编译成功!${NC}"
    echo -e "  路径: $APK_PATH"
    echo -e "  大小: $APK_SIZE"
    echo ""
    echo -e "${GREEN}========================================"
    echo "  构建完成! 🎉"
    echo "========================================${NC}"
    echo ""
    echo "下一步操作:"
    echo "1. 安装到设备/模拟器:"
    echo "   adb install -r $APK_PATH"
    echo ""
    echo "2. 启动 Metro bundler (开发模式):"
    echo "   npm start"
    echo ""
    echo "3. 设置端口转发 (开发模式):"
    echo "   adb reverse tcp:8081 tcp:8081"
else
    echo -e "${RED}✗ 未找到 APK 文件${NC}"
    exit 1
fi
