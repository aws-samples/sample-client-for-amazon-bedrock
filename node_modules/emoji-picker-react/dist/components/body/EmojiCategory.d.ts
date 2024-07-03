import * as React from 'react';
import { CategoryConfig } from '../../config/categoryConfig';
import './EmojiCategory.css';
declare type Props = Readonly<{
    categoryConfig: CategoryConfig;
    children?: React.ReactNode;
    hidden?: boolean;
    hiddenOnSearch?: boolean;
}>;
export declare function EmojiCategory({ categoryConfig, children, hidden, hiddenOnSearch }: Props): JSX.Element;
export {};
