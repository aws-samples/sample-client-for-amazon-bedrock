import { IconButton } from "./button";
import { ErrorBoundary } from "./error";

import DownloadIcon from "../icons/download.svg";
import UploadIcon from "../icons/upload.svg";
import EditIcon from "../icons/edit.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import EyeIcon from "../icons/eye.svg";
import CopyIcon from "../icons/copy.svg";
import DragIcon from "../icons/drag.svg";


import { Path } from "../constant";
import { useNavigate } from "react-router-dom";
import { useMaskStore } from "../store/mask";
import { useAppConfig, useChatStore } from "../store";
import { MaskConfig } from "./mask";
import { Modal, showConfirm } from "./ui-lib";
import { downloadAs } from "../utils";
import { BUILTIN_MASK_STORE } from "../masks";
import Locale from "../locales";
import styles from "./mask.module.scss";

export function MaskDetail() {
  const navigate = useNavigate();
  const maskStore = useMaskStore();
  const chatStore = useChatStore();
  
  // Get mask from both stores
  const maskFromStore = maskStore.currentMask();
  const maskFromBuiltin = BUILTIN_MASK_STORE.get(maskStore.currentMaskId ?? "");
  const currentMask = maskFromStore ?? maskFromBuiltin;

  console.log("Debug Mask Detail:", {
    currentMaskId: maskStore.currentMaskId,
    maskFromStore,
    maskFromBuiltin,
    currentMask
  });

  if (!currentMask) {
    console.log("No mask found, showing empty state");
    return (
      <div className={styles["mask-page"]}>
        <div className="window-header">
          <div className="window-header-title">
            <div className="window-header-main-title">{Locale.Mask.Page.Title}</div>
            <div className="window-header-submai-title">
              {Locale.Mask.Page.SubTitle(0)}
            </div>
          </div>
        </div>
        <div className={styles["mask-page-body"]}>
          {Locale.Mask.Page.SelectMask}
        </div>
      </div>
    );
  }

  const editingMask = currentMask;  // No need to check again since we already have the correct mask

  console.log("Rendering mask detail for:", {
    id: editingMask.id,
    name: editingMask.name,
    isBuiltin: editingMask.builtin
  });

  return (
    <ErrorBoundary>
      <div className={styles["mask-page"]}>
        <div className="window-header">
          <div className="window-header-title">
            <div className="window-header-main-title">{editingMask.name}</div>
            <div className="window-header-submai-title">
              {Locale.Mask.Config.SubTitle}
            </div>
          </div>

          <div className="window-actions">
            <div className="window-action-button">
              <IconButton
                icon={<DownloadIcon />}
                bordered
                text={Locale.Mask.Config.Download}
                onClick={() =>
                  downloadAs(
                    JSON.stringify(editingMask),
                    `${editingMask.name}.json`,
                  )
                }
              />
            </div>
            <div className="window-action-button">
              <IconButton
                icon={<CopyIcon />}
                bordered
                text={Locale.Mask.Config.Clone}
                onClick={() => {
                  navigate(Path.Masks);
                  maskStore.create(editingMask);
                }}
              />
            </div>
            {!editingMask.builtin && (
              <div className="window-action-button">
                <IconButton
                  icon={<DeleteIcon />}
                  bordered
                  text={Locale.Mask.Item.Delete}
                  onClick={async () => {
                    if (await showConfirm(Locale.Mask.Item.DeleteConfirm)) {
                      maskStore.delete(editingMask.id);
                      navigate(Path.Masks);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles["mask-page-body"]}>
          <MaskConfig
            mask={editingMask}
            updateMask={(updater) => maskStore.updateMask(editingMask.id, updater)}
            readonly={editingMask.builtin}
          />
        </div>

        <div className={styles["mask-page-actions"]}>
          <IconButton
            text={Locale.Mask.Item.Chat}
            onClick={() => {
              chatStore.newSession(editingMask);
              navigate(Path.Chat);
            }}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
} 