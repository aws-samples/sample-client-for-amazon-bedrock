import { CustomEmoji } from '../../config/customEmojiConfig';
import { DataEmoji } from '../../dataUtils/DataTypes';
import { EmojiStyle } from '../../types/exposedTypes';
export declare type BaseEmojiProps = {
    emoji?: DataEmoji | CustomEmoji;
    emojiStyle: EmojiStyle;
    unified: string;
    size?: number;
    lazyLoad?: boolean;
    getEmojiUrl?: GetEmojiUrl;
};
export declare type GetEmojiUrl = (unified: string, style: EmojiStyle) => string;
