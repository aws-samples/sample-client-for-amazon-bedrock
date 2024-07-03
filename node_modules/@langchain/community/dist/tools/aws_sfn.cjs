"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendTaskSuccessAWSSfnTool = exports.DescribeExecutionAWSSfnTool = exports.StartExecutionAWSSfnTool = void 0;
const client_sfn_1 = require("@aws-sdk/client-sfn");
const tools_1 = require("@langchain/core/tools");
/**
 * Class for starting the execution of an AWS Step Function.
 */
class StartExecutionAWSSfnTool extends tools_1.Tool {
    static lc_name() {
        return "StartExecutionAWSSfnTool";
    }
    constructor({ name, description, ...rest }) {
        super();
        Object.defineProperty(this, "sfnConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = name;
        this.description = description;
        this.sfnConfig = rest;
    }
    /**
     * Generates a formatted description for the StartExecutionAWSSfnTool.
     * @param name Name of the state machine.
     * @param description Description of the state machine.
     * @returns A formatted description string.
     */
    static formatDescription(name, description) {
        return `Use to start executing the ${name} state machine. Use to run ${name} workflows. Whenever you need to start (or execute) an asynchronous workflow (or state machine) about ${description} you should ALWAYS use this. Input should be a valid JSON string.`;
    }
    /** @ignore */
    async _call(input) {
        const clientConstructorArgs = getClientConstructorArgs(this.sfnConfig);
        const sfnClient = new client_sfn_1.SFNClient(clientConstructorArgs);
        return new Promise((resolve) => {
            let payload;
            try {
                payload = JSON.parse(input);
            }
            catch (e) {
                console.error("Error starting state machine execution:", e);
                resolve("failed to complete request");
            }
            const command = new client_sfn_1.StartExecutionCommand({
                stateMachineArn: this.sfnConfig.stateMachineArn,
                input: JSON.stringify(payload),
            });
            sfnClient
                .send(command)
                .then((response) => resolve(response.executionArn ? response.executionArn : "request completed."))
                .catch((error) => {
                console.error("Error starting state machine execution:", error);
                resolve("failed to complete request");
            });
        });
    }
}
exports.StartExecutionAWSSfnTool = StartExecutionAWSSfnTool;
/**
 * Class for checking the status of an AWS Step Function execution.
 */
class DescribeExecutionAWSSfnTool extends tools_1.Tool {
    static lc_name() {
        return "DescribeExecutionAWSSfnTool";
    }
    constructor(config) {
        super(config);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "describe-execution-aws-sfn"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "This tool should ALWAYS be used for checking the status of any AWS Step Function execution (aka. state machine execution). Input to this tool is a properly formatted AWS Step Function Execution ARN (executionArn). The output is a stringified JSON object containing the executionArn, name, status, startDate, stopDate, input, output, error, and cause of the execution."
        });
        Object.defineProperty(this, "sfnConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.sfnConfig = config;
    }
    /** @ignore */
    async _call(input) {
        const clientConstructorArgs = getClientConstructorArgs(this.sfnConfig);
        const sfnClient = new client_sfn_1.SFNClient(clientConstructorArgs);
        const command = new client_sfn_1.DescribeExecutionCommand({
            executionArn: input,
        });
        return await sfnClient
            .send(command)
            .then((response) => response.executionArn
            ? JSON.stringify({
                executionArn: response.executionArn,
                name: response.name,
                status: response.status,
                startDate: response.startDate,
                stopDate: response.stopDate,
                input: response.input,
                output: response.output,
                error: response.error,
                cause: response.cause,
            })
            : "{}")
            .catch((error) => {
            console.error("Error describing state machine execution:", error);
            return "failed to complete request";
        });
    }
}
exports.DescribeExecutionAWSSfnTool = DescribeExecutionAWSSfnTool;
/**
 * Class for sending a task success signal to an AWS Step Function
 * execution.
 */
class SendTaskSuccessAWSSfnTool extends tools_1.Tool {
    static lc_name() {
        return "SendTaskSuccessAWSSfnTool";
    }
    constructor(config) {
        super(config);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "send-task-success-aws-sfn"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "This tool should ALWAYS be used for sending task success to an AWS Step Function execution (aka. statemachine exeuction). Input to this tool is a stringify JSON object containing the taskToken and output."
        });
        Object.defineProperty(this, "sfnConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.sfnConfig = config;
    }
    /** @ignore */
    async _call(input) {
        const clientConstructorArgs = getClientConstructorArgs(this.sfnConfig);
        const sfnClient = new client_sfn_1.SFNClient(clientConstructorArgs);
        let payload;
        try {
            payload = JSON.parse(input);
        }
        catch (e) {
            console.error("Error starting state machine execution:", e);
            return "failed to complete request";
        }
        const command = new client_sfn_1.SendTaskSuccessCommand({
            taskToken: payload.taskToken,
            output: JSON.stringify(payload.output),
        });
        return await sfnClient
            .send(command)
            .then(() => "request completed.")
            .catch((error) => {
            console.error("Error sending task success to state machine execution:", error);
            return "failed to complete request";
        });
    }
}
exports.SendTaskSuccessAWSSfnTool = SendTaskSuccessAWSSfnTool;
/**
 * Helper function to construct the AWS SFN client.
 */
function getClientConstructorArgs(config) {
    const clientConstructorArgs = {};
    if (config.region) {
        clientConstructorArgs.region = config.region;
    }
    if (config.accessKeyId && config.secretAccessKey) {
        clientConstructorArgs.credentials = {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        };
    }
    return clientConstructorArgs;
}
