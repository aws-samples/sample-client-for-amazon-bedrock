import { SkinTones, SuggestionMode } from '../types/exposedTypes';
import { DataEmoji } from './DataTypes';
declare type SuggestedItem = {
    unified: string;
    original: string;
    count: number;
};
declare type Suggested = SuggestedItem[];
export declare function getSuggested(mode?: SuggestionMode): Suggested;
export declare function setSuggested(emoji: DataEmoji, skinTone: SkinTones): void;
export {};
