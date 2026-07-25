import * as vscode from 'vscode';

export class ConfigManager {
	private config = vscode.workspace.getConfiguration('freeLlmRouter');

	getApiKey(provider: string): string | null {
		return this.config.get(`${provider}ApiKey`) || null;
	}

	async setApiKey(provider: string) {
		const input = await vscode.window.showInputBox({
			prompt: `Enter ${provider} API key`,
			password: true,
			ignorefocusOut: true,
		});

		if (input) {
			await this.config.update(`${provider}ApiKey`, input, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage(`${provider} API key saved`);
		}
	}

	getEnabledProviders(): string[] {
		return this.config.get('enabledProviders') || ['groq', 'openrouter'];
	}

	async configureEnabledProviders() {
		const providers = ['groq', 'openrouter', 'cohere', 'cloudflare', 'mistral'];
		const current = this.getEnabledProviders();
		const selected = await vscode.window.showQuickPick(providers, {
			canPickMany: true,
			activeItems: current,
		});

		if (selected) {
			await this.config.update('enabledProviders', selected, vscode.ConfigurationTarget.Workspace);
		}
	}

	getMaxTokens(): number {
		return this.config.get('maxTokens') || 256;
	}
}
