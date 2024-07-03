import { Categories, SuggestionMode } from '../types/exposedTypes';
export { Categories };
export declare const SuggestedRecent: CategoryConfig;
export declare type CustomCategoryConfig = {
    category: Categories.CUSTOM;
    name: string;
};
export declare function baseCategoriesConfig(modifiers?: Record<Categories, CategoryConfig>): CategoriesConfig;
export declare function categoryFromCategoryConfig(category: CategoryConfig): Categories;
export declare function categoryNameFromCategoryConfig(category: CategoryConfig): string;
export declare type CategoriesConfig = CategoryConfig[];
export declare type CategoryConfig = {
    category: Categories;
    name: string;
};
export declare type UserCategoryConfig = Array<Categories | CategoryConfig>;
export declare function mergeCategoriesConfig(userCategoriesConfig?: UserCategoryConfig, modifiers?: CategoryConfigModifiers): CategoriesConfig;
declare type CategoryConfigModifiers = {
    suggestionMode?: SuggestionMode;
};
