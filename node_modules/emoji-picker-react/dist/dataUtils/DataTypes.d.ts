import emojis from '../data/emojis';
export declare enum EmojiProperties {
    name = "n",
    unified = "u",
    variations = "v",
    added_in = "a",
    imgUrl = "imgUrl"
}
export interface DataEmoji extends WithName {
    [EmojiProperties.unified]: string;
    [EmojiProperties.variations]?: string[];
    [EmojiProperties.added_in]: string;
    [EmojiProperties.imgUrl]?: string;
}
export declare type DataEmojis = DataEmoji[];
export declare type DataGroups = keyof typeof emojis;
export declare type WithName = {
    [EmojiProperties.name]: string[];
};
