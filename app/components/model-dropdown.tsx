import React, { useState, useRef, useEffect } from "react";
import { LLMModel } from "../client/api";
import styles from "./model-dropdown.module.scss";

interface ModelDropdownProps {
  models: LLMModel[];
  selectedModel: string; // for configuration display
  defaultModel: string; // the checked model
  onModelSelect: (modelName: string) => void; // for config switching
  onDefaultToggle: (modelName: string) => void; // for checkbox
}

export function ModelDropdown({
  models,
  selectedModel,
  defaultModel,
  onModelSelect,
  onDefaultToggle,
}: ModelDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCheckboxClick = (e: React.MouseEvent, modelName: string) => {
    console.log("[Dropdown Debug] Checkbox clicked for model:", modelName);
    e.stopPropagation(); // Prevent model selection when clicking checkbox

    // Prevent rapid successive clicks
    if (isUpdating) {
      console.log("[Dropdown Debug] Update in progress, ignoring click");
      return;
    }

    setIsUpdating(true);
    onDefaultToggle(modelName);

    // Reset the updating flag after a short delay
    setTimeout(() => {
      setIsUpdating(false);
    }, 500);
  };

  const handleModelNameClick = (modelName: string) => {
    onModelSelect(modelName);
    setIsOpen(false); // Close dropdown after selection
  };

  const availableModels = models.filter((m) => m.available);

  return (
    <div className={styles["model-dropdown"]} ref={dropdownRef}>
      <div 
        className={styles["dropdown-trigger"]} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles["selected-model"]}>
          {availableModels.find(m => m.name === selectedModel)?.displayName || selectedModel}
          {selectedModel === defaultModel && <span className={styles["default-badge"]}>Default</span>}
        </span>
        <span className={styles["dropdown-arrow"]}>{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div className={styles["dropdown-menu"]}>
          {availableModels.map((model) => (
            <div key={model.name} className={styles["dropdown-item"]}>
              <div
                className={`${styles["checkbox-area"]} ${isUpdating ? styles["updating"] : ""}`}
                onClick={(e) => handleCheckboxClick(e, model.name)}
              >
                <input
                  type="checkbox"
                  checked={model.name === defaultModel}
                  onChange={() => {}} // Controlled by parent onClick
                  readOnly
                />
              </div>
              <div 
                className={styles["model-info"]}
                onClick={() => handleModelNameClick(model.name)}
              >
                <span className={styles["model-name"]}>
                  {model.displayName || model.name}
                </span>
                <span className={styles["model-provider"]}>
                  ({model.provider?.providerName})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
