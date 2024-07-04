import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";

import BotIcon from "../icons/bot.svg";
import BedrockBotIcon from "../icons/bedrock_32.svg";

import { useEffect } from "react";
import { getClientConfig } from "../config/client";

export function AuthPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();

  const goHome = () => navigate(Path.Home);
  const goChat = () => navigate(Path.Chat);
  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
    });
  }; // Reset access code to empty string

  //console.log("isApp")
  //console.log(getClientConfig()?.isApp)
  //useEffect(() => {
  //  if (getClientConfig()?.isApp) {
  //    navigate(Path.Settings);
  //  }
  //  // eslint-disable-next-line react-hooks/exhaustive-deps
  //}, []);

  return (
    <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <BedrockBotIcon />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>

      <input
        className={styles["auth-input"]}
        type="text"
        placeholder={Locale.Settings.Access.AWS.Region.Placeholder}
        value={accessStore.awsRegion}
        onChange={(e) => {
          accessStore.update(
            (access) => (access.awsRegion = e.currentTarget.value),
          );
        }}
      />
      <input
        className={styles["auth-input"]}
        type="password"
        placeholder={Locale.Settings.Access.AWS.AccessKey.Placeholder}
        value={accessStore.awsAccessKeyId}
        onChange={(e) => {
          accessStore.update(
            (access) => (access.awsAccessKeyId = e.currentTarget.value),
          );
        }}
      />
      <input
        className={styles["auth-input"]}
        type="password"
        placeholder={Locale.Settings.Access.AWS.SecretKey.Placeholder}
        value={accessStore.awsSecretAccessKey}
        onChange={(e) => {
          accessStore.update(
            (access) => (access.awsSecretAccessKey = e.currentTarget.value),
          );
        }}
      />

      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.Auth.Confirm}
          type="primary"
          onClick={goChat}
        />
        <IconButton
          text={Locale.Auth.Later}
          onClick={() => {
            resetAccessCode();
            goHome();
          }}
        />
      </div>
    </div>
  );
}
