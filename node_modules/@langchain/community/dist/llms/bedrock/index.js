import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Bedrock as BaseBedrock } from "./web.js";
export class Bedrock extends BaseBedrock {
    static lc_name() {
        return "Bedrock";
    }
    constructor(fields) {
        super({
            ...fields,
            credentials: fields?.credentials ?? defaultProvider(),
        });
    }
}
