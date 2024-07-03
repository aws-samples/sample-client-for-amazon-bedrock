import * as React from 'react';
import { EmojiStyle } from '../../types/exposedTypes';
export declare function EmojiImg({ emojiName, style, lazyLoad, imgUrl, onError }: {
    emojiName: string;
    emojiStyle: EmojiStyle;
    style: React.CSSProperties;
    lazyLoad?: boolean;
    imgUrl: string;
    onError: () => void;
}): JSX.Element;
