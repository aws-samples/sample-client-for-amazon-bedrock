import { BaseTracer } from "./base.js";
export class RootListenersTracer extends BaseTracer {
    constructor({ config, onStart, onEnd, onError, }) {
        super({ _awaitHandler: true });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "RootListenersTracer"
        });
        /** The Run's ID. Type UUID */
        Object.defineProperty(this, "rootId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "argOnStart", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "argOnEnd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "argOnError", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.config = config;
        this.argOnStart = onStart;
        this.argOnEnd = onEnd;
        this.argOnError = onError;
    }
    /**
     * This is a legacy method only called once for an entire run tree
     * therefore not useful here
     * @param {Run} _ Not used
     */
    persistRun(_) {
        return Promise.resolve();
    }
    async onRunCreate(run) {
        if (this.rootId) {
            return;
        }
        this.rootId = run.id;
        if (this.argOnStart) {
            if (this.argOnStart.length === 1) {
                await this.argOnStart(run);
            }
            else if (this.argOnStart.length === 2) {
                await this.argOnStart(run, this.config);
            }
        }
    }
    async onRunUpdate(run) {
        if (run.id !== this.rootId) {
            return;
        }
        if (!run.error) {
            if (this.argOnEnd) {
                if (this.argOnEnd.length === 1) {
                    await this.argOnEnd(run);
                }
                else if (this.argOnEnd.length === 2) {
                    await this.argOnEnd(run, this.config);
                }
            }
        }
        else if (this.argOnError) {
            if (this.argOnError.length === 1) {
                await this.argOnError(run);
            }
            else if (this.argOnError.length === 2) {
                await this.argOnError(run, this.config);
            }
        }
    }
}
