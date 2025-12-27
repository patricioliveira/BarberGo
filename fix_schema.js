const fs = require("fs");
const path = "packages/database/prisma/schema.prisma";
let content = fs.readFileSync(path, "utf8");

// Fix missing braces
const lines = content.split("\n");
let newLines = [];
let insideModel = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("model ") || line.trim().startsWith("enum ")) {
     if (insideModel) {
         // Check if previous non-empty line was a closing brace
         let j = newLines.length - 1;
         while (j >= 0 && newLines[j].trim() === "") j--;
         if (j >= 0 && !newLines[j].trim().endsWith("}")) {
             newLines.push("}");
         }
     }
     insideModel = true;
  }
  newLines.push(line);
}
// Check last line
let j = newLines.length - 1;
while (j >= 0 && newLines[j].trim() === "") j--;
if (j >= 0 && !newLines[j].trim().endsWith("}")) {
    newLines.push("}");
}

fs.writeFileSync(path, newLines.join("\n"));

