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

programString = `
#include<stdlib.h>
#include<stdio.h>
#include<stdbool.h>
#include<windows.h>
#include<jni.h>

#include"jarinfo.h"
#include"jar.h"

#define numOptions 1

void getPath(char* pathBuffer){
    GetModuleFileName(NULL, pathBuffer, MAX_PATH);
    int end = -1;
    for(int i = 0; pathBuffer[i] != '\\0'; i++)
        if(pathBuffer[i] == '/' || pathBuffer[i] == '\\\\')
            end = i;
    pathBuffer[end + 1] = '\\0';
}

int main(){
    char pathBuffer[MAX_PATH];
    getPath(pathBuffer);
    char classPath[MAX_PATH];
    char optString[MAX_PATH];
    sprintf(classPath, "%sprog.jar", pathBuffer);
    sprintf(optString, "-Djava.class.path=%s", classPath);
    FILE* file = fopen(classPath, "w+b");
    printf("%s\\n", optString);
    if(file == NULL){
        printf("Error: Failed to open file!\\n");
        goto fileFail;
    }
    fwrite(prog_jar, sizeof(unsigned char), prog_jar_len, file);
    fclose(file);
    JavaVM* jvm = NULL;
	JNIEnv* env = NULL;
    JavaVMOption* options = malloc(sizeof(JavaVMOption) * numOptions);
    options[0].optionString = optString;
    JavaVMInitArgs vm_args;   
	vm_args.version = JNI_VERSION_1_6;   
	vm_args.nOptions = numOptions;   
	vm_args.options = options;
    vm_args.ignoreUnrecognized = true; 
    if(JNI_CreateJavaVM(&jvm, (void**)&env, &vm_args) != JNI_OK){
        printf("Error: Failed to create VM\\n");
        goto vmFail; //That's right I'm edgy, check out these sick gotos
    }
    jint ver = (*env)->GetVersion(env);
    printf("JNI version %d.%d init sucessful\\n", ver>>16, ver&0x0f);
    jclass mainClass = (*env)->FindClass(env, mainClassName);
    if(mainClass == NULL){
        (*env)->ExceptionDescribe(env);
        printf("\\nError: Failed to create main class %s\\n", mainClassName);
        goto vmErr;
    }
    jmethodID mainMethod = (*env)->GetStaticMethodID(env, mainClass, "main", "([Ljava/lang/String;)V");
    if(mainMethod == NULL){
        (*env)->ExceptionDescribe(env);
        printf("\\nError: Failed to find main method %s\\n", mainClassName);
        goto vmErr;
    }
    jobjectArray args = (*env)->NewObjectArray(env, 1, (*env)->FindClass(env, "java/lang/String"), NULL);
    jstring arg0 = (*env)->NewStringUTF(env, mainClassName);
    (*env)->SetObjectArrayElement(env, args, 0, arg0);
    (*env)->CallStaticVoidMethod(env, mainClass, mainMethod, args);
    vmErr:
    (*jvm)->DestroyJavaVM(jvm);
    vmFail:
    remove("prog.jar");
    free(options);
    fileFail:
    return 0;
}`;

main();