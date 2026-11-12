import { useEffect, useState } from "react";
import { showToast } from "./components/ui-lib";
import Locale from "./locales";
import { RequestMessage } from "./client/api";
import { DEFAULT_MODELS, resolveModelName } from "./constant";
import * as mammoth from "mammoth";
import readXlsxFile from "read-excel-file";


export function trimTopic(topic: string) {
  // Fix an issue where double quotes still show in the Indonesian language
  // This will remove the specified punctuation from the end of the string
  // and also trim quotes from both the start and end if they exist.
  return (
    topic
      // fix for gemini
      .replace(/^["“”*]+|["“”*]+$/g, "")
      .replace(/[，。！？”“"、,.!?*]*$/, "")
  );
}

export async function copyToClipboard(text: string) {
  try {
    if (window.__TAURI__) {
      window.__TAURI__.writeText(text);
    } else {
      await navigator.clipboard.writeText(text);
    }

    showToast(Locale.Copy.Success);
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      showToast(Locale.Copy.Success);
    } catch (error) {
      showToast(Locale.Copy.Failed);
    }
    document.body.removeChild(textArea);
  }
}

export async function downloadAs(text: string, filename: string) {
  if (window.__TAURI__) {
    const result = await window.__TAURI__.dialog.save({
      defaultPath: `${filename}`,
      filters: [
        {
          name: `${filename.split(".").pop()} files`,
          extensions: [`${filename.split(".").pop()}`],
        },
        {
          name: "All Files",
          extensions: ["*"],
        },
      ],
    });

    if (result !== null) {
      try {
        await window.__TAURI__.fs.writeTextFile(result, text);
        showToast(Locale.Download.Success);
      } catch (error) {
        showToast(Locale.Download.Failed);
      }
    } else {
      showToast(Locale.Download.Failed);
    }
  } else {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text),
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
}

export type MarkdownImage = { alt: string; url: string };

type ImageSaveResult =
  "downloaded" | "written" | "cancelled" | "blocked" | "expired" | "failed";

export function getMarkdownImages(text: string): MarkdownImage[] {
  const withoutCode = text.replace(/(```|~~~)[\s\S]*?\1|`[^`\n]*`/g, "");
  const pattern =
    /!\[([^\]]*)\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;
  return Array.from(withoutCode.matchAll(pattern))
    .map((m) => ({ alt: m[1], url: m[2] ?? m[3] }))
    .filter((image) => /^(https?:|data:image\/)/i.test(image.url));
}

function imageFileName(image: MarkdownImage, mimeType: string) {
  let segment = "";
  if (!/^data:/i.test(image.url)) {
    const last = new URL(image.url).pathname.split("/").pop() ?? "";
    try {
      segment = decodeURIComponent(last);
    } catch (error) {
      segment = last;
    }
  }
  const ext =
    segment.match(/\.(\w{1,5})$/)?.[1] ??
    mimeType.match(/^image\/(\w+)/)?.[1]?.replace(/^jpeg$/, "jpg") ??
    "png";
  const base = (
    image.alt.trim() ||
    segment.replace(/\.\w{1,5}$/, "") ||
    "image"
  )
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "_")
    .slice(0, 100);
  return base.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
    ? base
    : `${base}.${ext}`;
}

// Without CORS headers the browser hides the 403 of an expired presigned URL,
// so read the signing time and lifetime from the URL itself.
function isPresignExpired(url: string) {
  try {
    const params = new URL(url).searchParams;
    const date = params
      .get("X-Amz-Date")
      ?.match(/^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z$/);
    const seconds = Number(params.get("X-Amz-Expires"));
    if (!date || !seconds) return false;
    const [year, month, day, hour, minute, second] = date.slice(1).map(Number);
    const signedAt = Date.UTC(year, month - 1, day, hour, minute, second);
    return signedAt + seconds * 1000 < Date.now();
  } catch (error) {
    return false;
  }
}

async function saveImage(image: MarkdownImage): Promise<ImageSaveResult> {
  let blob: Blob;
  try {
    // no-store: the <img> may have cached a copy fetched without CORS headers
    const response = await fetch(image.url, { cache: "no-store" });
    if (response.status === 403) return "expired";
    if (!response.ok) return "failed";
    blob = await response.blob();
  } catch (error) {
    return isPresignExpired(image.url) ? "expired" : "blocked";
  }

  const name = imageFileName(image, blob.type);
  try {
    if (window.__TAURI__) {
      const path = await window.__TAURI__.dialog.save({
        defaultPath: name,
        filters: [
          {
            name: `${name.split(".").pop()} files`,
            extensions: [`${name.split(".").pop()}`],
          },
          {
            name: "All Files",
            extensions: ["*"],
          },
        ],
      });
      if (path === null) return "cancelled";
      await window.__TAURI__.fs.writeBinaryFile(
        path,
        new Uint8Array(await blob.arrayBuffer()),
      );
      return "written";
    }

    const objectUrl = URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.setAttribute("href", objectUrl);
    element.setAttribute("download", name);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return "downloaded";
  } catch (error) {
    return "failed";
  }
}

// One click lets the page open one popup, so each further tab opens from a
// click on the toast.
function openInNewTabs([image, ...rest]: MarkdownImage[]) {
  if (!window.open(image.url, "_blank")) {
    showToast(Locale.Download.Failed);
    return;
  }
  showToast(
    Locale.Download.ImageOpened,
    rest.length > 0
      ? {
          text: Locale.Download.OpenNextImage(rest.length),
          onClick: () => openInNewTabs(rest),
        }
      : undefined,
    rest.length > 0 ? 10000 : 3000,
  );
}

export async function downloadImages(images: MarkdownImage[]) {
  const blocked: MarkdownImage[] = [];
  let written = false;
  let expired = false;
  let failed = false;
  for (const image of images) {
    switch (await saveImage(image)) {
      case "downloaded":
        break;
      case "written":
        written = true;
        break;
      case "blocked":
        blocked.push(image);
        break;
      case "expired":
        expired = true;
        break;
      case "failed":
        failed = true;
        break;
      case "cancelled":
        return;
    }
  }
  if (blocked.length > 0) openInNewTabs(blocked);
  else if (expired) showToast(Locale.Download.ImageExpired);
  else if (failed) showToast(Locale.Download.Failed);
  else if (written) showToast(Locale.Download.Success);
}

export function compressImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent: any) => {
      const image = new Image();
      image.onload = () => {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        let width = image.width;
        let height = image.height;
        let quality = 0.9;
        let dataUrl;

        do {
          canvas.width = width;
          canvas.height = height;
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.drawImage(image, 0, 0, width, height);
          dataUrl = canvas.toDataURL("image/jpeg", quality);

          if (dataUrl.length < maxSize) break;

          if (quality > 0.5) {
            // Prioritize quality reduction
            quality -= 0.1;
          } else {
            // Then reduce the size
            width *= 0.9;
            height *= 0.9;
          }
        } while (dataUrl.length > maxSize);

        resolve(dataUrl);
      };
      image.onerror = reject;
      image.src = readerEvent.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function readFromFile() {
  return new Promise<string>((res, rej) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";

    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      const fileReader = new FileReader();
      fileReader.onload = (e: any) => {
        res(e.target.result);
      };
      fileReader.onerror = (e) => rej(e);
      fileReader.readAsText(file);
    };

    fileInput.click();
  });
}

export function isIOS() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return size;
}

export const MOBILE_MAX_WIDTH = 600;
export function useMobileScreen() {
  const { width } = useWindowSize();

  return width <= MOBILE_MAX_WIDTH;
}

export function isFirefox() {
  return (
    typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent)
  );
}

export function selectOrCopy(el: HTMLElement, content: string) {
  const currentSelection = window.getSelection();

  if (currentSelection?.type === "Range") {
    return false;
  }

  copyToClipboard(content);

  return true;
}

function getDomContentWidth(dom: HTMLElement) {
  const style = window.getComputedStyle(dom);
  const paddingWidth =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const width = dom.clientWidth - paddingWidth;
  return width;
}

function getOrCreateMeasureDom(id: string, init?: (dom: HTMLElement) => void) {
  let dom = document.getElementById(id);

  if (!dom) {
    dom = document.createElement("span");
    dom.style.position = "absolute";
    dom.style.wordBreak = "break-word";
    dom.style.fontSize = "14px";
    dom.style.transform = "translateY(-200vh)";
    dom.style.pointerEvents = "none";
    dom.style.opacity = "0";
    dom.id = id;
    document.body.appendChild(dom);
    init?.(dom);
  }

  return dom!;
}

export function autoGrowTextArea(dom: HTMLTextAreaElement) {
  const measureDom = getOrCreateMeasureDom("__measure");
  const singleLineDom = getOrCreateMeasureDom("__single_measure", (dom) => {
    dom.innerText = "TEXT_FOR_MEASURE";
  });

  const width = getDomContentWidth(dom);
  measureDom.style.width = width + "px";
  measureDom.innerText = dom.value !== "" ? dom.value : "1";
  measureDom.style.fontSize = dom.style.fontSize;
  const endWithEmptyLine = dom.value.endsWith("\n");
  const height = parseFloat(window.getComputedStyle(measureDom).height);
  const singleLineHeight = parseFloat(
    window.getComputedStyle(singleLineDom).height,
  );

  const rows =
    Math.round(height / singleLineHeight) + (endWithEmptyLine ? 1 : 0);

  return rows;
}

export function getCSSVar(varName: string) {
  return getComputedStyle(document.body).getPropertyValue(varName).trim();
}

/**
 * Detects Macintosh
 */
export function isMacOS(): boolean {
  if (typeof window !== "undefined") {
    let userAgent = window.navigator.userAgent.toLocaleLowerCase();
    const macintosh = /iphone|ipad|ipod|macintosh/.test(userAgent);
    return !!macintosh;
  }
  return false;
}

export function getMessageTextContent(message: RequestMessage) {
  if (typeof message.content === "string") {
    return message.content;
  }
  for (const c of message.content) {
    if (c.type === "text") {
      return c.text ?? "";
    }
  }
  return "";
}

export function getMessageImages(message: RequestMessage): string[] {
  if (typeof message.content === "string") {
    return [];
  }
  const urls: string[] = [];
  for (const c of message.content) {
    if (c.type === "image_url") {
      urls.push(c.image_url?.url ?? "");
    }
  }
  return urls;
}

export function isVisionModel(model: string, models?: any) {
  // First, try to find the model in the models array and check the explicit property
  if (models) {
    const currentModel =
      models.find((m: any) => m.name === model) ??
      models.find((m: any) => m.name === resolveModelName(model));
    if (currentModel) {
      // Use the explicit support_image_understanding property if available
      if (currentModel.support_image_understanding !== undefined) {
        return currentModel.support_image_understanding;
      }
      // Fallback to the old multiple property for backward compatibility
      if (currentModel.multiple) {
        return true;
      }
    }
  }

  // Fallback for backward compatibility (can be removed later)
  // Keep some basic patterns for models not yet in the configuration
  return (
    model.includes("vision") ||
    model.includes("claude-3") ||
    model.includes("claude3") ||
    (model.includes("claude") && model.includes("3")) ||
    model.includes("Claude3") ||
    (model.includes("Claude") && model.includes("3"))
  );
}

/**
 * Reads the contents of a file (CSV, TXT, or Markdown).
 * @param {File} file - The file to read.
 * @returns {Promise<string>} A promise that resolves with the file contents.
 */
const readTXTFile = async (file: File): Promise<string | undefined> => {
  try {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !["csv", "txt", "md"].includes(fileExtension)) {
      console.error("Unsupported file type:", fileExtension);
      return;
    }

    const fileReader = new FileReader();

    return new Promise<string>((resolve, reject) => {
      fileReader.onload = () => {
        if (fileReader.result && typeof fileReader.result === "string") {
          resolve(fileReader.result);
        } else {
          reject(new Error("Failed to read file contents"));
        }
      };

      fileReader.onerror = () => {
        reject(new Error("Error reading file"));
      };

      fileReader.readAsText(file);
    });
  } catch (error) {
    console.error("Error reading file:", error);
  }
};

/**
 * Extracts the text content from a .docx file.
 *
 * @param {File} file - The .docx file to extract text from.
 * @returns {Promise<string | undefined>} A promise that resolves with the extracted text content, or undefined if an error occurs.
 */
const extractTextFromDocx = async (file: File): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result) {
        const buffer = reader.result as ArrayBuffer;
        mammoth
          .extractRawText({ arrayBuffer: buffer })
          .then((result) => {
            const text = result.value;
            resolve(text);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        reject(new Error("Failed to read file"));
      }
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Extracts text content from an .xlsx file.
 *
 * @param {File} file - The .xlsx file to extract text from.
 * @returns {Promise<string | undefined>} A promise that resolves with the extracted text content, or undefined if an error occurs.
 */
const extractTextFromXlsx = async (file: File): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result) {
        const buffer = reader.result as ArrayBuffer;
        readXlsxFile(buffer)
          .then((rows) => {
            const textContent = rows.map((row) => row.join("\t")).join("\n");
            resolve(textContent);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        reject(new Error("Failed to read file"));
      }
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsArrayBuffer(file);
  });
};

const readFileAsBytes = async (file: File): Promise<Uint8Array | undefined> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error("Failed to read file"));
      }
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsArrayBuffer(file);
  });
};

async function calculateSHA1(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

function checkFileExtension(extName: string): boolean {
  const allowedExtensions = ['pdf', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'html', 'txt', 'md'];
  return allowedExtensions.includes(extName.toLowerCase())
}


export { readTXTFile, extractTextFromDocx, extractTextFromXlsx,readFileAsBytes ,calculateSHA1,checkFileExtension};
