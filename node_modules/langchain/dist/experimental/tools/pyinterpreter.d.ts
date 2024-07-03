import { loadPyodide, type PyodideInterface } from "pyodide";
import { Tool, ToolParams } from "@langchain/core/tools";
export type PythonInterpreterToolParams = Parameters<typeof loadPyodide>[0] & ToolParams & {
    instance: PyodideInterface;
};
export declare class PythonInterpreterTool extends Tool {
    static lc_name(): string;
    name: string;
    description: string;
    pyodideInstance: PyodideInterface;
    stdout: string;
    stderr: string;
    constructor(options: PythonInterpreterToolParams);
    addPackage(packageName: string): Promise<void>;
    get availableDefaultPackages(): string;
    static initialize(options: Omit<PythonInterpreterToolParams, "instance">): Promise<PythonInterpreterTool>;
    _call(script: string): Promise<string>;
}
