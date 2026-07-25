import axios from 'axios';
import { BaseProvider, CompletionRequest, CompletionResponse, ProviderStatus } from './baseProvider';

export class CloudflareProvider extends BaseProvider {
	private accountId: string | null = null;
	private readonly baseUrl = 'https://api.cloudflare.com/client/v4';

	constructor(private readonly model: string) { super('Cloudflare'); }

	setAccountId(accountId: string | null): void { this.accountId = accountId; }

	async getCompletion(request: CompletionRequest): Promise<CompletionResponse> {
		if (!this.apiKey || !this.accountId) throw new Error('Cloudflare API token or account ID not configured');
		try {
			const response = await axios.post(`${this.baseUrl}/accounts/${this.accountId}/ai/run/${this.model}`, {
				prompt: request.prompt, max_tokens: request.maxTokens, temperature: request.temperature,
			}, { headers: { Authorization: `Bearer ${this.apiKey}` }, timeout: 30_000 });
			if (!response.data.success) throw new Error(response.data.errors?.[0]?.message ?? 'Unknown error');
			return { text: response.data.result?.response ?? '', model: this.model, tokensUsed: 0 };
		} catch (error: any) { throw new Error(`Cloudflare API error: ${error.response?.data?.errors?.[0]?.message ?? error.message}`); }
	}

	getStatus(): ProviderStatus { return { name: 'Cloudflare', available: this.isConfigured() && !!this.accountId, rateLimitUsage: 'Provider-managed quota' }; }
}
