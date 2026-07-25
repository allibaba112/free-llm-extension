import axios from 'axios';
import { BaseProvider, CompletionRequest, CompletionResponse, ProviderStatus } from './baseProvider';

export class MistralProvider extends BaseProvider {
	private readonly baseUrl = 'https://api.mistral.ai/v1';

	constructor(private readonly model: string) { super('Mistral'); }

	async getCompletion(request: CompletionRequest): Promise<CompletionResponse> {
		if (!this.apiKey) throw new Error('Mistral API key not configured');
		try {
			const response = await axios.post(`${this.baseUrl}/chat/completions`, {
				model: this.model, messages: [{ role: 'user', content: request.prompt }],
				max_tokens: request.maxTokens, temperature: request.temperature, top_p: request.topP,
			}, { headers: { Authorization: `Bearer ${this.apiKey}` }, timeout: 30_000 });
			return { text: response.data.choices?.[0]?.message?.content ?? '', model: response.data.model ?? this.model,
				tokensUsed: response.data.usage?.total_tokens ?? 0, stopReason: response.data.choices?.[0]?.finish_reason };
		} catch (error: any) { throw new Error(`Mistral API error: ${error.response?.data?.message ?? error.message}`); }
	}

	getStatus(): ProviderStatus { return { name: 'Mistral', available: this.isConfigured(), rateLimitUsage: this.getRateLimitStatus(), nextReset: this.rateLimitReset }; }
}
