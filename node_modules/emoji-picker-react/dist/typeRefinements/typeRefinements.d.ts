import { CategoryConfig, CustomCategoryConfig } from '../config/categoryConfig';
import { CustomEmoji } from '../config/customEmojiConfig';
import { DataEmoji } from '../dataUtils/DataTypes';
export declare function isCustomCategory(category: CategoryConfig | CustomCategoryConfig): category is CustomCategoryConfig;
export declare function isCustomEmoji(emoji: Partial<DataEmoji>): emoji is CustomEmoji;
