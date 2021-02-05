import * as vscode from 'vscode';
import { SolidityCompileTaskProvider } from './solidity/compile';
let solidityCompileTaskProvider: vscode.Disposable | undefined;
export function activate(context: vscode.ExtensionContext) {
	// let disposable = vscode.commands.registerCommand('tondev.solidity.compile', solidityCompile);
	// context.subscriptions.push(disposable);

	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		return;
	}
		
	solidityCompileTaskProvider = vscode.tasks.registerTaskProvider(
		SolidityCompileTaskProvider.TONDev, 
		new SolidityCompileTaskProvider(),
	);
}

export function deactivate() {}
