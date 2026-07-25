import axios from 'axios';
import { BaseProvider, CompletionRequest, CompletionResponse, ProviderStatus } from './baseProvider';

export class CerebrasProvider extends BaseProvider {
	private readonly baseUrl = 'https://api.cerebras.ai/v1';

	constructor(private readonly model: string) { super('Cerebras'); }

	async getCompletion(request: CompletionRequest): Promise<CompletionResponse> {
		if (!this.apiKey) throw new Error('Cerebras API key not configured');
		try {
			const response = await axios.post(`${this.baseUrl}/chat/completions`, {
				model: this.model, messages: [{ role: 'user', content: request.prompt }],
				max_tokens: request.maxTokens, temperature: request.temperature, top_p: request.topP,
			}, { headers: { Authorization: `Bearer ${this.apiKey}` }, timeout: 30_000 });
			this.updateFromHeaders(response.headers);
			return { text: response.data.choices?.[0]?.message?.content ?? '', model: response.data.model ?? this.model,
				tokensUsed: response.data.usage?.total_tokens ?? 0, stopReason: response.data.choices?.[0]?.finish_reason };
		} catch (error: any) { throw new Error(`Cerebras API error: ${error.response?.data?.error?.message ?? error.message}`); }
	}

	private updateFromHeaders(headers: Record<string, unknown>): void {
		const remaining = Number(headers['x-ratelimit-remaining-requests']);
		if (Number.isFinite(remaining)) this.updateRateLimit(remaining, new Date(Date.now() + 60_000));
	}

	getStatus(): ProviderStatus { return { name: 'Cerebras', available: this.isConfigured(), rateLimitUsage: this.getRateLimitStatus(), nextReset: this.rateLimitReset }; }
}
