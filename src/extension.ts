import { fstat } from 'fs';
import { controllers } from 'tondev/dist/controllers';
import { Command, CommandArg, Terminal } from 'tondev/dist/core';
import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";

let _tondevTerminal: Terminal | undefined;
function tondevTerminal(): Terminal {
	if (!_tondevTerminal) {
		const output = vscode.window.createOutputChannel("TONDev");
		_tondevTerminal = {
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
		output.show();
	}
	return _tondevTerminal;
}

async function getArgValue(arg: CommandArg, vscodeArgs: any): Promise<string | undefined> {
	const vscodeFile = vscodeArgs?.fsPath
		?? vscodeArgs?.[0]?.fsPath
		?? vscode.window.activeTextEditor?.document.uri.fsPath;
	if (vscodeFile) {
		if (arg.type === "file") {
			return vscodeFile;
		}
		if (arg.type === "folder") {
			if (fs.statSync(vscodeFile).isDirectory()) {
				return vscodeFile;
			} else {
				return path.dirname(vscodeFile);
			}
		}
	}
	const value = await vscode.window.showInputBox({
		value: arg.defaultValue,
		prompt: arg.title ?? arg.name,
		validateInput: (value) => {
			return value ? "" : "Must be non empty";
		}
	});
	return value;
}

async function runCommand(command: Command, vscodeArgs: any) {
	const args: { [name: string]: any } = {};
	for (const arg of command.args ?? []) {
		const value = await getArgValue(arg, vscodeArgs);
		if (value === undefined) {
			return;
		}
		args[arg.name] = value;
	}
	await command.run(tondevTerminal(), args);
}

export function activate(context: vscode.ExtensionContext) {
	for (const controller of controllers) {
		for (const command of controller.commands) {
			if (controller.name === "sol") {
				const disposable = vscode.commands.registerCommand(`tondev.${controller.name}.${command.name}`, async (...args: any[]) => {
					await runCommand(command, args);
				});
				context.subscriptions.push(disposable);
			}
		}
	}
}

export function deactivate() { }
