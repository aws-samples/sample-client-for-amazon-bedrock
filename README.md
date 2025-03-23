## Sample Client for Amazon Bedrock

<div align="center">

<h1 align="center">Sample Client for Amazon Bedrock</h1>

English / [简体中文](./README_CN.md)

It is a Bedrock client forked from https://github.com/Yidadaa/ChatGPT-Next-Web/

And it was simplified to support AWS Bedrock only.

</div>

## Important Notice:
```
This project is a sample project intended solely to showcase the process of building a chatting client that connects to LLM models like Claude3 on Bedrock. 

It is not a production-ready client, and it should not be used in a production environment without further development and testing.
```


## Installation:

Download the latest version following the links:

For Windows user, unzip the zip file and then double click the msi file to install.

For Mac user, unzip the zip file and then open the BRClient.app directly.

The Mac App files were signed by a community contributor for your convenience. The signer reserves all rights to the signature, and the signed files are not covered by the open-source licenses of this project.

## Download links:

### Windows:
https://github.com/aws-samples/sample-client-for-amazon-bedrock/releases/download/app-v1.2.6/Sample.Client.for.Amazon.Bedrock_1.2.6_x64-setup.exe

https://github.com/aws-samples/sample-client-for-amazon-bedrock/releases/download/app-v1.2.6/Sample.Client.for.Amazon.Bedrock_1.2.6_x64_en-US.msi.zip

### Mac M Series:
https://github.com/aws-samples/sample-client-for-amazon-bedrock/releases/download/app-v1.2.6/Sample.Client.for.Amazon.Bedrock_1.2.6_aarch64.dmg

### Mac x86 Series:
https://github.com/aws-samples/sample-client-for-amazon-bedrock/releases/download/app-v1.2.6/Sample.Client.for.Amazon.Bedrock_1.2.6_x64.dmg

### Linux:
https://github.com/aws-samples/sample-client-for-amazon-bedrock/releases/download/app-v1.2.6/sample-client-for-amazon-bedrock_1.2.6_amd64.AppImage.tar.gz

### Android:
https://github.com/aws-samples/sample-client-for-amazon-bedrock/releases/download/app-v1.2.6/app-release.apk

### iOS Debug:
TBC



After the client was launched, click the gear icon to config your AWS region and credentials. Then you are ready to go.

#### For Developer:


As the project is still in rapid itelating, we would like to suggest developers to build it their own version following the following steps:

1. git clone current project: `git clone https://github.com/aws-samples/sample-client-for-amazon-bedrock.git`
2. install yarn on your desktop
3. go to the project folder
4. run `yarn install` to install all the dependences of the project
5. run `yarn app:dev` to start a desktop app in developer mode.    or:   run `yarn dev` to start a local server and then access the app with browser.
6. Optional, if you want to run it as an app, run `yarn app:build` to build it, and the find the target file (we believe you can, :-)

#### IAM Permissions

To get started with BRClient, you must create an IAM user and generate Access Key/Secret Key. You have two options:

* Option 1: Use the Managed Policy (Quick Setup)
  - Go to Identity and Access Management (IAM) -> Users -> Create User
  - Set permissions -> Select "Attach policies directly"
  - Choose `AmazonBedrockFullAccess`
  - Click Next -> Create User

* Option 2: Set Least-Privilege Permissions
  - When setting permissions with IAM policies, grant only the permissions required to perform a task. This is known as least-privilege permissions. Here's an example of least-privilege IAM Permissions for BRClient:
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

For more details about Amazon Bedrock identity-based policy, please visit [Link](https://docs.aws.amazon.com/bedrock/latest/userguide/security_iam_id-based-policy-examples.html)


## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

