const TECHNICAL_ERROR_PATTERNS = [
  /unterminated string in json/i,
  /unexpected end of json input/i,
  /unexpected token .* in json/i,
  /bad control character in string literal in json/i,
  /json at position \d+/i,
  /^syntaxerror:/i,
];

const HTML_MESSAGE_PATTERN = /<\/?(?:!doctype|html|head|body|pre|p|br|div|span)\b/i;

export const sanitizeApiErrorMessage = (message, fallback = "Something went wrong. Please try again.") => {
  const rawMessage = String(message || "").trim();
  if (!rawMessage) return fallback;

  if (HTML_MESSAGE_PATTERN.test(rawMessage)) {
    return fallback;
  }

  const normalized = rawMessage.replace(/\s+/g, " ");
  if (TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return fallback;
  }

  return normalized;
};

export const getApiErrorMessage = (result, fallback) => (
  sanitizeApiErrorMessage(result?.error || result?.message, fallback)
);
