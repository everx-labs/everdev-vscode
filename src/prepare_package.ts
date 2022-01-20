import * as path from "path";
import * as fs from "fs";
import {controllers} from "everdev";
import {getCommandInfo} from "./utils";
import * as https from "https";
import * as zlib from "zlib";
import {WriteStream} from "fs";

function downloadAndGunzip(dest: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = https.get(url, response => {
            if (response.statusCode !== 200) {
                reject({
                    message: `Download from ${url} failed with ${response.statusCode}: ${response.statusMessage}`,
                });
                return;
            }
            let file: WriteStream | null = fs.createWriteStream(dest, { flags: "w" });
            let opened = false;
            const failed = (err: Error) => {
                if (file) {
                    file.close();
                    file = null;

                    fs.unlink(dest, () => {
                    });
                    reject(err);
                }
            };

            const unzip = zlib.createGunzip();
            unzip.pipe(file);


            response.pipe(unzip);


            request.on("error", err => {
                failed(err);
            });

            file.on("finish", () => {
                if (opened && file) {
                    resolve();
                }
            });

            file.on("open", () => {
                opened = true;
            });

            file.on("error", err => {
                if (err.code === "EEXIST") {
                    file?.close();
                    reject("File already exists");
                } else {
                    failed(err);
                }
            });
        });
    });
}

const libNodePath = path.resolve(__dirname, "..", "node_modules", "@tonclient", "lib-node");

async function downloadTonClient(platform: string, arch: string) {
    process.stdout.write(`Downloading tonclient.${platform}.${arch}.node... `);
    const targetPath = `${libNodePath}/tonclient.${platform}.${arch}.node`;
    if (fs.existsSync(targetPath)) {
        process.stdout.write("Already exists. Skipped.");
    } else {
        await downloadAndGunzip(
            `${libNodePath}/tonclient.${platform}.node`,
            `https://binaries.tonlabs.io/tonclient_1_nodejs_addon_${arch}-${platform}.gz`,
        );
    }
    process.stdout.write(`\n`);
}

async function main() {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf8"));
    const commands: any[] = [];
    const explorerContext: any[] = [];
    const activationEvents = [];


    for (const controller of controllers) {
        for (const command of controller.commands) {
            const commandName = `everdev.${controller.name}.${command.name}`;
            commands.push({
                command: commandName,
                category: `everdev-${controller.name}`,
                title: command.title,
            });
            activationEvents.push(`onCommand:${commandName}`);
            const {
                fileArg,
                folderArg,
            } = getCommandInfo(command);
            if (fileArg) {
                let pat = fileArg.nameRegExp.toString();
                if (pat === "/\\.abi$/i") {
                    pat = "/\\.abi$|\\.abi\\.json$|\\.tvc$/i";
                }
                explorerContext.push({
                    when: `resourceFilename =~ ${pat}`,
                    command: commandName,
                    group: "EverDev",
                });
            } else if (folderArg) {
                explorerContext.push({
                    when: "explorerResourceIsFolder",
                    command: commandName,
                    group: "EverDev",
                });
            }
        }
    }

    pkg.contributes.commands = commands;
    pkg.contributes.menus = { "explorer/context": explorerContext };
    pkg.activationEvents = activationEvents;

    fs.writeFileSync(path.resolve(__dirname, "..", "package.json"), JSON.stringify(pkg, undefined, "    "), "utf8");
    await downloadTonClient("darwin", "arm64");
    await downloadTonClient("darwin", "x64");
    await downloadTonClient("linux", "x64");
    await downloadTonClient("win32", "x64");
    if (fs.existsSync(path.resolve(libNodePath, "tonclient.node"))) {
        console.log("Deleting tonclient.node...");
        fs.unlinkSync(path.resolve(libNodePath, "tonclient.node"));
    }
    let indexJs = fs.readFileSync(path.resolve(libNodePath, "index.js"), "utf8");
    indexJs = indexJs
        .split("return require('./tonclient.node')")
        .join("return require(`./tonclient.${os.platform()}.${os.arch()}.node`)")
        .split("__dirname, 'tonclient.node'")
        .join("__dirname, `tonclient.${os.platform()}.${os.arch()}.node`");
    fs.writeFileSync(path.resolve(libNodePath, "index.js"), indexJs, "utf8");
}

(async () => {
    try {
        await main();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
