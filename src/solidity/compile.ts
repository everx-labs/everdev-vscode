import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import {compileSolidity} from "tondev/dist/controllers/solidity/compiler";
import {Terminal} from "tondev/dist/core";

interface SolidityCompileTaskDefinition extends vscode.TaskDefinition {
}

export class SolidityCompileTaskProvider implements vscode.TaskProvider {
    static TONDev = 'tondev';
    private tasks: vscode.Task[] | undefined;

    constructor() { }

    public async provideTasks(): Promise<vscode.Task[]> {
        return this.getTasks();
    }

    public resolveTask(_task: vscode.Task): vscode.Task | undefined {
        return undefined;
    }

    private getTasks(): vscode.Task[] {
        if (this.tasks !== undefined) {
            return this.tasks;
        }
        this.tasks = [];
        const currentPath = vscode.window.activeTextEditor?.document.uri.fsPath;
        if (currentPath) {
            this.tasks.push(this.getTask(currentPath))
        }

        return this.tasks;
    }

    private getTask(filePath: string, definition?: SolidityCompileTaskDefinition): vscode.Task {
        if (definition === undefined) {
            definition = {
                type: SolidityCompileTaskProvider.TONDev,
            };
        }
        return new vscode.Task(definition, vscode.TaskScope.Workspace, `Compile FreeTON Solidity`,
            SolidityCompileTaskProvider.TONDev, new vscode.CustomExecution(async (): Promise<vscode.Pseudoterminal> => {
                return new SolidityCompileTerminal(filePath);
            }));
    }
}

class SolidityCompileTerminal implements vscode.Pseudoterminal {
    private writeEmitter = new vscode.EventEmitter<string>();
    onDidWrite: vscode.Event<string> = this.writeEmitter.event;
    private closeEmitter = new vscode.EventEmitter<void>();
    onDidClose?: vscode.Event<void> = this.closeEmitter.event;

    constructor(private filePath: string) {
    }

    open(initialDimensions: vscode.TerminalDimensions | undefined): void {
        this.doBuild();
    }

    close(): void {
    }

    private tondevTerminal(): Terminal {
        return {
            write: (text: string) => {
                this.writeEmitter.fire(text.replace(/\r?\n/g, "\r\n"));
            },
            log: (...args: any[]) => {
                const text = `${args.map(x => `${x}`).join("\r\n")}\r\n`;
                this.writeEmitter.fire(text.replace(/\r?\n/g, "\r\n"));
            }
        }
    }

    private log(message: string) {
        this.writeEmitter.fire(message.replace(/\r?\n/g, "\r\n"));
    }

    private async doBuild(): Promise<void> {
        await compileSolidity(this.tondevTerminal(), { file: this.filePath});
        this.closeEmitter.fire();
    }
}