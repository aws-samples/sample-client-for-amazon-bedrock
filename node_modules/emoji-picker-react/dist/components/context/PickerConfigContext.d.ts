import * as React from 'react';
import { PickerConfig, PickerConfigInternal } from '../../config/config';
declare type Props = PickerConfig & Readonly<{
    children: React.ReactNode;
}>;
export declare function PickerConfigProvider({ children, ...config }: Props): JSX.Element;
export declare function useSetConfig(config: PickerConfig): PickerConfigInternal;
export declare function usePickerConfig(): PickerConfigInternal;
export {};
