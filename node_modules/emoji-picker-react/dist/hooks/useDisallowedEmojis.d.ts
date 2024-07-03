import { DataEmoji } from '../dataUtils/DataTypes';
export declare function useDisallowedEmojis(): Record<string, boolean>;
export declare function useIsEmojiDisallowed(): (emoji: DataEmoji) => boolean;
