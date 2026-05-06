const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

fs.rmSync(distDir, { recursive: true, force: true });
console.log(`Removed build output: ${distDir}`);
