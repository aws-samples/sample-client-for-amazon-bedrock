"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toolkit = void 0;
/**
 * Abstract base class for toolkits in LangChain. Toolkits are collections
 * of tools that agents can use. Subclasses must implement the `tools`
 * property to provide the specific tools for the toolkit.
 */
class Toolkit {
    getTools() {
        return this.tools;
    }
}
exports.Toolkit = Toolkit;
