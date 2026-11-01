/** Bound a calculator request so the button cannot sit on "Solving..." forever. */
export const CALC_TIMEOUT_MS = 12000;

export async function fetchWithTimeout(
    input: string,
    init: RequestInit = {},
    timeoutMs: number = CALC_TIMEOUT_MS,
): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            throw new Error('The calculator took too long. Please try again.');
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

/** Read an error message from a failed calculator response without swallowing it. */
export async function errorFromResponse(response: Response): Promise<string> {
    const text = await response.text();
    try {
        const json = JSON.parse(text) as { error?: unknown };
        if (typeof json.error === 'string' && json.error) return json.error;
    } catch {
        // Body was not JSON. Fall through to the status line.
    }
    const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 120);
    return snippet
        ? `Server error (${response.status}): ${snippet}`
        : `Server error (${response.status})`;
}
