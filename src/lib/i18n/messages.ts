import fs from "node:fs";
import path from "node:path";
import {
  APP_FALLBACK_LOCALE,
  MOD06_PRIMARY_LOCALES,
  REQUIRED_MESSAGE_NAMESPACES,
  type MessageNamespace,
} from "@/lib/i18n/constants";
import type { MessageBundle, MessageDictionary } from "@/lib/i18n/types";

const messagesRoot = path.join(process.cwd(), "src", "messages");

function readNamespaceFile(locale: string, namespace: MessageNamespace): MessageDictionary {
  const filePath = path.join(messagesRoot, locale, `${namespace}.json`);
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as MessageDictionary;
}

export function loadMessages(
  locale: string,
  namespaces: readonly MessageNamespace[] = REQUIRED_MESSAGE_NAMESPACES,
): MessageBundle {
  const bundle: MessageBundle = {};

  for (const namespace of namespaces) {
    bundle[namespace] = readNamespaceFile(locale, namespace);
  }

  return bundle;
}

export function mergeMessageBundles(
  primary: MessageBundle,
  fallback: MessageBundle,
): MessageBundle {
  const merged: MessageBundle = {};

  for (const namespace of REQUIRED_MESSAGE_NAMESPACES) {
    merged[namespace] = {
      ...(fallback[namespace] ?? {}),
      ...(primary[namespace] ?? {}),
    };
  }

  return merged;
}

export function loadLocalizedMessages(locale: string): MessageBundle {
  const fallback = loadMessages(APP_FALLBACK_LOCALE);
  if (locale === APP_FALLBACK_LOCALE) {
    return fallback;
  }

  const primary = loadMessages(locale);
  return mergeMessageBundles(primary, fallback);
}

export function listMessageLocales(): string[] {
  if (!fs.existsSync(messagesRoot)) return [];
  return fs
    .readdirSync(messagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

export function flattenMessageKeys(bundle: MessageBundle): string[] {
  const keys: string[] = [];
  for (const namespace of REQUIRED_MESSAGE_NAMESPACES) {
    const dictionary = bundle[namespace] ?? {};
    for (const key of Object.keys(dictionary)) {
      keys.push(`${namespace}.${key}`);
    }
  }
  return keys.sort();
}

export function getRequiredLocales(): string[] {
  return [...MOD06_PRIMARY_LOCALES];
}
