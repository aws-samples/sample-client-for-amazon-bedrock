import type { BaseLanguageModelInterface } from "@langchain/core/language_models/base";
import { type AWSSfnToolkitArgs, AWSSfnToolkit } from "@langchain/community/agents/toolkits/aws_sfn";
import { ZeroShotCreatePromptArgs } from "../mrkl/index.js";
import { AgentExecutor } from "../executor.js";
export { AWSSfnToolkit, type AWSSfnToolkitArgs };
export declare const SFN_PREFIX = "You are an agent designed to interact with AWS Step Functions state machines to execute and coordinate asynchronous workflows and tasks.\nGiven an input question, command, or task use the appropriate tool to execute a command to interact with AWS Step Functions and return the result.\nYou have access to tools for interacting with AWS Step Functions.\nGiven an input question, command, or task use the correct tool to complete the task.\nOnly use the below tools. Only use the information returned by the below tools to construct your final answer.\n\nIf the question does not seem related to AWS Step Functions or an existing state machine, just return \"I don't know\" as the answer.";
export declare const SFN_SUFFIX = "Begin!\n\nQuestion: {input}\nThought: I should look at state machines within AWS Step Functions to see what actions I can perform.\n{agent_scratchpad}";
export interface AWSSfnCreatePromptArgs extends ZeroShotCreatePromptArgs {
}
export declare function createAWSSfnAgent(llm: BaseLanguageModelInterface, toolkit: AWSSfnToolkit, args?: AWSSfnCreatePromptArgs): AgentExecutor;
