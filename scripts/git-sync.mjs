#!/usr/bin/env node
/**
 * Atalho: git pull → add → commit → push
 * Uso: npm run git:sync
 *      npm run git:sync -- "minha mensagem de commit"
 */
import { execSync } from "child_process";

const msg =
  process.argv.slice(2).join(" ").trim() ||
  `Update ${new Date().toLocaleDateString("pt-BR")}`;

try {
  console.log("📥 Pull...");
  execSync("git pull", { stdio: "inherit" });

  console.log("📦 Add...");
  execSync("git add .", { stdio: "inherit" });

  try {
    console.log("💾 Commit...");
    execSync(`git commit -m ${JSON.stringify(msg)}`, { stdio: "inherit" });
  } catch {
    console.log("ℹ️ Nada para commitar");
  }

  console.log("📤 Push...");
  execSync("git push", { stdio: "inherit" });

  console.log("✅ Sincronizado com sucesso!");
} catch (err) {
  process.exit(1);
}
