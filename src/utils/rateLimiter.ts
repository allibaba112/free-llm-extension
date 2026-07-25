interface RateLimitEntry {
	requestCount: number;
	windowStart: number;
	limit: number;
	windowMs: number;
}

export class RateLimiter {
	private limits: Map<string, RateLimitEntry> = new Map([
		['GroqProvider', { requestCount: 0, windowStart: Date.now(), limit: 20, windowMs: 60000 }],
		['OpenRouterProvider', { requestCount: 0, windowStart: Date.now(), limit: 50, windowMs: 86400000 }],
	]);

	recordRequest(providerName: string) {
		const entry = this.limits.get(providerName);
		if (!entry) return;

		const now = Date.now();
		if (now - entry.windowStart > entry.windowMs) {
			entry.requestCount = 0;
			entry.windowStart = now;
		}

		entry.requestCount++;
	}

	isLimited(providerName: string): boolean {
		const entry = this.limits.get(providerName);
		if (!entry) return false;

		const now = Date.now();
		if (now - entry.windowStart > entry.windowMs) {
			return false; // Window has reset
		}

		return entry.requestCount >= entry.limit;
	}
}
