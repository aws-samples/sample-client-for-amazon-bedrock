import * as React from 'react';
import './Emoji.css';
declare type ClickableEmojiButtonProps = Readonly<{
    hidden?: boolean;
    showVariations?: boolean;
    hiddenOnSearch?: boolean;
    emojiNames: string[];
    children: React.ReactNode;
    hasVariations: boolean;
    unified?: string;
}>;
export declare function ClickableEmojiButton({ emojiNames, unified, hidden, hiddenOnSearch, showVariations, hasVariations, children }: ClickableEmojiButtonProps): JSX.Element;
export {};
