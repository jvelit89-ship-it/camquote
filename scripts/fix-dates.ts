import * as fs from "fs";
import * as path from "path";

function replaceInDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
      const content = fs.readFileSync(fullPath, "utf8");
      // Replace variations of new Date().toISOString()
      const newContent = content.replace(/new Date\(\)\.toISOString\(\)/g, "new Date()");
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, "utf8");
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceInDir("src/app/api");
console.log("Done replacing.");
