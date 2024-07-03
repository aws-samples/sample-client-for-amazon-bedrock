/* eslint-disable no-process-env */
import { Client } from "../client.js";
import { test, expect } from "@jest/globals";
const serializedPrompt = `{"id":["langchain","prompts","prompt","PromptTemplate"],"lc":1,"type":"constructor","kwargs":{"template":"You are an assistant to a human, powered by a large language model trained by OpenAI.\\n\\nYou are designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, you are able to generate human-like text based on the input you receive, allowing you to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.\\n\\nYou are constantly learning and improving, and your capabilities are constantly evolving. You are able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. You have access to some personalized information provided by the human in the Context section below. Additionally, you are able to generate your own text based on the input you receive, allowing you to engage in discussions and provide explanations and descriptions on a wide range of topics.\\n\\nOverall, you are a powerful tool that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether the human needs help with a specific question or just wants to have a conversation about a particular topic, you are here to assist.\\n\\nContext:\\n{entities}\\n\\nCurrent conversation:\\n{history}\\nLast line:\\nHuman: {input}\\nYou:","input_variables":["entities","history","input"],"template_format":"f-string"}}`;
test("Test LangChain Hub client pushing a new repo", async () => {
    const client = new Client({
        apiUrl: "https://dev.api.hub.langchain.com",
    });
    const repoName = `eee/j${new Date().getTime()}`;
    const url = await client.push(repoName, serializedPrompt);
    console.log(url);
    const pulledPrompt = await client.pull(repoName);
    expect(serializedPrompt).toEqual(pulledPrompt);
});
test("Test LangChain Hub client can pull via commit hash", async () => {
    const client = new Client({
        apiUrl: "https://dev.api.hub.langchain.com",
    });
    const promptName = "pollytheparrot/test-commit-hash-123";
    const mostRecentPrompt = JSON.parse(await client.pull(promptName));
    expect(mostRecentPrompt.kwargs.input_variables).toEqual([
        "question",
        "second_var",
    ]);
    const commitHashV2 = "a1b95d73";
    const secondRecentPrompt = JSON.parse(await client.pull(`${promptName}:${commitHashV2}`));
    expect(secondRecentPrompt.kwargs.input_variables).toEqual(["question"]);
});
