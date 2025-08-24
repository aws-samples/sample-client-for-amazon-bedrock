#!/bin/bash

echo "⚡ 快速公证测试"
echo "==============="

# 使用已知的配置
KEY_ID="8Z7VLMB36Y"
ISSUER_ID="7cc2e9f8-905a-44ec-a919-3981a92ed3f1"
API_KEY_PATH="/Users/qiangu/Downloads/AuthKey_8Z7VLMB36Y.p8"
SIGNING_IDENTITY="F767C95AD5F3FA36842955803DA80C95F592760A"

# 检查文件
if [ ! -f "$API_KEY_PATH" ]; then
    echo "❌ API 密钥文件不存在: $API_KEY_PATH"
    exit 1
fi

# 编译简单应用
echo "🔨 编译测试应用..."
gcc -o hello hello.c

# 代码签名
echo "✍️ 代码签名..."
codesign --force --sign "$SIGNING_IDENTITY" --timestamp --options runtime hello

# 创建 ZIP
echo "📦 创建公证包..."
zip -q hello.zip hello

# 提交公证 (5分钟超时)
echo "🚀 提交公证 (5分钟超时)..."
echo "开始时间: $(date)"

xcrun notarytool submit hello.zip \
    --key "$API_KEY_PATH" \
    --key-id "$KEY_ID" \
    --issuer "$ISSUER_ID" \
    --wait \
    --timeout 5m

echo "结束时间: $(date)"

# 清理
rm -f hello hello.zip

echo "✅ 快速测试完成"
