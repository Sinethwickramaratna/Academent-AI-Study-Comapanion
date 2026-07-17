import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

const SYSTEM_LOGS_COLLECTION = "systemLogs";
const SESSION_ID_KEY = "academent_log_session_id";
const MAX_TEXT_LENGTH = 900;
const MAX_STACK_LENGTH = 4000;
const MAX_METADATA_DEPTH = 3;
const MAX_METADATA_KEYS = 24;
const MAX_CONSOLE_ERROR_LOGS = 20;

let consoleErrorLogCount = 0;
let consoleErrorLoggingInstalled = false;

const getSessionId = () => {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;

    const nextId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_KEY, nextId);
    return nextId;
  } catch {
    return "session_unavailable";
  }
};

const truncate = (value, maxLength = MAX_TEXT_LENGTH) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
};

const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const sanitizeMetadataValue = (value, depth = 0) => {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return null;
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return truncate(value);
  if (value instanceof Error) {
    return {
      name: truncate(value.name || "Error", 120),
      message: truncate(value.message),
      code: truncate(value.code || "", 120),
    };
  }
  if (depth >= MAX_METADATA_DEPTH) return truncate(safeStringify(value));
  if (Array.isArray(value)) return value.slice(0, 12).map((item) => sanitizeMetadataValue(item, depth + 1));
  if (typeof value === "object") {
    return Object.entries(value)
      .slice(0, MAX_METADATA_KEYS)
      .reduce((metadata, [key, item]) => {
        metadata[truncate(key, 80)] = sanitizeMetadataValue(item, depth + 1);
        return metadata;
      }, {});
  }

  return truncate(value);
};

const getBrowserSummary = () => {
  if (typeof navigator === "undefined") return "Unknown browser";
  return truncate(`${navigator.userAgent || "Unknown user agent"} | ${navigator.language || "unknown language"}`, 360);
};

const getCurrentEndpoint = () => {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
};

const toLogLevel = (level) => {
  if (["Information", "Warning", "Error", "Critical"].includes(level)) return level;
  return "Information";
};

export const serializeError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Unknown error",
      code: error.code || "",
      stackTrace: error.stack || "",
    };
  }

  if (typeof error === "object" && error !== null) {
    return {
      name: error.name || "Error",
      message: error.message || safeStringify(error),
      code: error.code || "",
      stackTrace: error.stack || "",
    };
  }

  return {
    name: "Error",
    message: String(error || "Unknown error"),
    code: "",
    stackTrace: "",
  };
};

export const writeSystemLog = async ({
  action = "event",
  endpoint = getCurrentEndpoint(),
  error = null,
  level = "Information",
  message,
  metadata = {},
  service = "Frontend",
  statusCode = 0,
} = {}) => {
  const user = auth.currentUser;
  if (!user) return null;

  const serializedError = error ? serializeError(error) : null;
  const resolvedMessage = truncate(message || serializedError?.message || action || "User activity");
  const normalizedStatusCode = Number.isFinite(Number(statusCode)) ? Math.trunc(Number(statusCode)) : 0;

  const payload = {
    action: truncate(action, 120),
    assignedTo: "System Admin queue",
    browser: getBrowserSummary(),
    createdAt: serverTimestamp(),
    endpoint: truncate(endpoint || getCurrentEndpoint(), 240),
    firstOccurrence: serverTimestamp(),
    latestOccurrence: serverTimestamp(),
    level: toLogLevel(level),
    message: resolvedMessage,
    metadata: sanitizeMetadataValue({
      ...metadata,
      errorCode: serializedError?.code || undefined,
      errorName: serializedError?.name || undefined,
    }),
    notes: "",
    occurrenceCount: 1,
    relatedLogs: [],
    requestId: `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    resolved: false,
    service: truncate(service, 80),
    sessionId: getSessionId(),
    source: "academent-web",
    stackTrace: truncate(serializedError?.stackTrace || "No stack trace captured.", MAX_STACK_LENGTH),
    statusCode: normalizedStatusCode,
    timestamp: serverTimestamp(),
    updatedAt: serverTimestamp(),
    url: typeof window === "undefined" ? "" : truncate(window.location.href, 360),
    user: user.uid,
    userEmail: truncate(user.email || "No email", 180),
    userId: user.uid,
  };

  try {
    return await addDoc(collection(db, SYSTEM_LOGS_COLLECTION), payload);
  } catch (error) {
    console.warn("System log could not be saved to Firestore:", error);
    return null;
  }
};

export const logUserActivity = (action, metadata = {}) => (
  writeSystemLog({
    action,
    level: "Information",
    message: metadata.message || action,
    metadata,
    service: metadata.service || "User Activity",
  })
);

export const logErrorEvent = (error, metadata = {}) => {
  const serializedError = serializeError(error);
  return writeSystemLog({
    action: metadata.action || "error",
    endpoint: metadata.endpoint || getCurrentEndpoint(),
    error,
    level: metadata.level || "Error",
    message: metadata.message || serializedError.message,
    metadata,
    service: metadata.service || "Frontend Error",
    statusCode: metadata.statusCode || 0,
  });
};

export const installConsoleErrorLogging = () => {
  if (consoleErrorLoggingInstalled || typeof console === "undefined") return;

  const originalConsoleError = console.error.bind(console);
  console.error = (...args) => {
    originalConsoleError(...args);

    if (consoleErrorLogCount >= MAX_CONSOLE_ERROR_LOGS) return;
    consoleErrorLogCount += 1;

    const firstError = args.find((arg) => arg instanceof Error);
    const message = args.map((arg) => (arg instanceof Error ? arg.message : safeStringify(arg))).join(" ");
    logErrorEvent(firstError || message, {
      action: "console_error",
      level: "Error",
      message: truncate(message),
      service: "Console Error",
    });
  };

  consoleErrorLoggingInstalled = true;
};
