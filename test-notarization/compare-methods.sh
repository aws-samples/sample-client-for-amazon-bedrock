#!/bin/bash

echo "🔄 公证方式对比测试"
echo "==================="

# 配置
KEY_ID="8Z7VLMB36Y"
ISSUER_ID="7cc2e9f8-905a-44ec-a919-3981a92ed3f1"
API_KEY_PATH="/Users/qiangu/Downloads/AuthKey_8Z7VLMB36Y.p8"
SIGNING_IDENTITY="F767C95AD5F3FA36842955803DA80C95F592760A"

# 从 GitHub Secrets 获取 Apple ID 信息 (如果有的话)
# 这些需要你手动填入
APPLE_ID="your-apple-id@example.com"  # 替换为实际的 Apple ID
APPLE_PASSWORD="your-app-specific-password"  # 替换为实际的应用专用密码
APPLE_TEAM_ID="6993LHKRTB"  # 替换为实际的 Team ID

echo "📋 测试配置:"
echo "API Key ID: $KEY_ID"
echo "Issuer ID: $ISSUER_ID"
echo "Apple ID: $APPLE_ID"
echo "Team ID: $APPLE_TEAM_ID"
echo ""

# 编译测试应用
echo "🔨 准备测试应用..."
gcc -o hello hello.c
codesign --force --sign "$SIGNING_IDENTITY" --timestamp --options runtime hello

# 创建两个测试包
zip -q hello-api.zip hello
cp hello-api.zip hello-appleid.zip

echo "✅ 测试应用准备完成"
echo ""

# 测试 1: API 密钥方式
echo "🔑 测试 1: App Store Connect API 密钥方式"
echo "----------------------------------------"
echo "开始时间: $(date)"

API_START=$(date +%s)
API_OUTPUT=$(xcrun notarytool submit hello-api.zip \
    --key "$API_KEY_PATH" \
    --key-id "$KEY_ID" \
    --issuer "$ISSUER_ID" \
    --wait \
    --timeout 10m 2>&1)
API_END=$(date +%s)
API_DURATION=$((API_END - API_START))

echo "结束时间: $(date)"
echo "耗时: ${API_DURATION} 秒"

if echo "$API_OUTPUT" | grep -q "Successfully received submission info"; then
    echo "✅ API 密钥方式: 成功"
    API_RESULT="成功"
else
    echo "❌ API 密钥方式: 失败"
    API_RESULT="失败"
fi

echo ""
echo "详细输出:"
echo "$API_OUTPUT"
echo ""

# 测试 2: Apple ID 方式 (如果配置了的话)
if [ "$APPLE_ID" != "your-apple-id@example.com" ] && [ "$APPLE_PASSWORD" != "your-app-specific-password" ]; then
    echo "🍎 测试 2: Apple ID 方式"
    echo "----------------------"
    echo "开始时间: $(date)"
    
    APPLEID_START=$(date +%s)
    APPLEID_OUTPUT=$(xcrun notarytool submit hello-appleid.zip \
        --apple-id "$APPLE_ID" \
        --password "$APPLE_PASSWORD" \
        --team-id "$APPLE_TEAM_ID" \
        --wait \
        --timeout 10m 2>&1)
    APPLEID_END=$(date +%s)
    APPLEID_DURATION=$((APPLEID_END - APPLEID_START))
    
    echo "结束时间: $(date)"
    echo "耗时: ${APPLEID_DURATION} 秒"
    
    if echo "$APPLEID_OUTPUT" | grep -q "Successfully received submission info"; then
        echo "✅ Apple ID 方式: 成功"
        APPLEID_RESULT="成功"
    else
        echo "❌ Apple ID 方式: 失败"
        APPLEID_RESULT="失败"
    fi
    
    echo ""
    echo "详细输出:"
    echo "$APPLEID_OUTPUT"
    echo ""
else
    echo "⏭️ 跳过 Apple ID 测试 (未配置)"
    APPLEID_RESULT="未测试"
    APPLEID_DURATION="N/A"
fi

# 对比结果
echo "📊 对比结果"
echo "==========="
echo "┌─────────────────────┬──────────┬──────────┐"
echo "│ 方式                │ 结果     │ 耗时     │"
echo "├─────────────────────┼──────────┼──────────┤"
printf "│ %-19s │ %-8s │ %-8s │\n" "API 密钥" "$API_RESULT" "${API_DURATION}s"
printf "│ %-19s │ %-8s │ %-8s │\n" "Apple ID" "$APPLEID_RESULT" "${APPLEID_DURATION}s"
echo "└─────────────────────┴──────────┴──────────┘"

echo ""
echo "💡 结论:"
if [ "$API_RESULT" = "成功" ]; then
    echo "✅ API 密钥方式工作正常"
    if [ "$APPLEID_RESULT" = "成功" ]; then
        if [ "$API_DURATION" -lt "$APPLEID_DURATION" ]; then
            echo "🏆 API 密钥方式更快"
        else
            echo "🏆 Apple ID 方式更快"
        fi
    fi
else
    echo "❌ API 密钥方式有问题，需要检查配置"
fi

# 清理
rm -f hello hello-api.zip hello-appleid.zip

echo ""
echo "✅ 对比测试完成"
