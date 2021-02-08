import { compileSolidity } from 'tondev/dist/controllers/solidity/compiler';
import { Terminal } from 'tondev/dist/core';
import * as vscode from 'vscode';

let tonDevOutput: vscode.OutputChannel | undefined;
function tondevTerminal(): Terminal {
	if (!tonDevOutput) {
		tonDevOutput = vscode.window.createOutputChannel("TONDev");
	}
	const output = tonDevOutput;
	output.show();
	return {
		log: (...args: any[]) => {
			output.appendLine(args.map(x => `${x}`).join(""));
		},
		writeError: (text: string) => {
			output.append(text);
		},
		write: (text: string) => {
			output.append(text);
		},
	};
}

async function solCompileCommand(args: any) {
	const filePath = args?.fsPath ?? vscode.window.activeTextEditor?.document.uri.fsPath;
	if (!filePath) {
		vscode.window.showInformationMessage("No file selected");
		return;
	}
	await compileSolidity(tondevTerminal(), { file: filePath });
}

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('tondev.solCompile', solCompileCommand);
	context.subscriptions.push(disposable);
}

export function deactivate() { }
