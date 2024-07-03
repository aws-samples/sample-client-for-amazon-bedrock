import { EmojiProperties } from '../dataUtils/DataTypes';
export declare type CustomEmoji = {
    names: string[];
    [EmojiProperties.imgUrl]: string;
    id: string;
};
