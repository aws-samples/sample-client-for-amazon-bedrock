

interface ToolsPayload {
  tools: any;
}

export class SystemPromptGenerator {
  private template: string;
  private defaultUserSystemPrompt: string;
  private defaultToolConfig: string;

  constructor() {
    this.template = `
      In this environment you have access to a set of tools you can use to answer the user's question.
      {{ FORMATTING INSTRUCTIONS }}
      String and scalar parameters should be specified as is, while lists and objects should use JSON format. Note that spaces for string values are not stripped. The output is not expected to be valid XML and is parsed with regular expressions.
      Here are the functions available in JSONSchema format:
      {{ TOOL DEFINITIONS IN JSON SCHEMA }}
      {{ USER SYSTEM PROMPT }}
      {{ TOOL CONFIGURATION }}
    `;
    this.defaultUserSystemPrompt = "You are an intelligent assistant capable of using tools to solve user queries effectively.";
    this.defaultToolConfig = "No additional configuration is required.";
  }

  generatePrompt(
    tools: any,
    userSystemPrompt?: string,
    toolConfig?: string
  ): string {
    // Set default values if not provided
    const finalUserPrompt = userSystemPrompt || this.defaultUserSystemPrompt;
    const finalToolConfig = toolConfig || this.defaultToolConfig;

    // Convert tools to JSON string with indentation
    const toolsJsonSchema = JSON.stringify(tools, null, 2);

    // Perform template replacements
    let prompt = this.template
      .replace("{{ TOOL DEFINITIONS IN JSON SCHEMA }}", toolsJsonSchema)
      .replace("{{ FORMATTING INSTRUCTIONS }}", "")
      .replace("{{ USER SYSTEM PROMPT }}", finalUserPrompt)
      .replace("{{ TOOL CONFIGURATION }}", finalToolConfig);

    return prompt;
  }
}
