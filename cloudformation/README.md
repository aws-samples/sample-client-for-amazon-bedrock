# Web Sample Client for Bedrock

Deploy your Sample Client for Bedrock on AWS using cloudformation.

## Deployment

Only supports regions where Amazon Bedrock is available (such as `us-west-2`). The deployment will take approximately **3-5 minutes** 🕒.

**Step 1: Deploy the CloudFormation stack**

1. Sign in to AWS Management Console, switch to the region to deploy the CloudFormation Stack to.
2. Click the following button to launch the CloudFormation Stack in that region. Choose one of the following:
   - **Web + AK + SK**

     [![Launch Stack](../assets/launch-stack.png)](https://console.aws.amazon.com/cloudformation/home#/stacks/create/template?stackName=SampleClientForBedrockWeb&templateURL=https://sample-client-for-bedrock-clouformation.s3.us-west-2.amazonaws.com/BRClientWebDeploy.json)

   - **Web + Cognito**  (Special thanks to [@maxjiang153](https://github.com/maxjiang153) contribution!!)

     [![Launch Stack](../assets/launch-stack.png)](https://console.aws.amazon.com/cloudformation/home#/stacks/create/template?stackName=SampleClientForBedrockWeb&templateURL=https://sample-client-for-bedrock-clouformation.s3.us-west-2.amazonaws.com/BRClientWebDeployCognito.json)

   - **Web + BRConnector**

     [![Launch Stack](../assets/launch-stack.png)](https://console.aws.amazon.com/cloudformation/home#/stacks/create/template?stackName=SampleClientForBedrockBRConnector&templateURL=https://sample-client-for-bedrock-clouformation.s3.us-west-2.amazonaws.com/quick-build-brconnector.yaml)
