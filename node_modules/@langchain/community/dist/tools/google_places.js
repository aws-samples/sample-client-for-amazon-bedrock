import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { Tool } from "@langchain/core/tools";
/**
 * Tool that queries the Google Places API
 */
export class GooglePlacesAPI extends Tool {
    static lc_name() {
        return "GooglePlacesAPI";
    }
    get lc_secrets() {
        return {
            apiKey: "GOOGLE_PLACES_API_KEY",
        };
    }
    constructor(fields) {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "google_places"
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: `A wrapper around Google Places API. Useful for when you need to validate or 
  discover addresses from ambiguous text. Input should be a search query.`
        });
        const apiKey = fields?.apiKey ?? getEnvironmentVariable("GOOGLE_PLACES_API_KEY");
        if (apiKey === undefined) {
            throw new Error(`Google Places API key not set. You can set it as "GOOGLE_PLACES_API_KEY" in your environment variables.`);
        }
        this.apiKey = apiKey;
    }
    async _call(input) {
        const res = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
            method: "POST",
            body: JSON.stringify({
                textQuery: input,
                languageCode: "en",
            }),
            headers: {
                "X-Goog-Api-Key": this.apiKey,
                "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.id,places.internationalPhoneNumber,places.websiteUri",
                "Content-Type": "application/json",
            },
        });
        if (!res.ok) {
            let message;
            try {
                const json = await res.json();
                message = json.error.message;
            }
            catch (e) {
                message =
                    "Unable to parse error message: Google did not return a JSON response.";
            }
            throw new Error(`Got ${res.status}: ${res.statusText} error from Google Places API: ${message}`);
        }
        const json = await res.json();
        const results = json?.places?.map((place) => ({
            name: place.displayName?.text,
            id: place.id,
            address: place.formattedAddress,
            phoneNumber: place.internationalPhoneNumber,
            website: place.websiteUri,
        })) ?? [];
        return JSON.stringify(results);
    }
}
