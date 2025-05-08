// import { Mask, useMaskStore } from "../store/mask";

import { DEFAULT_MASK_AVATAR, Mask, useMaskStore } from "../store/mask";
import { MaskAvatar } from "./mask";
import { BUILTIN_MASKS } from "../masks";
import { useAppConfig } from "../store/config";
import styles from "./home.module.scss";

export function MaskList(props: { 
  narrow?: boolean,
  onMaskSelect: (mask: Mask) => void 
}) {
  const maskStore = useMaskStore();
  const config = useAppConfig();
  
  // Get user masks
  const userMasks = Object.values(maskStore.masks).sort(
    (a, b) => b.createdAt - a.createdAt
  );
  
  // Get builtin masks if not hidden
  const builtinMasks = config.hideBuiltinMasks
    ? []
    : BUILTIN_MASKS.map((m) => ({
        ...m,
        modelConfig: {
          ...config.modelConfig,
          ...m.modelConfig,
        },
      }) as Mask);

  // Combine both types of masks
  const masks = [...userMasks, ...builtinMasks];

  return (
    <div className={styles["chat-list"]}>
      {masks.map((mask: Mask, i: number) => (
        <MaskItem
          key={mask.id}
          mask={mask}
          selected={mask.id === maskStore.currentMaskId}
          narrow={props.narrow}
          onClick={() => {
            maskStore.selectMask(mask.id);
            props.onMaskSelect(mask);
          }}
        />
      ))}
    </div>
  );
}

function MaskItem(props: {
  mask: Mask;
  selected?: boolean;
  narrow?: boolean;
  onClick: () => void;
}) {
  return (
    <div 
      className={`${styles["chat-item"]} ${props.selected && styles["chat-item-selected"]}`}
      onClick={props.onClick}
    >
      <div className={styles["chat-item-title"]}>
        <div className={styles["chat-item-avatar"]}>
          <MaskAvatar 
            avatar={props.mask.avatar} 
            model={props.mask.modelConfig?.model} 
          />
        </div>
        {!props.narrow && (
          <div className={styles["chat-item-info"]}>
            <div className={styles["chat-item-name"]}>{props.mask.name}</div>
            <div className={styles["chat-item-context"]}>
              {props.mask.context?.length ?? 0} prompts
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 