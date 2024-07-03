## AWS CRT JS

NodeJS/Browser bindings for the AWS Common Runtime

[API Docs](https://awslabs.github.io/aws-crt-nodejs/)

## License

This library is licensed under the Apache 2.0 License.

## Building the package

### Prereqs:
* Node 14+
* npm
* CMake 3.1+
* Linux: gcc 5+ or clang 3.6+
    * If your compiler can compile node, it can compile this library
* Windows: Visual Studio 2015+
* OSX: XCode or brew-installed llvm

To build the package locally
```bash
git clone https://github.com/awslabs/aws-crt-nodejs.git
cd aws-crt-nodejs
git submodule update --init
npm install
```

## Using From Your NodeJS Application

Normally, you just declare `aws-crt` as a dependency in your package.json file.

## Using From Your Browser Application

You can either add it to package.json (if using a tool like webpack), or just import the ```dist.browser/``` folder into your web project

### Installing from npm

```bash
npm install aws-crt
```

To reduce the size of package, we put the C source code in the S3 bucket. If the platform you are using doesn't have the prebuilt binary, the install script will pull the source from S3 bucket. In case of no public internet access, you can specify the "CRT_BINARY_HOST" environment variable for the host of the source code. The build script will fetch source code from that host instead. To fetch the source from S3, you can reach to the cloudfront distribution (Only works for version after v1.9.2) `https://d332vdhbectycy.cloudfront.net/aws-crt-<version>-source.tgz`, the sha256 checksum `https://d332vdhbectycy.cloudfront.net/aws-crt-<version>-source.sha256`

### Debug C part of code

After building the package locally, use ```node ./scripts/build.js --debug``` to enable debug. Then, attach any C debugger to use node to run `jest`

## Mac-Only TLS Behavior

Please note that on Mac, once a private key is used with a certificate, that certificate-key pair is imported into the Mac Keychain.  All subsequent uses of that certificate will use the stored private key and ignore anything passed in programmatically.  Beginning in v1.1.11, when a stored private key from the Keychain is used, the following will be logged at the "info" log level:

```
static: certificate has an existing certificate-key pair that was previously imported into the Keychain.  Using key from Keychain instead of the one provided.
```
