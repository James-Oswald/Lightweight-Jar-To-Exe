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
    let reqCmds = ["xxd", "gcc", "jar", "javac"];
    for(let i = 0; i < reqCmds; i++)
        if(!commandExists(reqCmds)){
            console.err("Error: This program requires the command \"" + reqCmds[i] + "\", which can not be found on your path!");
            return;
        }
    if(process.argv.length <= 2){
        console.err("Error: provide a .jar file as an argument");
        return;
    }
    let jarName = process.argv[2];
    try{
        fs.writeFileSync("./tmp/main.c", programString);
        fs.copyFileSync(jarName, "./tmp/prog.jar");
        let javaHome = path.dirname(path.dirname(cp.execSync("where javac")));
        cp.execSync("xxd -i ./tmp/prog.jar > ./temp/jar.h");
    }catch(err){
        console.err(err);
        return;
    }
    
    
}

main();