import { DataEmoji } from '../dataUtils/DataTypes';
export declare function useIsEmojiHidden(): (emoji: DataEmoji) => IsHiddenReturn;
declare type IsHiddenReturn = {
    failedToLoad: boolean;
    filteredOut: boolean;
    hidden: boolean;
};
export {};
