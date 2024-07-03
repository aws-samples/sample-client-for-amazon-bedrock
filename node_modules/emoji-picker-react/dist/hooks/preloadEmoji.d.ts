import { GetEmojiUrl } from '../components/emoji/BaseEmojiProps';
import { DataEmoji } from '../dataUtils/DataTypes';
import { EmojiStyle } from '../types/exposedTypes';
export declare function preloadEmoji(getEmojiUrl: GetEmojiUrl, emoji: undefined | DataEmoji, emojiStyle: EmojiStyle): void;
export declare const preloadedEmojs: Set<string>;
