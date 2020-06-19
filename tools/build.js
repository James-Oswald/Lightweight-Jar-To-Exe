
let fs = require("fs");

try{
    process.chdir(__dirname);
    let cCode = fs.readFileSync("../src/main.c").toString();
    let jsCode = fs.readFileSync("../src/converter.js");
    cCode = cCode.replace(/\\/g, "\\\\")
    jsCode += "\n\nprogramString = `" + cCode + "`;\n\nmain();"
    fs.writeFileSync("../build/converter.js", jsCode);
}catch(err){
    console.error(err);
}
