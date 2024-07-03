/// <reference types="react" />
import './SkinTonePicker.css';
declare type Props = {
    direction?: SkinTonePickerDirection;
};
export declare function SkinTonePickerMenu(): JSX.Element;
export declare function SkinTonePicker({ direction }: Props): JSX.Element | null;
export declare enum SkinTonePickerDirection {
    VERTICAL = "epr-vertical",
    HORIZONTAL = "epr-horizontal"
}
export {};
