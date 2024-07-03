export declare type EmojiClickData = {
    activeSkinTone: SkinTones;
    unified: string;
    unifiedWithoutSkinTone: string;
    emoji: string;
    names: string[];
    imageUrl: string;
    getImageUrl: (emojiStyle?: EmojiStyle) => string;
    isCustom: boolean;
};
export declare enum SuggestionMode {
    RECENT = "recent",
    FREQUENT = "frequent"
}
export declare enum EmojiStyle {
    NATIVE = "native",
    APPLE = "apple",
    TWITTER = "twitter",
    GOOGLE = "google",
    FACEBOOK = "facebook"
}
export declare enum Theme {
    DARK = "dark",
    LIGHT = "light",
    AUTO = "auto"
}
export declare enum SkinTones {
    NEUTRAL = "neutral",
    LIGHT = "1f3fb",
    MEDIUM_LIGHT = "1f3fc",
    MEDIUM = "1f3fd",
    MEDIUM_DARK = "1f3fe",
    DARK = "1f3ff"
}
export declare enum Categories {
    SUGGESTED = "suggested",
    CUSTOM = "custom",
    SMILEYS_PEOPLE = "smileys_people",
    ANIMALS_NATURE = "animals_nature",
    FOOD_DRINK = "food_drink",
    TRAVEL_PLACES = "travel_places",
    ACTIVITIES = "activities",
    OBJECTS = "objects",
    SYMBOLS = "symbols",
    FLAGS = "flags"
}
export declare enum SkinTonePickerLocation {
    SEARCH = "SEARCH",
    PREVIEW = "PREVIEW"
}
