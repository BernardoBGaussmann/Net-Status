export async function checkService(url, timeoutMs = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const start = performance.now();
    let status = null;
    let online = false;
    let error = null;

    try {
        const response = await fetch(url, { signal: controller.signal });
        status = response.status;
        online = response.ok;
    } catch (err) {
        error = err.name === 'AbortError' ? 'Timeout' : err.message;
    } finally {
        clearTimeout(timeoutId);
    }

    const end = performance.now();

    return {
        online,
        status,
        latency: Math.round(end - start),
        error
    };
}
