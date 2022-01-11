import { fstat } from "fs";
import { controllers } from "tondev";
import { Command, CommandArg, Terminal } from "tondev";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { TonClient } from "@tonclient/core";
import { libNode } from "@tonclient/lib-node";
TonClient.useBinaryLibrary(libNode);

type OutputTerminal = Terminal & { output: vscode.OutputChannel };
let _tondevTerminal: OutputTerminal | undefined;
function tondevTerminal(): OutputTerminal {
    if (!_tondevTerminal) {
        const output = vscode.window.createOutputChannel("TONDev");
        _tondevTerminal = {
            output,
            log: (...args: any[]) => {
                output.appendLine(args.map((x) => `${x}`).join(""));
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

function getFsPath(uri: vscode.Uri | undefined): string | undefined {
    return uri?.scheme === "file" ? uri.fsPath : undefined;
}

function getContextFilePath(vscodeArgs: any): string | undefined {
    return getFsPath(vscodeArgs) ?? getFsPath(vscodeArgs?.[0]) ?? getFsPath(vscode.window.activeTextEditor?.document.uri);
}

function getContextFolderPath(vscodeArgs: any): string | undefined {
    const filePath = getContextFilePath(vscodeArgs);
    if (filePath) {
        if (fs.statSync(filePath).isDirectory()) {
            return filePath;
        } else {
            return path.dirname(filePath);
        }
    }
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

async function getArgValue(arg: CommandArg, vscodeArgs: any): Promise<string | undefined> {
    if (arg.type === "file") {
        const filePath = getContextFilePath(vscodeArgs);
        if (filePath) {
            return filePath;
        }
    }

    if (arg.type === "folder") {
        const folderPath = getContextFolderPath(vscodeArgs);
        if (folderPath) {
            return folderPath;
        }
    }

    const value = await vscode.window.showInputBox({
        value: arg.defaultValue,
        prompt: arg.title ?? arg.name,
        validateInput: (value) => {
            return value || arg.defaultValue === "" ? "" : "Must be non empty";
        },
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
    const terminal = tondevTerminal();
    terminal.output.show();
    try {
        await command.run(tondevTerminal(), args);
    } catch (err: any) {
        terminal.writeError(err.toString());
    }
}

export function activate(context: vscode.ExtensionContext) {
    for (const controller of controllers) {
        for (const command of controller.commands) {
            const disposable = vscode.commands.registerCommand(
                `tondev.${controller.name}.${command.name}`,
                async (...args: any[]) => {
                    await runCommand(command, args);
                },
            );
            context.subscriptions.push(disposable);
        }
    }
}

export function deactivate() {}
