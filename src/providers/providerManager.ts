import { GroqProvider } from './groqProvider';
import { OpenRouterProvider } from './openrouterProvider';
import { BaseProvider, CompletionResponse, ProviderStatus } from './baseProvider';
import { ConfigManager } from '../utils/config';
import { RateLimiter } from '../utils/rateLimiter';

export class ProviderManager {
	private providers: Map<string, BaseProvider> = new Map();
	private rateLimiter: RateLimiter;
	private currentProviderIndex = 0;

	constructor(private configManager: ConfigManager) {
		this.rateLimiter = new RateLimiter();
	}

	async initialize() {
		const groqProvider = new GroqProvider();
		const openRouterProvider = new OpenRouterProvider();

		const groqKey = this.configManager.getApiKey('groq');
		const openRouterKey = this.configManager.getApiKey('openrouter');

		if (groqKey) groqProvider.setApiKey(groqKey);
		if (openRouterKey) openRouterProvider.setApiKey(openRouterKey);

		this.providers.set('groq', groqProvider);
		this.providers.set('openrouter', openRouterProvider);
	}

	async getCompletion(prompt: string): Promise<string> {
		const enabledProviders = this.configManager.getEnabledProviders();
		const availableProviders = Array.from(this.providers.values()).filter(
			(p) => enabledProviders.includes((p as any).providerName.toLowerCase()) && p.isConfigured()
		);

		if (availableProviders.length === 0) {
			throw new Error('No providers configured. Run "Free LLM: Configure Providers"');
		}

		// Round-robin through providers for load balancing
		let attempts = 0;
		while (attempts < availableProviders.length) {
			const provider = availableProviders[this.currentProviderIndex % availableProviders.length];
			this.currentProviderIndex++;

			try {
				// Check rate limit before attempting
				if (this.rateLimiter.isLimited(provider.constructor.name)) {
					attempts++;
					continue;
				}

				const response = await provider.getCompletion({
					prompt,
					maxTokens: this.configManager.getMaxTokens(),
					temperature: 0.7,
				});

				this.rateLimiter.recordRequest(provider.constructor.name);
				return response.text;
			} catch (error) {
				console.error(`Provider ${provider.constructor.name} failed:`, error);
				attempts++;
			}
		}

		throw new Error('All providers exhausted or rate limited');
	}

	async getProviderStatus(): Promise<Record<string, ProviderStatus>> {
		const status: Record<string, ProviderStatus> = {};
		for (const [name, provider] of this.providers) {
			status[name] = provider.getStatus();
		}
		return status;
	}
}
