#!/bin/bash

# 添加参数处理
BEDROCK_ENDPOINT=""

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --endpoint)
      BEDROCK_ENDPOINT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# 如果没有通过参数指定 endpoint，尝试从 .env.local 读取
if [ -z "$BEDROCK_ENDPOINT" ] && [ -f ".env.local" ]; then
  # 从 .env.local 文件中读取 NEXT_PUBLIC_BEDROCK_ENDPOINT
  BEDROCK_ENDPOINT=$(grep NEXT_PUBLIC_BEDROCK_ENDPOINT .env.local | cut -d '=' -f2)
fi

# 如果仍然没有 endpoint，使用默认值
if [ -z "$BEDROCK_ENDPOINT" ]; then
  BEDROCK_ENDPOINT=""
fi

# 设置环境变量
export NEXT_PUBLIC_BEDROCK_ENDPOINT="$BEDROCK_ENDPOINT"
echo "Using Bedrock endpoint: $NEXT_PUBLIC_BEDROCK_ENDPOINT"

# 执行构建命令
echo "Running yarn build..."
yarn build

echo "Running yarn export..."
yarn export

# 检查 yarn export 是否成功
if [ $? -eq 0 ]; then
    echo "yarn export completed successfully."
    
    # 创建 zip 文件
    echo "Creating zip file..."
    cd out
    zip -r ../brclient-web.zip *
    cd ..
    
    if [ $? -eq 0 ]; then
        echo "Zip file created successfully: brclient-web.zip"
    else
        echo "Error: Failed to create zip file."
        exit 1
    fi
else
    echo "Error: yarn export failed."
    exit 1
fi

echo "Script completed."

