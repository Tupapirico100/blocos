import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("dist", { recursive: true });
copyFileSync("src/styles.css", "dist/styles.css");
console.log("tokens: styles.css copiado");
