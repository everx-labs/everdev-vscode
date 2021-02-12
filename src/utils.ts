import { Command, CommandArg, FileArg, FolderArg } from "tondev";

export type CommandInfo = {
	fileArg: FileArg | null,
	folderArg: FolderArg | null,
};

export function getCommandInfo(command: Command): CommandInfo {
	const info: CommandInfo = {
		fileArg: null,
		folderArg: null,
	};
	for (const arg of command.args ?? []) {
		if (arg.type === "file") {
			info.fileArg = arg;
		} else if (arg.type === "folder") {
			info.folderArg = arg;
		}
	}
	return info;
}

