## Sample Client for Amazon Bedrock



<div align="center">
<h1 align="center">Sample Client for Amazon Bedrock</h1>

本项目由 https://github.com/Yidadaa/ChatGPT-Next-Web/ 分支而来，做简化后单纯支持AWS Bedrock

打开程序以后在“配置”界面配置AWS Region, AK/SK 就可以开始使用。

</div>

## 重要的注意事项:
```
本项目是个样例项目，单纯用于展示如何构建一个连接Bedrock大语言模型的客户端。

本项目并不是为生产环境准备的，请不要直接在生产环境使用。
```


## 安装使用：

根据你的电脑情况下载对应的链接:

Windows用户解压下载的zip文件后点击msi文件进行安装。

Mac用户解压下载的zip文件后直接打开 BRClient.app 使用。
项目中附加的Mac app文件由开源社区贡献者签名，仅为了方便测试，签名者保留一切和该签名有关的权利，被签名的文件也不在本项目开源协议覆盖范围中。

Download links:

Windows:
coming soon！

Mac M 系列:
coming soon！

Mac x86 系列:
coming soon！

iOS 系列:

coming soon！


打开程序以后在“配置”界面配置AWS Region, AK/SK 就可以开始使用。

#### 开发者

目前项目还在快速开发阶段，所以建议使用开发者模式:

1. 使用git克隆当前项目: `git clone https://github.com/aws-samples/sample-client-for-amazon-bedrock.git`
2. 安装yarn
3. 进入项目文件夹
4. 运行 `yarn install`安装依赖包
5. 运行 `yarn app:dev`命令启动应用，或者:   运行 `yarn dev` 启动浏览器模式，通过localhost:3000访问
6. （可选），如果你想构建自己的单独应用，可以运行 `yarn app:build`执行打包命令，然后去找一下打包出来的程序，都是开发者了，相信你可以找到。

#### IAM 权限

要开始使用 BRClient,您必须创建一个 IAM 用户并生成 Access Key/Secret Key。您有两个选择:

* 选项 1:使用托管策略(快速设置)
  - 转到身份和访问管理(IAM) -> 用户 -> 创建用户
  - 设置权限 -> 选择"直接附加策略"
  - 选择 `AmazonBedrockFullAccess`
  - 单击下一步 -> 创建用户

* 选项 2:设置最小权限
  - 在使用 IAM 策略设置权限时,只授予执行任务所需的权限, 这称为最小权限。以下是 BRClient 最小 IAM 权限的示例:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LeastPrivilege4BRClient",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    }
  ]
}
```

有关 Amazon Bedrock 基于身份的策略的更多详细信息,请访问[链接](https://docs.aws.amazon.com/bedrock/latest/userguide/security_iam_id-based-policy-examples.html)。


## 安全

如果您发现本项目任何关于安全的问题，请参考 [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) 中的说明进行处理.

## 开源协议

本项目使用 MIT-0 开源协议. 请阅读 LICENSE 文件.

