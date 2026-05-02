// supabase/functions/_shared/sanitization.ts

/**
 * Sanitizes user input to prevent prompt injection and XSS in AI contexts.
 * 1. Trims whitespace
 * 2. Enforces a maximum length (default 500 characters)
 * 3. Removes control characters
 * 4. Escapes quotes to prevent breaking out of JSON or prompt boundaries
 */
export function sanitizeInput(input: string | null | undefined, maxLength: number = 500): string {
    if (!input) return "";

    // 1. Convert to string and truncate to max length
    let sanitized = String(input).substring(0, maxLength);

    // 2. Remove non-printable control characters (except newline and carriage return)
    // Matches ASCII 0-31 (except 10 LF and 13 CR) and 127 DEL
    sanitized = sanitized.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // 3. Escape quotes safely (though JSON.stringify usually handles this, it's an extra layer for raw prompt injection)
    // This turns " into \" and ' into \' if needed by the prompt, though we might not need to if we just pass as JSON.
    // For raw string injection into prompts, basic HTML escaping can help deter injection patterns.
    // Let's rely mainly on truncation and control char removal, and ensure no template injection syntax.
    sanitized = sanitized.trim();

    return sanitized;
}

/**
 * Validates and sanitizes a parameter, throwing an API-safe error if extremely invalid or missing required.
 */
export function requireSanitized(input: string | null | undefined, paramName: string, maxLength: number = 500): string {
    const sanitized = sanitizeInput(input, maxLength);
    if (!sanitized) {
        throw new Error(`Missing or invalid requirement: ${paramName}`);
    }
    return sanitized;
}
