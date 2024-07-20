import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

const AWS_COGNITO_TOKEN_EXPIRATION_LOCAL_STORE_KET = "AWS_COGNITO_TOKEN_EXPIRATION";
const AWS_COGNITO_AKSK_EXPIRATION_LOCAL_STORE_KET = "AWS_COGNITO_AKSK_EXPIRATION";
const AWS_COGNITO_ACCESS_TOKEN_LOCAL_STORE_KET = "AWS_COGNITO_ACCESS_TOKEN_LOCAL_STORE_KET";
const AWS_COGNITO_ID_TOKEN_LOCAL_STORE_KET = "AWS_COGNITO_ID_TOKEN_LOCAL_STORE_KET";
const AWS_COGNITO_REFRESH_TOKEN_LOCAL_STORE_KET = "AWS_COGNITO_REFRESH_TOKEN_LOCAL_STORE_KET";

let configuration: any;

function isValidCognitoConfig(config: any): boolean {
  const requiredFields = [
    'COGNITO_USER_POOL_ID',
    'COGNITO_USER_POOL_APPLICATION_ID',
    'COGNITO_USER_POOL_CUSTOM_DOMAIN',
    'COGNITO_IDENTITHY_POOL_ID',
    'AWS_REGION'
  ];

  for (const field of requiredFields) {
    if (!(field in config) || !config[field]) {
      console.warn(`Missing or invalid field in Cognito configuration: ${field}`);
      return false;
    }
  }

  return true;
}

async function validateAWSCongnito(accessStore: any): Promise<boolean> {
  console.log("validateAWSCongnito called");
  try {
    const response = await fetch("/aws_cognito_configuration.json");
    console.log("Fetch response status:", response.status);
    
    if (!response.ok) {
      console.warn(`Failed to fetch Cognito configuration. Status: ${response.status}`);
      return false;
    }

    const cognitoConfiguration = await response.json();
    console.log("Cognito configuration loaded:", cognitoConfiguration);

    if (!isValidCognitoConfig(cognitoConfiguration)) {
      console.warn("Invalid Cognito configuration");
      return false;
    }

    configuration = cognitoConfiguration;

    const validationResult = await validateAWSCongnitoExpriationStatus();
    
    if (validationResult.credential) {
      const credential = validationResult.credential;
      accessStore.update((access: any) => {
        access.awsRegion = credential.awsRegion;
        access.awsAccessKeyId = credential.awsAccessKeyId;
        access.awsSecretAccessKey = credential.awsSecretAccessKey;
        access.awsSessionToken = credential.awsSessionToken;
        access.awsCognitoUser = true;
      });

      return false; // Validation successful, no need to keep loading
    }

    return validationResult.keepLoading;
  } catch (error) {
    console.error("Error in validateAWSCongnito:", error);
    return false; // Return false on any error to prevent getting stuck
  }
}

async function validateAWSCongnitoExpriationStatus(): Promise<any> {
  if (isCognitoTokenExpiration()) {
    console.log("cognito token expriation try cognito authentication.");
    return cognitoAuthentication();
  } else {
    if (isCognitoAKSKExpiration()) {
      console.log("cognito aksk expired, refresh cognito identity");
      return refreshCognitoIdentity();
    } else {
      return {
        keepLoading: false,
      };
    }
  }
}

async function cognitoAuthentication() {
  const refreshToken = getCognitoRefreshToken();
  if (refreshToken) {
    console.log("cognito try using refresh token");
    return refreshCognitoAuthentication(refreshToken);
  }

  const cognitoAuthenticationCode = getCognitoAuthenticationCode();

  if (cognitoAuthenticationCode) {
    return validateCognitoAuthenticationCode(cognitoAuthenticationCode);
  } else {
    redirectCognitoLoginPage();
    return {
      keepLoading: true,
    };
  }
}

function getCognitoAuthenticationCode() {
  return new URLSearchParams(window.location.search).get("code");
}

function redirectCognitoLoginPage() {
  window.location.replace(
    `${configuration.COGNITO_USER_POOL_CUSTOM_DOMAIN}/oauth2/authorize?client_id=${configuration.COGNITO_USER_POOL_APPLICATION_ID}&response_type=code&scope=aws.cognito.signin.user.admin+openid+profile&redirect_uri=${window.location.origin}`
  );
}

async function validateCognitoAuthenticationCode(cognitoAuthenticationCode: any) {
  return getAWSCognitoTokenData({
    cognitoCode: cognitoAuthenticationCode,
  }).then(async (data) => {
    if (!data) {
      cleanLocalCognitoTokens();
      redirectCognitoLoginPage();
      return {
        keepLoading: true,
      };
    }

    setCognitoAccessToken(data.access_token);
    setCognitoIdToken(data.id_token);
    if (data.refresh_token) {
      setCognitoRefreshToken(data.refresh_token);
    }

    setCognitoTokenExpiration(
      new Date().getTime() + Number(data.expires_in) * 1000
    );

    return refreshCognitoIdentity();
  });
}

async function refreshCognitoAuthentication(refreshToken: any): Promise<any> {
  return getAWSCognitoTokenData({
    refreshToken,
  }).then(async (data) => {
    if (!data) {
      cleanLocalCognitoTokens();
      redirectCognitoLoginPage();
      return {
        keepLoading: true,
      };
    }

    setCognitoAccessToken(data.access_token);
    setCognitoIdToken(data.id_token);
    if (data.refresh_token) {
      setCognitoRefreshToken(data.refresh_token);
    }

    setCognitoTokenExpiration(
      new Date().getTime() + Number(data.expires_in) * 1000
    );

    return refreshCognitoIdentity();
  });
}

async function refreshCognitoIdentity() {
  const idToken = getCognitoIdToken();

  return fromCognitoIdentityPool({
    clientConfig: { region: configuration.AWS_REGION },
    logins: {
      [`cognito-idp.${configuration.AWS_REGION}.amazonaws.com/${configuration.COGNITO_USER_POOL_ID}`]: idToken,
    },
    identityPoolId: configuration.COGNITO_IDENTITHY_POOL_ID,
  })().then((credential) => {
    setCognitoAKSKExpiration(credential.expiration?.getTime());

    return {
      keepLoading: false,
      credential: {
        awsRegion: configuration.AWS_REGION,
        awsAccessKeyId: credential.accessKeyId,
        awsSecretAccessKey: credential.secretAccessKey,
        awsSessionToken: credential.sessionToken,
      },
    };
  });
}

async function getAWSCognitoTokenData(data: any): Promise<any> {
  return fetch(
    `${configuration.COGNITO_USER_POOL_CUSTOM_DOMAIN}/oauth2/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${configuration.COGNITO_USER_POOL_APPLICATION_AUTHENTICATION}`,
      },
      body: new URLSearchParams({
        grant_type: data.cognitoCode ? "authorization_code" : "refresh_token",
        code: data.cognitoCode || "",
        refresh_token: data.refreshToken || "",
        redirect_uri: window.location.origin,
      }),
    }
  ).then((res) => {
    if (res.status != 200) {
      return;
    }
    return res.json();
  });
}

function setCognitoAKSKExpiration(expiration: any) {
  localStorage.setItem(AWS_COGNITO_AKSK_EXPIRATION_LOCAL_STORE_KET, expiration);
}

function isCognitoAKSKExpiration(): boolean {
  const value = localStorage.getItem(AWS_COGNITO_AKSK_EXPIRATION_LOCAL_STORE_KET);
  if (!value) {
    return true;
  }
  return new Date().getTime() > Number(value);
}

function setCognitoTokenExpiration(expiration: any) {
  localStorage.setItem(AWS_COGNITO_TOKEN_EXPIRATION_LOCAL_STORE_KET, expiration);
}

function isCognitoTokenExpiration(): boolean {
  const value = localStorage.getItem(AWS_COGNITO_TOKEN_EXPIRATION_LOCAL_STORE_KET);
  if (!value) {
    return true;
  }
  return new Date().getTime() > Number(value);
}

function setCognitoAccessToken(accessToken: any) {
  localStorage.setItem(AWS_COGNITO_ACCESS_TOKEN_LOCAL_STORE_KET, accessToken);
}

function getCognitoAccessToken() {
  return localStorage.getItem(AWS_COGNITO_ACCESS_TOKEN_LOCAL_STORE_KET);
}

function setCognitoIdToken(idToken: any) {
  localStorage.setItem(AWS_COGNITO_ID_TOKEN_LOCAL_STORE_KET, idToken);
}

function getCognitoIdToken(): string {
  return localStorage.getItem(AWS_COGNITO_ID_TOKEN_LOCAL_STORE_KET) || "";
}

function setCognitoRefreshToken(refreshToken: any) {
  localStorage.setItem(AWS_COGNITO_REFRESH_TOKEN_LOCAL_STORE_KET, refreshToken);
}

function getCognitoRefreshToken(): string {
  return localStorage.getItem(AWS_COGNITO_REFRESH_TOKEN_LOCAL_STORE_KET) || "";
}

function cleanLocalCognitoTokens() {
  localStorage.removeItem(AWS_COGNITO_REFRESH_TOKEN_LOCAL_STORE_KET);
  localStorage.removeItem(AWS_COGNITO_ID_TOKEN_LOCAL_STORE_KET);
  localStorage.removeItem(AWS_COGNITO_ACCESS_TOKEN_LOCAL_STORE_KET);
}

async function getAWSCognitoUserInfo(): Promise<any> {
  return fetch(
    `${configuration.COGNITO_USER_POOL_CUSTOM_DOMAIN}/oauth2/userInfo`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        Authorization: `Bearer ${getCognitoAccessToken()}`,
      },
    }
  ).then((res) => {
    if (res.status != 200) {
      redirectCognitoLoginPage();
      return;
    }

    return res.json();
  });
}

export {
  validateAWSCongnito,
  getCognitoRefreshToken,
  refreshCognitoAuthentication,
  isCognitoAKSKExpiration,
  redirectCognitoLoginPage,
  getAWSCognitoUserInfo,
};