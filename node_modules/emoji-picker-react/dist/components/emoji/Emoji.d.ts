/// <reference types="react" />
import { DataEmoji } from '../../dataUtils/DataTypes';
import './Emoji.css';
import { BaseEmojiProps } from './BaseEmojiProps';
declare type ClickableEmojiProps = Readonly<BaseEmojiProps & {
    hidden?: boolean;
    showVariations?: boolean;
    hiddenOnSearch?: boolean;
    emoji: DataEmoji;
}>;
export declare function ClickableEmoji({ emoji, unified, hidden, hiddenOnSearch, emojiStyle, showVariations, size, lazyLoad, getEmojiUrl }: ClickableEmojiProps): JSX.Element;
export {};
