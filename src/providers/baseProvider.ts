export interface CompletionRequest {
	prompt: string;
	maxTokens?: number;
	temperature?: number;
	topP?: number;
}

export interface CompletionResponse {
	text: string;
	model: string;
	tokensUsed: number;
	stopReason?: string;
}

export interface ProviderStatus {
	name: string;
	available: boolean;
	rateLimitUsage: string;
	nextReset?: Date;
}

export abstract class BaseProvider {
	protected apiKey: string | null = null;
	protected rateLimitRemaining = 0;
	protected rateLimitReset = new Date();

	constructor(protected providerName: string) {}

	get id(): string {
		return this.providerName.toLowerCase();
	}

	abstract getCompletion(request: CompletionRequest): Promise<CompletionResponse>;
	abstract getStatus(): ProviderStatus;

	setApiKey(apiKey: string) {
		this.apiKey = apiKey;
	}

	isConfigured(): boolean {
		return !!this.apiKey;
	}

	protected updateRateLimit(remaining: number, reset: Date) {
		this.rateLimitRemaining = remaining;
		this.rateLimitReset = reset;
	}

	protected getRateLimitStatus(): string {
		if (this.rateLimitRemaining === 0 && this.rateLimitReset.getTime() <= Date.now()) {
			return 'Unknown (checked after first request)';
		}
		const now = new Date();
		const secondsUntilReset = (this.rateLimitReset.getTime() - now.getTime()) / 1000;
		return `${this.rateLimitRemaining} remaining (resets in ${Math.max(0, Math.ceil(secondsUntilReset))}s)`;
	}
}
