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

export async function checkAllServices(servicesList) {
    const results = await Promise.allSettled(
        servicesList.map((service) => checkService(service.url))
    );

    const checkedAt = new Date().toISOString();

    return servicesList.map((service, index) => {
        const result = results[index];
        const check = result.status === 'fulfilled'
            ? result.value
            : {
                online: false,
                status: null,
                latency: null,
                error: result.reason?.message ?? 'Unknown error'
            };

        return {
            id: service.id,
            name: service.name,
            url: service.url,
            online: check.online,
            status: check.status,
            latency: check.latency,
            error: check.error,
            checkedAt
        };
    });
}
