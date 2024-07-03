"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWSSfnToolkit = void 0;
const aws_sfn_js_1 = require("../../tools/aws_sfn.cjs");
const base_js_1 = require("./base.cjs");
/**
 * Class representing a toolkit for interacting with AWS Step Functions.
 * It initializes the AWS Step Functions tools and provides them as tools
 * for the agent.
 * @example
 * ```typescript
 *
 * const toolkit = new AWSSfnToolkit({
 *   name: "onboard-new-client-workflow",
 *   description:
 *     "Onboard new client workflow. Can also be used to get status of any executing workflow or state machine.",
 *   stateMachineArn:
 *     "arn:aws:states:us-east-1:1234567890:stateMachine:my-state-machine",
 *   region: "<your Sfn's region>",
 *   accessKeyId: "<your access key id>",
 *   secretAccessKey: "<your secret access key>",
 * });
 *
 *
 * const result = await toolkit.invoke({
 *   input: "Onboard john doe (john@example.com) as a new client.",
 * });
 *
 * ```
 */
class AWSSfnToolkit extends base_js_1.Toolkit {
    constructor(args) {
        super();
        Object.defineProperty(this, "tools", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stateMachineArn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "asl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.stateMachineArn = args.stateMachineArn;
        if (args.asl) {
            this.asl = args.asl;
        }
        this.tools = [
            new aws_sfn_js_1.StartExecutionAWSSfnTool({
                name: args.name,
                description: aws_sfn_js_1.StartExecutionAWSSfnTool.formatDescription(args.name, args.description),
                stateMachineArn: args.stateMachineArn,
            }),
            new aws_sfn_js_1.DescribeExecutionAWSSfnTool(Object.assign(args.region ? { region: args.region } : {}, args.accessKeyId && args.secretAccessKey
                ? {
                    accessKeyId: args.accessKeyId,
                    secretAccessKey: args.secretAccessKey,
                }
                : {})),
            new aws_sfn_js_1.SendTaskSuccessAWSSfnTool(Object.assign(args.region ? { region: args.region } : {}, args.accessKeyId && args.secretAccessKey
                ? {
                    accessKeyId: args.accessKeyId,
                    secretAccessKey: args.secretAccessKey,
                }
                : {})),
        ];
    }
}
exports.AWSSfnToolkit = AWSSfnToolkit;
