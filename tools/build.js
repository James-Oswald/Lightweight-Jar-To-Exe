"use strict";

let fs = require("fs");
let cp = require("child_process");
let path = require("path");


function childDir(p){
    return fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());
}

try{
    process.chdir(__dirname);
    let cCode = fs.readFileSync("../src/main.c").toString();
    let jsCode = fs.readFileSync("../src/converter.js");
    cCode = cCode.replace(/\\/g, "\\\\")
    jsCode += "\n\nprogramString = `" + cCode + "`;\n\nmain();"
    fs.writeFileSync("../build/converter.js", jsCode);

    //Build examples
    let examples = childDir("../examples/");
    for(let i = 0; i < examples.length; i++){
        let examplePath = "../examples/" + examples[i];
        fs.writeFileSync(examplePath + "/converter.js", jsCode);
        fs.rmdirSync(examplePath + "/before", {recursive: true});
        fs.rmdirSync(examplePath + "/after", {recursive: true});
        fs.mkdirSync(examplePath + "/before", {recursive: true});
        fs.mkdirSync(examplePath + "/after", {recursive: true});
        let exFiles = fs.readdirSync(examplePath);
        let jarFile = null;
        for(let j = 0; j < exFiles.length; j++){
            let exFilePath = examplePath + "/" + exFiles[j];
            if(!fs.statSync(exFilePath).isDirectory()){
                fs.copyFileSync(exFilePath, examplePath + "/before/" + exFiles[j]);
                fs.copyFileSync(exFilePath, examplePath + "/after/" + exFiles[j]);
                if(exFiles[j].includes(".jar"))
                    jarFile = exFiles[j];
            }
        }
        if(jarFile == null){
            console.error("No jar was detected in example:" + examples[i]);
            continue;
        }
        fs.unlinkSync(examplePath + "/converter.js");
        cp.execSync("node " + examplePath + "/after/converter.js " + jarFile);
    }
}catch(err){
    console.error(err);
}
