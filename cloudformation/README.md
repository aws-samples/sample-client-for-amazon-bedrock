### Deployment

Only supports regions where Amazon Bedrock is available (such as `us-west-2`). The deployment will take approximately **3-5 minutes** 🕒.

**Step 2: Deploy the CloudFormation stack**

1. Sign in to AWS Management Console, switch to the region to deploy the CloudFormation Stack to.
2. Click the following button to launch the CloudFormation Stack in that region. Choose one of the following:
   - **WEB + AK + SK**

      [![Launch Stack](assets/launch-stack.png)](https://console.aws.amazon.com/cloudformation/home#/stacks/create/template?stackName=BedrockSampleClientWeb&templateURL=https://raw.githubusercontent.com/aws-samples/sample-client-for-amazon-bedrock/main/cloudformation/BRClientWebDeploy.json)

   - **WEB + Cognito**

     Coming Soon...

   - **WEB + BRConnector**

     Coming Soon...