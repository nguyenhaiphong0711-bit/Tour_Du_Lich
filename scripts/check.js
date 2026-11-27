const fs = require("fs");
const path = require("path");
const vm = require("vm");
const pug = require("pug");
let js = 0, views = 0;
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if(["node_modules", ".git"].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if(entry.isDirectory()) walk(file);
    else if(file.endsWith(".js")) { new vm.Script(fs.readFileSync(file, "utf8"), { filename: file }); js++; }
    else if(file.endsWith(".pug")) { pug.compileFile(file); views++; }
  }
};
walk(path.join(__dirname, ".."));
console.log(`Đã kiểm tra cú pháp ${js} file JavaScript và biên dịch ${views} template Pug.`);
