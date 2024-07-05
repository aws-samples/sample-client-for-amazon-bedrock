# NextChat

一个全新的[ChatGPT-Next-Web](https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web)移动APP客户端

使用教程：[NextChatApp使用教程](https://aithingdoc.apifox.cn/doc-4213180)

## Getting Started
### 安装
* **android**

    下载apk：https://github.com/jmgaooo/ChatGPT-Next-APP/releases
* **ios**

    需自己构建安装（ios环境未测试）

### 构建

*在安装好[flutter](https://flutter.dev/)开发环境的机器上执行*

克隆代码到本地：
        
    git clone https://github.com/jmgaooo/ChatGPT-Next-APP.git

打包android：

    flutter build apk --release

打包ios（需要MacOs）：

    flutter build ios --release

自定义web资源：

把web项目构建输出的静态资源打包成压缩包，命名为`web.zip`，放到项目`assets/web.zip`路径下。

    
