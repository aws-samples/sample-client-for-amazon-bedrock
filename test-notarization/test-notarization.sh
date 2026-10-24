#!/bin/bash

echo "🧪 macOS 公证测试脚本"
echo "======================"

# 检查必要的工具
if ! command -v gcc &> /dev/null; then
    echo "❌ 错误: 未找到 gcc 编译器"
    echo "请安装 Xcode Command Line Tools: xcode-select --install"
    exit 1
fi

if ! command -v codesign &> /dev/null; then
    echo "❌ 错误: 未找到 codesign 工具"
    exit 1
fi

if ! command -v xcrun &> /dev/null; then
    echo "❌ 错误: 未找到 xcrun 工具"
    exit 1
fi

echo "✅ 所有必要工具已就绪"
echo ""

# 编译测试应用
echo "🔨 编译测试应用..."
gcc -o hello hello.c
if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi
echo "✅ 编译成功"

# 检查签名身份
echo ""
echo "🔍 检查可用的签名身份..."
SIGNING_IDENTITY="F767C95AD5F3FA36842955803DA80C95F592760A"
if security find-identity -v -p codesigning | grep -q "$SIGNING_IDENTITY"; then
    echo "✅ 找到签名身份: $SIGNING_IDENTITY"
else
    echo "❌ 未找到签名身份: $SIGNING_IDENTITY"
    echo "可用的签名身份:"
    security find-identity -v -p codesigning
    exit 1
fi

# 代码签名
echo ""
echo "✍️ 对应用进行代码签名..."
codesign --force --sign "$SIGNING_IDENTITY" --timestamp --options runtime hello
if [ $? -eq 0 ]; then
    echo "✅ 代码签名成功"
else
    echo "❌ 代码签名失败"
    exit 1
fi

# 验证签名
echo ""
echo "🔍 验证代码签名..."
codesign --verify --verbose hello
if [ $? -eq 0 ]; then
    echo "✅ 签名验证成功"
else
    echo "❌ 签名验证失败"
    exit 1
fi

# 创建 ZIP 包用于公证
echo ""
echo "📦 创建公证包..."
zip -r hello.zip hello
if [ $? -eq 0 ]; then
    echo "✅ 公证包创建成功"
else
    echo "❌ 公证包创建失败"
    exit 1
fi

# 测试 API 密钥配置
echo ""
echo "🔑 测试 API 密钥配置..."

# 从环境变量或提示用户输入
if [ -z "$APPLE_API_KEY_ID" ] || [ -z "$APPLE_API_ISSUER" ]; then
    echo "请提供 API 密钥信息:"
    read -p "Key ID (8Z7VLMB36Y): " KEY_ID
    read -p "Issuer ID (7cc2e9f8-905a-44ec-a919-3981a92ed3f1): " ISSUER_ID
    read -p "API Key 文件路径 (/Users/qiangu/Downloads/AuthKey_8Z7VLMB36Y.p8): " API_KEY_PATH
    
    KEY_ID=${KEY_ID:-8Z7VLMB36Y}
    ISSUER_ID=${ISSUER_ID:-7cc2e9f8-905a-44ec-a919-3981a92ed3f1}
    API_KEY_PATH=${API_KEY_PATH:-/Users/qiangu/Downloads/AuthKey_8Z7VLMB36Y.p8}
else
    KEY_ID="$APPLE_API_KEY_ID"
    ISSUER_ID="$APPLE_API_ISSUER"
    # 创建临时 API 密钥文件
    echo "$APPLE_API_KEY" > /tmp/api_key.p8
    API_KEY_PATH="/tmp/api_key.p8"
fi

# 检查 API 密钥文件
if [ ! -f "$API_KEY_PATH" ]; then
    echo "❌ 错误: API 密钥文件不存在: $API_KEY_PATH"
    exit 1
fi

echo "✅ API 密钥文件找到: $API_KEY_PATH"

# 提交公证
echo ""
echo "🚀 提交公证请求..."
echo "Key ID: $KEY_ID"
echo "Issuer: $ISSUER_ID"
echo ""

SUBMISSION_OUTPUT=$(xcrun notarytool submit hello.zip \
    --key "$API_KEY_PATH" \
    --key-id "$KEY_ID" \
    --issuer "$ISSUER_ID" \
    --wait \
    --timeout 10m 2>&1)

echo "$SUBMISSION_OUTPUT"

# 检查提交结果
if echo "$SUBMISSION_OUTPUT" | grep -q "Successfully received submission info"; then
    echo ""
    echo "🎉 公证测试成功！"
    echo "✅ API 密钥配置正确"
    echo "✅ 公证流程正常"
    
    # 提取 submission ID
    SUBMISSION_ID=$(echo "$SUBMISSION_OUTPUT" | grep -o 'id: [a-f0-9-]*' | cut -d' ' -f2)
    if [ -n "$SUBMISSION_ID" ]; then
        echo "📋 Submission ID: $SUBMISSION_ID"
        
        # 获取详细信息
        echo ""
        echo "📊 公证详细信息:"
        xcrun notarytool info "$SUBMISSION_ID" \
            --key "$API_KEY_PATH" \
            --key-id "$KEY_ID" \
            --issuer "$ISSUER_ID"
    fi
    
elif echo "$SUBMISSION_OUTPUT" | grep -q "Error:"; then
    echo ""
    echo "❌ 公证测试失败"
    echo "错误信息:"
    echo "$SUBMISSION_OUTPUT"
    
    # 常见错误解决方案
    echo ""
    echo "💡 常见问题解决方案:"
    echo "1. 检查 API 密钥文件格式是否正确"
    echo "2. 确认 Key ID 和 Issuer ID 是否正确"
    echo "3. 检查网络连接"
    echo "4. 确认 Apple Developer 账户状态"
    
else
    echo ""
    echo "⚠️ 公证状态未知"
    echo "输出信息:"
    echo "$SUBMISSION_OUTPUT"
fi

# 清理临时文件
echo ""
echo "🧹 清理临时文件..."
rm -f hello hello.zip
if [ -f "/tmp/api_key.p8" ]; then
    rm -f /tmp/api_key.p8
fi

echo "✅ 测试完成"
