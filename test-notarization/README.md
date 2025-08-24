# macOS 公证测试工具

这个测试工具可以帮你快速验证 macOS 公证配置是否正确，而不需要等待完整的应用构建。

## 📁 文件说明

- `hello.c` - 简单的 C 程序，用于测试
- `test-notarization.sh` - 完整的公证测试脚本
- `quick-test.sh` - 快速测试脚本 (5分钟超时)
- `compare-methods.sh` - 对比 API 密钥和 Apple ID 两种方式

## 🚀 快速开始

### 1. 快速测试 (推荐)

```bash
cd test-notarization
./quick-test.sh
```

这会：
- 编译简单的测试应用
- 使用你的证书进行代码签名
- 使用 API 密钥提交公证
- 等待最多 5 分钟

### 2. 完整测试

```bash
cd test-notarization
./test-notarization.sh
```

包含更详细的检查和错误处理。

### 3. 对比测试

```bash
cd test-notarization
# 先编辑 compare-methods.sh，填入你的 Apple ID 信息
./compare-methods.sh
```

同时测试 API 密钥和 Apple ID 两种方式，对比性能。

## 📋 预期结果

### ✅ 成功的输出示例：
```
🚀 提交公证 (5分钟超时)...
开始时间: Sat Aug 24 00:15:00 UTC 2025
Successfully received submission info
  id: 12345678-1234-1234-1234-123456789012
  Upload progress: 100.00% (1.2 KB of 1.2 KB)
  Successfully uploaded file
  id: 12345678-1234-1234-1234-123456789012
  path: /path/to/hello.zip
  Waiting for processing to complete.
  Current status: Accepted........
  Processing complete
    id: 12345678-1234-1234-1234-123456789012
    status: Accepted
结束时间: Sat Aug 24 00:16:30 UTC 2025
```

### ❌ 失败的输出示例：
```
Error: HTTP status code: 401. Unauthorized. You must first sign in. (1194)
```

## 🔧 故障排除

### 常见错误：

1. **401 Unauthorized**
   - 检查 API 密钥文件路径
   - 确认 Key ID 和 Issuer ID 正确

2. **签名失败**
   - 检查证书是否在钥匙串中
   - 确认签名身份哈希值正确

3. **网络超时**
   - 检查网络连接
   - 可能是 Apple 服务繁忙，稍后重试

## 💡 使用建议

1. **先运行快速测试** - 验证基本配置
2. **如果失败** - 运行完整测试查看详细错误
3. **如果成功** - 说明你的 API 密钥配置正确
4. **对比测试** - 了解不同方式的性能差异

## 🎯 测试目标

- ✅ 验证 API 密钥配置正确
- ✅ 确认公证流程正常
- ✅ 测试公证速度
- ✅ 对比不同认证方式

成功的测试意味着你的大型应用构建也应该能正常完成公证！
