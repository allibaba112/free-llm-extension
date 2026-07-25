import * as vscode from 'vscode';
import { ProviderManager } from './providers/providerManager';
import { StatusBarManager } from './views/statusBar';
import { ConfigManager } from './utils/config';

export async function activate(context: vscode.ExtensionContext) {
	const configManager = new ConfigManager();
	const providerManager = new ProviderManager(configManager);
	const statusBar = new StatusBarManager();

	// Initialize providers
	await providerManager.initialize();
	statusBar.update('Ready', 'circle');

	// Configure providers command
	context.subscriptions.push(
		vscode.commands.registerCommand('freeLlmRouter.configure', async () => {
			const quickPick = vscode.window.createQuickPick();
			quickPick.items = [
				{ label: 'Set Groq API Key', provider: 'groq' },
				{ label: 'Set OpenRouter API Key', provider: 'openrouter' },
				{ label: 'Set Cohere API Key', provider: 'cohere' },
				{ label: 'View Provider Status', provider: 'status' },
				{ label: 'Manage Enabled Providers', provider: 'manage' },
			] as any;
			quickPick.onDidChangeSelection(async (selection) => {
				if (selection[0]?.provider === 'status') {
					await vscode.commands.executeCommand('freeLlmRouter.showStatus');
				} else if (selection[0]?.provider === 'manage') {
					await configManager.configureEnabledProviders();
				} else if (selection[0]?.provider) {
					await configManager.setApiKey(selection[0].provider);
				}
				quickPick.hide();
			});
			quickPick.show();
		})
	);

	// Show status command
	context.subscriptions.push(
		vscode.commands.registerCommand('freeLlmRouter.showStatus', async () => {
			const status = await providerManager.getProviderStatus();
			const message = Object.entries(status)
				.map(([name, info]: [string, any]) => 
					`${name}: ${info.available ? '✓ Available' : '✗ Unavailable'} (${info.rateLimitUsage})`
				)
				.join('\n');
			vscode.window.showInformationMessage(message);
		})
	);

	// Get completion command
	context.subscriptions.push(
		vscode.commands.registerCommand('freeLlmRouter.complete', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor');
				return;
			}

			statusBar.update('Fetching...', 'loading');
			try {
				const selection = editor.selection;
				const prompt = editor.document.getText(
					new vscode.Range(
						Math.max(0, selection.start.line - 10),
						0,
						selection.end.line,
						selection.end.character
					)
				);

				const completion = await providerManager.getCompletion(prompt);
				
				editor.edit((editBuilder) => {
					editBuilder.insert(selection.end, completion);
				});

				statusBar.update('Ready', 'circle');
			} catch (error) {
				vscode.window.showErrorMessage(`Completion failed: ${error}`);
				statusBar.update('Error', 'error');
			}
		})
	);

	// Completion provider (inline suggestions)
	context.subscriptions.push(
		vscode.languages.registerInlineCompletionItemProvider(
			{ pattern: '**' },
			{
				async provideInlineCompletionItems(document, position, context, token) {
					try {
						const line = document.lineAt(position.line).text;
						const prompt = document.getText(
							new vscode.Range(
								Math.max(0, position.line - 5),
								0,
								position.line,
								position.character
							)
						);

						if (token.isCancellationRequested) return;

						const completion = await providerManager.getCompletion(prompt);
						
						return [{
							insertText: completion,
							range: new vscode.Range(position, position),
						}];
					} catch (error) {
						console.error('Inline completion error:', error);
						return [];
					}
				},
			}
		)
	);
}

export function deactivate() {}
