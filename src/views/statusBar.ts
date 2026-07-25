import * as vscode from 'vscode';

export class StatusBarManager {
	private statusBarItem: vscode.StatusBarItem;

	constructor() {
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		this.statusBarItem.command = 'freeLlmRouter.showStatus';
		this.statusBarItem.show();
	}

	update(text: string, state: 'circle' | 'loading' | 'error') {
		const icons: Record<string, string> = {
			circle: '$(circle-filled)',
			loading: '$(loading~spin)',
			error: '$(error)',
		};
		this.statusBarItem.text = `${icons[state]} Free LLM: ${text}`;
	}
}
