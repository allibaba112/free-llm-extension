import axios from 'axios';
import { BaseProvider, CompletionRequest, CompletionResponse, ProviderStatus } from './baseProvider';

export class GroqProvider extends BaseProvider {
	private readonly baseUrl = 'https://api.groq.com/openai/v1';

	constructor() {
		super('Groq');
	}

	async getCompletion(request: CompletionRequest): Promise<CompletionResponse> {
		if (!this.apiKey) throw new Error('Groq API key not configured');

		try {
			const response = await axios.post(
				`${this.baseUrl}/chat/completions`,
				{
					model: 'mixtral-8x7b-32768',
					messages: [{ role: 'user', content: request.prompt }],
					max_tokens: request.maxTokens || 256,
					temperature: request.temperature || 0.7,
					top_p: request.topP || 0.9,
				},
				{
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						'Content-Type': 'application/json',
					},
				}
			);

			const rateLimitRemaining = response.headers['x-ratelimit-remaining-requests'];
			const rateLimitReset = new Date(
				Date.now() + (parseInt(response.headers['x-ratelimit-reset-requests']) || 60) * 1000
			);

			if (rateLimitRemaining) {
				this.updateRateLimit(parseInt(rateLimitRemaining), rateLimitReset);
			}

			return {
				text: response.data.choices[0]?.message?.content || '',
				model: response.data.model,
				tokensUsed: response.data.usage?.total_tokens || 0,
				stopReason: response.data.choices[0]?.finish_reason,
			};
		} catch (error: any) {
			throw new Error(`Groq API error: ${error.response?.data?.error?.message || error.message}`);
		}
	}

	getStatus(): ProviderStatus {
		return {
			name: this.providerName,
			available: this.isConfigured() && this.rateLimitRemaining > 0,
			rateLimitUsage: this.getRateLimitStatus(),
			nextReset: this.rateLimitReset,
		};
	}
}
