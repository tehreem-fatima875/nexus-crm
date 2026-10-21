import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Run this command in a local interactive terminal.");
  }

  process.stdout.write(prompt);
  const input = process.stdin;
  input.setEncoding("utf8");
  input.setRawMode(true);
  input.resume();

  return new Promise((resolveInput, rejectInput) => {
    let value = "";
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          input.off("data", onData);
          input.setRawMode(false);
          input.pause();
          process.stdout.write("\n");
          rejectInput(new Error("Password reset cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          input.off("data", onData);
          input.setRawMode(false);
          input.pause();
          process.stdout.write("\n");
          resolveInput(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
        } else if (character >= " ") {
          value += character;
        }
      }
    };
    input.on("data", onData);
  });
}

export function updatePassword(contents, password) {
  const lines = contents.split(/\r?\n/);
  const assignment = `DEMO_PASSWORD=${JSON.stringify(password).replace(/\$/g, "\\$")}`;
  let replaced = false;
  const updated = lines.map((line) => {
    if (!/^\s*(?:export\s+)?DEMO_PASSWORD\s*=/.test(line)) return line;
    if (replaced) return "";
    replaced = true;
    return assignment;
  });
  if (!replaced) {
    while (updated.length && updated[updated.length - 1] === "") updated.pop();
    updated.push(assignment);
  }
  return `${updated.join("\n").replace(/\n*$/, "")}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const password = await readHidden("New demo password (input hidden): ");
    if (password.length < 12) {
      throw new Error("Choose a password with at least 12 characters.");
    }
    const confirmation = await readHidden("Confirm demo password (input hidden): ");
    if (password !== confirmation) {
      throw new Error("The passwords did not match; no changes were saved.");
    }

    const envPath = resolve(process.cwd(), ".env.local");
    let contents = "";
    try {
      contents = await readFile(envPath, "utf8");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    await writeFile(envPath, updatePassword(contents, password), { encoding: "utf8", mode: 0o600 });
    process.stdout.write("Demo password saved to the ignored root .env.local. Restart the development server to apply it.\n");
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Password reset failed."}\n`);
    process.exitCode = 1;
  }
}
