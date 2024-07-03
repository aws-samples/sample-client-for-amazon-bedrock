/// <reference types="react" />
import { PickerConfig } from './config/config';
export { ExportedEmoji as Emoji } from './components/emoji/ExportedEmoji';
export { EmojiStyle, SkinTones, Theme, Categories, EmojiClickData, SuggestionMode, SkinTonePickerLocation } from './types/exposedTypes';
export interface PickerProps extends PickerConfig {
}
export default function EmojiPicker(props: PickerProps): JSX.Element;
