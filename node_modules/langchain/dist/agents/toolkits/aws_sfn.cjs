"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAWSSfnAgent = exports.SFN_SUFFIX = exports.SFN_PREFIX = exports.AWSSfnToolkit = void 0;
const aws_sfn_1 = require("@langchain/community/agents/toolkits/aws_sfn");
Object.defineProperty(exports, "AWSSfnToolkit", { enumerable: true, get: function () { return aws_sfn_1.AWSSfnToolkit; } });
const prompts_1 = require("@langchain/core/prompts");
const llm_chain_js_1 = require("../../chains/llm_chain.cjs");
const index_js_1 = require("../mrkl/index.cjs");
const executor_js_1 = require("../executor.cjs");
exports.SFN_PREFIX = `You are an agent designed to interact with AWS Step Functions state machines to execute and coordinate asynchronous workflows and tasks.
Given an input question, command, or task use the appropriate tool to execute a command to interact with AWS Step Functions and return the result.
You have access to tools for interacting with AWS Step Functions.
Given an input question, command, or task use the correct tool to complete the task.
Only use the below tools. Only use the information returned by the below tools to construct your final answer.

If the question does not seem related to AWS Step Functions or an existing state machine, just return "I don't know" as the answer.`;
exports.SFN_SUFFIX = `Begin!

Question: {input}
Thought: I should look at state machines within AWS Step Functions to see what actions I can perform.
{agent_scratchpad}`;
function createAWSSfnAgent(llm, toolkit, args) {
    const { prefix = exports.SFN_PREFIX, suffix = exports.SFN_SUFFIX, inputVariables = ["input", "agent_scratchpad"], } = args ?? {};
    const { tools } = toolkit;
    const formattedPrefix = (0, prompts_1.renderTemplate)(prefix, "f-string", {});
    const prompt = index_js_1.ZeroShotAgent.createPrompt(tools, {
        prefix: formattedPrefix,
        suffix,
        inputVariables,
    });
    const chain = new llm_chain_js_1.LLMChain({ prompt, llm });
    const agent = new index_js_1.ZeroShotAgent({
        llmChain: chain,
        allowedTools: tools.map((t) => t.name),
    });
    return executor_js_1.AgentExecutor.fromAgentAndTools({
        agent,
        tools,
        returnIntermediateSteps: true,
    });
}
exports.createAWSSfnAgent = createAWSSfnAgent;
