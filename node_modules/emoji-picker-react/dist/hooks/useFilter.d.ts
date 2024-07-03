import { DataEmoji } from '../dataUtils/DataTypes';
export declare function useClearSearch(): () => void;
export declare function useAppendSearch(): (str: string) => void;
export declare function useFilter(): {
    onChange: (inputValue: string) => void;
    searchTerm: string;
    SearchInputRef: import("../components/context/ElementRefContext").ElementRef<HTMLInputElement>;
    statusSearchResults: string;
};
export declare function useIsEmojiFiltered(): (unified: string) => boolean;
export declare type FilterDict = Record<string, DataEmoji>;
export declare function getNormalizedSearchTerm(str: string): string;
