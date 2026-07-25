import { GroqProvider } from './groqProvider';
import { OpenRouterProvider } from './openrouterProvider';
import { CohereProvider } from './cohereProvider';
import { CloudflareProvider } from './cloudflareProvider';
import { MistralProvider } from './mistralProvider';
import { CerebrasProvider } from './cerebrasProvider';
import { BaseProvider, ProviderStatus } from './baseProvider';
import { ConfigManager } from '../utils/config';
import { RateLimiter } from '../utils/rateLimiter';

export class ProviderManager {
	private providers: Map<string, BaseProvider> = new Map();
	private rateLimiter: RateLimiter;
	private currentProviderIndex = 0;

	constructor(private configManager: ConfigManager) {
		this.rateLimiter = new RateLimiter();
	}

	async initialize(): Promise<void> {
		const providers: BaseProvider[] = [
			new GroqProvider(this.configManager.getModel('groq', 'llama-3.3-70b-versatile')),
			new OpenRouterProvider(this.configManager.getModel('openrouter', 'meta-llama/llama-3.3-70b-instruct:free')),
			new CohereProvider(this.configManager.getModel('cohere', 'command-a-03-2025')),
			new MistralProvider(this.configManager.getModel('mistral', 'mistral-small-latest')),
			new CerebrasProvider(this.configManager.getModel('cerebras', 'gpt-oss-120b')),
			new CloudflareProvider(this.configManager.getModel('cloudflare', '@cf/meta/llama-3.1-8b-instruct')),
		];

		for (const provider of providers) {
			const key = await this.configManager.getApiKey(provider.id);
			if (key) provider.setApiKey(key);
			if (provider instanceof CloudflareProvider) {
				provider.setAccountId(this.configManager.getCloudflareAccountId());
			}
			this.providers.set(provider.id, provider);
		}
	}

	async getCompletion(prompt: string): Promise<string> {
		const enabledProviders = this.configManager.getEnabledProviders();
		const availableProviders = Array.from(this.providers.values()).filter(
			(p) => enabledProviders.includes(p.id) && p.isConfigured()
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
