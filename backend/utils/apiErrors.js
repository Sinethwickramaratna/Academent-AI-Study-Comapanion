export const AI_RESPONSE_FORMAT_MESSAGE = "The AI returned an incomplete response. Please try again.";
export const INVALID_JSON_REQUEST_MESSAGE = "We could not read that request. Please try again.";

const JSON_PARSE_PATTERNS = [
  /unterminated string in json/i,
  /unexpected end of json input/i,
  /unexpected token .* in json/i,
  /bad control character in string literal in json/i,
  /json at position \d+/i,
  /expected .* in json/i,
];

const HTML_MESSAGE_PATTERN = /<\/?(?:!doctype|html|head|body|pre|p|br|div|span)\b/i;

export function createAiResponseFormatError(error) {
  const publicError = new Error(AI_RESPONSE_FORMAT_MESSAGE);
  publicError.code = "AI_RESPONSE_FORMAT";
  publicError.cause = error;
  return publicError;
}

export function isJsonParseError(error) {
  const message = String(error?.message || error || "");
  return JSON_PARSE_PATTERNS.some((pattern) => pattern.test(message));
}

export function isRequestJsonParseError(error) {
  return error?.type === "entity.parse.failed"
    || (error instanceof SyntaxError && error.status === 400 && "body" in error);
}

export function getPublicErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const explicitMessage = String(error?.publicMessage || "").trim();
  if (explicitMessage) return explicitMessage;

  const message = String(error?.message || error || "").trim();
  if (!message) return fallback;

  if (error?.code === "AI_RESPONSE_FORMAT" || isJsonParseError(error)) {
    return AI_RESPONSE_FORMAT_MESSAGE;
  }

  if (HTML_MESSAGE_PATTERN.test(message)) {
    return fallback;
  }

  if (/model .* not found/i.test(message)) {
    return "The AI model is not available. Check the backend model configuration and try again.";
  }

  if (/(fetch failed|econnrefused|etimedout|enotfound|eai_again|socket|network|terminated)/i.test(message)) {
    return "The AI service could not be reached. Check the backend connection and try again.";
  }

  return message;
}
