import { ToolInterface } from "@langchain/core/tools";
import { Toolkit } from "../base.js";
import { ConneryService } from "../../../tools/connery.js";
/**
 * ConneryToolkit provides access to all the available actions from the Connery Runner.
 * @extends Toolkit
 */
export declare class ConneryToolkit extends Toolkit {
    tools: ToolInterface[];
    /**
     * Creates a ConneryToolkit instance based on the provided ConneryService instance.
     * It populates the tools property of the ConneryToolkit instance with the list of
     * available tools from the Connery Runner.
     * @param conneryService The ConneryService instance.
     * @returns A Promise that resolves to a ConneryToolkit instance.
     */
    static createInstance(conneryService: ConneryService): Promise<ConneryToolkit>;
}
