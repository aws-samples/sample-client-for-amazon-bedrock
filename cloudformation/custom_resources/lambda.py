
import os
import json
import boto3
import shutil
import base64
import logging
import mimetypes
import subprocess
import contextlib
from uuid import uuid4
from zipfile import ZipFile
from urllib.request import Request, urlopen, urlretrieve

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cloudfront = boto3.client('cloudfront')
s3c = boto3.client('s3')
s3r = boto3.resource('s3')
cognito = boto3.client('cognito-idp')

CFN_SUCCESS = "SUCCESS"
CFN_FAILED = "FAILED"

def handler(event, context):
    def cfn_error(message=None):
        logger.error("| cfn_error: %s" % message)
        cfn_send(event, context, CFN_FAILED, reason=message, physicalResourceId=event.get('PhysicalResourceId', None))

    def cfn_send(event, context, responseStatus, responseData={}, physicalResourceId=None, noEcho=False, reason=None):
        responseUrl = event['ResponseURL']
        
        responseBody = {}
        responseBody['Status'] = responseStatus
        responseBody['Reason'] = reason or ('See the details in CloudWatch Log Stream: ' + context.log_stream_name)
        responseBody['PhysicalResourceId'] = physicalResourceId or context.log_stream_name
        responseBody['StackId'] = event['StackId']
        responseBody['RequestId'] = event['RequestId']
        responseBody['LogicalResourceId'] = event['LogicalResourceId']
        responseBody['NoEcho'] = noEcho
        responseBody['Data'] = responseData
        
        body = json.dumps(responseBody)
        logger.info("| response body:\n" + body)

        headers = {
            'content-type' : '',
            'content-length' : str(len(body))
        }

        try:
            request = Request(responseUrl, method='PUT', data=bytes(body.encode('utf-8')), headers=headers)
            with contextlib.closing(urlopen(request)) as response:
                logger.info("| status code: " + response.reason)
        except Exception as e:
            logger.error("| unable to send response to CloudFormation")
            logger.exception(e)

    def cloudfront_invalidate(distribution_id):
        distribution_paths = ["/*"]
        invalidation_resp = cloudfront.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': len(distribution_paths),
                    'Items': distribution_paths
                },
                'CallerReference': str(uuid4()),
            })

        cloudfront.get_waiter('invalidation_completed').wait(
            DistributionId=distribution_id,
            Id=invalidation_resp['Invalidation']['Id'])

    def get_cognito_user_pool_application_authentication():
        response = cognito.describe_user_pool_client(
            UserPoolId=os.environ['CongitoUserPoolId'],
            ClientId=os.environ['CognitoUserPoolApplicationId']
        )

        data = os.environ['CognitoUserPoolApplicationId'] + ":" + response['UserPoolClient']['ClientSecret'];
       
        return base64.b64encode(bytes(data, 'utf-8')).decode("ascii")

    def clean_bucket(target_bucket_name):
        bucket = s3r.Bucket(target_bucket_name)

        bucket.objects.all().delete()

    def unzip(archive, contents_dir):
        with ZipFile(archive, "r") as zip:
            zip.extractall(contents_dir)

    def upload(target_bucket_name, contents_dir, parent_path):
        try:
            for path, subdirs, files in os.walk(contents_dir):
                for file in files:
                    dest_path = path.replace(contents_dir,"")
                    __s3file = os.path.normpath(dest_path + parent_path + '/' + file)[1:]
                    __local_file = os.path.join(path, file)
    
                    if os.path.isdir(file):
                        upload(target_bucket_name, file, __s3file)
                    else:
                        content_type = mimetypes.guess_type(__local_file)[0];
                            
                        if not content_type:
                            content_type = 'binary/octet-stream';
    
                        s3c.upload_file(__local_file, target_bucket_name, __s3file, ExtraArgs={'ContentType': content_type})
        except Exception as e:
            logger.error("| unable to upload file to s3")
            logger.exception(e)

    def deploy(br_client_download_url, target_bucket_name):
        temp_br_client_file = "/tmp/brclient.zip"
        contents_dir = "/tmp/brclient"

        if os.path.isdir(contents_dir):
            shutil.rmtree(contents_dir);

        os.mkdir(contents_dir)

        urlretrieve(br_client_download_url, temp_br_client_file)

        logger.info("download BRClient finished")

        unzip(temp_br_client_file, contents_dir)

        logger.info("unzip BRClient finished")

        cognito_user_pool_application_authentication = get_cognito_user_pool_application_authentication();

        with open(contents_dir + "/aws_cognito_configuration.json", "w") as aws_cognito_configuration_file:
            json.dump({
                "AWS_REGION": os.environ['AWS_REGION'],
                "COGNITO_IDENTITHY_POOL_ID": os.environ['CognitoIdentityPoolId'],
                "COGNITO_USER_POOL_ID": os.environ['CongitoUserPoolId'],
                "COGNITO_USER_POOL_CUSTOM_DOMAIN": os.environ['CognitoUserPoolCustomDomain'],
                "COGNITO_USER_POOL_APPLICATION_ID": os.environ['CognitoUserPoolApplicationId'],
                "COGNITO_USER_POOL_APPLICATION_AUTHENTICATION": cognito_user_pool_application_authentication
            }, aws_cognito_configuration_file)

        upload(target_bucket_name, contents_dir, '');

        logger.info("upload BRClient finished")


    logger.info({ key:value for (key, value) in event.items() if key != 'ResponseURL'})

    request_type = event['RequestType']
    physical_id = event.get('PhysicalResourceId', None)
    br_client_download_url = os.environ['BRClientDownloadUrl']
    target_bucket_name = os.environ['TargetBucketName']
    distribution_id = os.environ['DistributionId']

    try:
        if request_type == "Create":
            physical_id = "BRClientDeployment-%s" % str(uuid4())
        else:
            if not physical_id:
                cfn_error("invalid request: request type is '%s' but 'PhysicalResourceId' is not defined" % {request_type})
                return

        if request_type == "Delete" or request_type == "Update":
            clean_bucket(target_bucket_name)

        if request_type == "Update" or request_type == "Create":
            deploy(br_client_download_url, target_bucket_name)
            cloudfront_invalidate(distribution_id)

        cfn_send(event, context, CFN_SUCCESS, physicalResourceId=physical_id, responseData={
          'BRClientDownloadUrl': br_client_download_url,
        })
    except Exception as e:
        logger.error("| FAILED")
        logger.exception(e)
        cfn_error("failed, please check cloudwatch log")
    
      
