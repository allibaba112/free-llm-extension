import axios from 'axios';
import { BaseProvider, CompletionRequest, CompletionResponse, ProviderStatus } from './baseProvider';

export class CohereProvider extends BaseProvider {
	private readonly baseUrl = 'https://api.cohere.com/v2';

	constructor(private readonly model: string) { super('Cohere'); }

	async getCompletion(request: CompletionRequest): Promise<CompletionResponse> {
		if (!this.apiKey) throw new Error('Cohere API key not configured');
		try {
			const response = await axios.post(`${this.baseUrl}/chat`, {
				model: this.model, messages: [{ role: 'user', content: request.prompt }],
				max_tokens: request.maxTokens, temperature: request.temperature, p: request.topP,
			}, { headers: { Authorization: `Bearer ${this.apiKey}` }, timeout: 30_000 });
			return { text: response.data.message?.content?.map((part: { text?: string }) => part.text ?? '').join('') ?? '', model: response.data.model ?? this.model,
				tokensUsed: response.data.usage?.tokens?.input_tokens + response.data.usage?.tokens?.output_tokens || 0, stopReason: response.data.finish_reason };
		} catch (error: any) { throw new Error(`Cohere API error: ${error.response?.data?.message ?? error.message}`); }
	}

	getStatus(): ProviderStatus { return { name: 'Cohere', available: this.isConfigured(), rateLimitUsage: this.getRateLimitStatus(), nextReset: this.rateLimitReset }; }
}
