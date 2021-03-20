import * as path from "path";
import * as fs from "fs";
import { controllers } from "tondev";
import { getCommandInfo } from "./utils";

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf8"));
const commands: any[] = [];
const explorerContext: any[] = [];
const activationEvents = [];


for (const controller of controllers) {
    for (const command of controller.commands) {
        const commandName = `tondev.${controller.name}.${command.name}`;
        commands.push({
            command: commandName,
            category: `tondev-${controller.name}`,
            title: command.title,
        });
        activationEvents.push(`onCommand:${commandName}`);
        const { fileArg, folderArg } = getCommandInfo(command);
        if (fileArg) {
            explorerContext.push({
                when: `resourceExtname =~ ${fileArg.nameRegExp.toString()}`,
                command: commandName,
                group: "TONDev",
            });
        } else if (folderArg) {
            explorerContext.push({
                when: "explorerResourceIsFolder",
                command: commandName,
                group: "TONDev",
            });
        }
    }
}

pkg.contributes.commands = commands;
pkg.contributes.menus = { "explorer/context": explorerContext };
pkg.activationEvents = activationEvents;

fs.writeFileSync(path.resolve(__dirname, "..", "package.json"), JSON.stringify(pkg, undefined, "    "), "utf8");

