/// <reference types="react" />
import { EmojiStyle } from '../../types/exposedTypes';
import { GetEmojiUrl } from './BaseEmojiProps';
export declare function ExportedEmoji({ unified, size, emojiStyle, lazyLoad, getEmojiUrl, emojiUrl }: {
    unified: string;
    emojiStyle?: EmojiStyle;
    size?: number;
    lazyLoad?: boolean;
    getEmojiUrl?: GetEmojiUrl;
    emojiUrl?: string;
}): JSX.Element | null;
