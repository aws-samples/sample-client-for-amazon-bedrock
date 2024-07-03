import * as React from 'react';
import './Flex.css';
export declare enum FlexDirection {
    ROW = "FlexRow",
    COLUMN = "FlexColumn"
}
declare type Props = Readonly<{
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    direction?: FlexDirection;
}>;
export default function Flex({ children, className, style, direction }: Props): JSX.Element;
export {};
