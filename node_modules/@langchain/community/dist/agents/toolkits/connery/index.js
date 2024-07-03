import { Toolkit } from "../base.js";
/**
 * ConneryToolkit provides access to all the available actions from the Connery Runner.
 * @extends Toolkit
 */
export class ConneryToolkit extends Toolkit {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "tools", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    /**
     * Creates a ConneryToolkit instance based on the provided ConneryService instance.
     * It populates the tools property of the ConneryToolkit instance with the list of
     * available tools from the Connery Runner.
     * @param conneryService The ConneryService instance.
     * @returns A Promise that resolves to a ConneryToolkit instance.
     */
    static async createInstance(conneryService) {
        const toolkit = new ConneryToolkit();
        toolkit.tools = [];
        const actions = await conneryService.listActions();
        toolkit.tools.push(...actions); // This is a hack to make TypeScript happy, as TypeScript doesn't know that ConneryAction (StructuredTool) extends Tool.
        return toolkit;
    }
}
