"use strict"

let fs = require("fs");
let path = require("path");
let cp = require("child_process");

let programString = ``;

function commandExists(cmd){
    try{
        cp.execSync("where " + cmd, {stdio:["ignore"]});
        return true;
    }catch(err){
        return false;
    }
}

function main(){
    process.chdir(__dirname);
    let reqCmds = ["xxd", "gcc", "jar", "javac"];
    for(let i = 0; i < reqCmds; i++)
        if(!commandExists(reqCmds)){
            console.error("Error: This program requires the command \"" + reqCmds[i] + "\", which can not be found on your path!");
            return;
        }
    if(process.argv.length <= 2){
        console.error("Error: provide a .jar file as an argument");
        return;
    }
    let jarName = process.argv[2];
    try{
        fs.mkdirSync("./tmp", {recursive: true});
        process.chdir(__dirname + "/tmp");
        fs.writeFileSync("main.c", programString);
        fs.copyFileSync("../" + jarName, "prog.jar");

        //go into the jar mainifest and extract main-class and generate a .h file with it
        cp.execSync("jar xf prog.jar META-INF/MANIFEST.MF");
        let manifestLines = fs.readFileSync("META-INF/MANIFEST.MF").toString().split("\n");
        let mainifestProp = {};
        for(let i = 0; i < manifestLines.length; i++){
            if(manifestLines[i].includes(":")){
                let pair = manifestLines[i].split(":");
                pair[1] = pair[1].trim();
                mainifestProp[pair[0]] = pair[1];
            }
        }
        if(mainifestProp["Main-Class"] == undefined){
            throw new Error("Error: The .jar file \"" + jarName + "\" did not have a Main-Class specified, not executable");
        }
        let jarinfo = "const char* mainClassName = \"" + mainifestProp["Main-Class"] + "\";";
        fs.writeFileSync("jarinfo.h", jarinfo);

        //store the raw jar data within a .h file to be packaged into the exe
        cp.execSync("xxd -i prog.jar > jar.h");

        //complile the program into an Exe
        let javaBin = path.dirname(cp.execSync("where javac").toString());
        let javaHome = javaBin.split(path.sep).slice(0, -1).join(path.sep);
        let execName = path.parse(jarName).name + ".exe";
        let gcc = [
            "gcc",
            "-g",
            "main.c",
            "-o" + execName,
            "-I\"" + javaHome + "\\include\"",
            "-I\"" + javaHome + "\\include\\win32\"",
            "-L\"" + javaHome + "\\lib\"",
            "-ljvm"
        ].join(" ");
        cp.execSync(gcc);
        fs.copyFileSync(execName, "../" + execName);
        process.chdir(__dirname);
        fs.rmdirSync("./tmp", {recursive: true});
    }catch(err){
        console.error(err);
        return;
    }
}

//C++ code to load the jar