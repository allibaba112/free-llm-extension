import axios from 'axios';
import { BaseProvider, CompletionRequest, CompletionResponse, ProviderStatus } from './baseProvider';

export class OpenRouterProvider extends BaseProvider {
	private readonly baseUrl = 'https://openrouter.ai/api/v1';

	constructor() {
		super('OpenRouter');
	}

	async getCompletion(request: CompletionRequest): Promise<CompletionResponse> {
		if (!this.apiKey) throw new Error('OpenRouter API key not configured');

		try {
			const response = await axios.post(
				`${this.baseUrl}/chat/completions`,
				{
					model: 'mistralai/mistral-7b-instruct:free',
					messages: [{ role: 'user', content: request.prompt }],
					max_tokens: request.maxTokens || 256,
					temperature: request.temperature || 0.7,
				},
				{
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						'HTTP-Referer': 'https://github.com/allibaba112/free-llm-extension',
						'X-Title': 'Free LLM VS Code Extension',
					},
				}
			);

			return {
				text: response.data.choices[0]?.message?.content || '',
				model: response.data.model,
				tokensUsed: response.data.usage?.total_tokens || 0,
				stopReason: response.data.choices[0]?.finish_reason,
			};
		} catch (error: any) {
			throw new Error(`OpenRouter API error: ${error.response?.data?.error?.message || error.message}`);
		}
	}

	getStatus(): ProviderStatus {
		return {
			name: this.providerName,
			available: this.isConfigured(),
			rateLimitUsage: '20 requests/min, 50/day',
		};
	}
}
