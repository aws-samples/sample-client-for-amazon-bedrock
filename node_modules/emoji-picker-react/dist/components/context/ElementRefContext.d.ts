import * as React from 'react';
import { NullableElement } from '../../DomUtils/selectors';
export declare function ElementRefContextProvider({ children }: {
    children: React.ReactNode;
}): JSX.Element;
export declare type ElementRef<E extends HTMLElement = HTMLElement> = React.MutableRefObject<E | null>;
export declare function usePickerMainRef(): ElementRef<HTMLElement>;
export declare function useAnchoredEmojiRef(): ElementRef<HTMLElement>;
export declare function useSetAnchoredEmojiRef(): (target: NullableElement) => void;
export declare function useBodyRef(): ElementRef<HTMLDivElement>;
export declare function useSearchInputRef(): ElementRef<HTMLInputElement>;
export declare function useSkinTonePickerRef(): ElementRef<HTMLDivElement>;
export declare function useCategoryNavigationRef(): ElementRef<HTMLDivElement>;
export declare function useVariationPickerRef(): ElementRef<HTMLDivElement>;
