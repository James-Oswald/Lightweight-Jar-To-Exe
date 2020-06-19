
let fs = require("fs");
let cp = require("child_process");

function commandExists(cmd){
    try{
        cp.execSync("where " + cmd, {stdio:["ignore"]});
        return true;
    }catch(err){
        return false;
    }
}

function main(){
    let reqCmds = ["xxd", "gcc"];
    for(let i = 0; i < reqCmds; i++)
        if(!commandExists(reqCmds)){
            console.err("This program requires the command \"" + reqCmds[i] + "\"");
            return;
        }
    
}

main();

/*
fs.copyFile('source.txt', 'destination.txt', function(err){
    if(err) throw err;
    console.log('source.txt was copied to destination.txt');
});*/