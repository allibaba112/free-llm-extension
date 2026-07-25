import * as vscode from 'vscode';

export class ConfigManager {
	private config = vscode.workspace.getConfiguration('freeLlmRouter');
	private static readonly providers = ['groq', 'openrouter', 'cohere', 'cloudflare', 'mistral', 'cerebras'];

	constructor(private readonly context: vscode.ExtensionContext) {}

	async getApiKey(provider: string): Promise<string | null> {
		return (await this.context.secrets.get(`freeLlmRouter.${provider}.apiKey`)) || null;
	}

	async setApiKey(provider: string): Promise<boolean> {
		if (!ConfigManager.providers.includes(provider)) {
			throw new Error(`Unsupported provider: ${provider}`);
		}
		const input = await vscode.window.showInputBox({
			prompt: `Enter ${provider} API key`,
			password: true,
			ignoreFocusOut: true,
		});

		if (input?.trim()) {
			await this.context.secrets.store(`freeLlmRouter.${provider}.apiKey`, input.trim());
			vscode.window.showInformationMessage(`${provider} API key saved`);
			return true;
		}
		return false;
	}

	getEnabledProviders(): string[] {
		return this.config.get('enabledProviders') || ['groq', 'openrouter'];
	}

	async configureEnabledProviders() {
		const providers = ConfigManager.providers;
		const selected = await vscode.window.showQuickPick(providers, {
			canPickMany: true,
			placeHolder: `Currently enabled: ${this.getEnabledProviders().join(', ')}`,
		});

		if (selected) {
			await this.config.update('enabledProviders', selected, vscode.ConfigurationTarget.Workspace);
		}
	}

	getMaxTokens(): number {
		return Math.max(1, Math.min(4096, this.config.get<number>('maxTokens') ?? 256));
	}

	getCloudflareAccountId(): string | null {
		return this.config.get<string>('cloudflareAccountId')?.trim() || null;
	}

	getModel(provider: string, fallback: string): string {
		return this.config.get<string>(`${provider}Model`)?.trim() || fallback;
	}
}
