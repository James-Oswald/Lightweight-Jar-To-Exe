
//#define DEBUG

#ifndef DEBUG
#define printf(...)
#endif

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
    for(int i = 0; pathBuffer[i] != '\0'; i++)
        if(pathBuffer[i] == '/' || pathBuffer[i] == '\\')
            end = i;
    pathBuffer[end + 1] = '\0';
}

void deleteJar(char* jarName){
    BOOL delstatus = DeleteFileA((LPCSTR)jarName);
    if(delstatus != 0){
        DWORD errorCode = GetLastError();
        printf("\nError: Failed to delete the jar, %s, windows error code: %d\n", jarName, errorCode);
    }
}

void runJar(char* jarName){
    char classPath[MAX_PATH];
    char optString[MAX_PATH];
    char pathBuffer[MAX_PATH];
    getPath(pathBuffer);
    sprintf(classPath, "%s%s", pathBuffer, jarName);
    sprintf(optString, "-Djava.class.path=%s", classPath);
    FILE* file = fopen(classPath, "w+b");
    printf("%s\n", optString);
    if(file == NULL){
        printf("Error: Failed to open file!\n");
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
        printf("Error: Failed to create VM\n");
        goto vmFail; //That's right I'm edgy, check out these gotos
    }
    free(options);
    jint ver = (*env)->GetVersion(env);
    printf("JNI version %d.%d init sucessful\n", ver>>16, ver&0x0f);
    jclass mainClass = (*env)->FindClass(env, mainClassName);
    if(mainClass == NULL){
        (*env)->ExceptionDescribe(env);
        printf("\nError: Failed to create main class %s\n", mainClassName);
        goto vmErr;
    }
    jmethodID mainMethod = (*env)->GetStaticMethodID(env, mainClass, "main", "([Ljava/lang/String;)V");
    if(mainMethod == NULL){
        (*env)->ExceptionDescribe(env);
        printf("\nError: Failed to find main method %s\n", mainClassName);
        goto vmErr;
    }
    jobjectArray args = (*env)->NewObjectArray(env, 1, (*env)->FindClass(env, "java/lang/String"), NULL);
    jstring arg0 = (*env)->NewStringUTF(env, mainClassName);
    (*env)->SetObjectArrayElement(env, args, 0, arg0);
    //system("pause");
    (*env)->CallStaticVoidMethod(env, mainClass, mainMethod, args);
    vmErr:;
    if((*env)->GetJavaVM(env, &jvm) != 0)
        (*jvm)->DestroyJavaVM(jvm);
    vmFail:;
    deleteJar(jarName);
    fileFail:;
}

void createJarProcess(char* jarName){
    STARTUPINFO si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&pi, sizeof(pi));
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    char moduleNameBuffer[MAX_PATH];
    char cmdBuffer[MAX_PATH];
    GetModuleFileName(NULL, moduleNameBuffer, MAX_PATH);
    sprintf(cmdBuffer, "%s --type jar", moduleNameBuffer);
    BOOL created = CreateProcessA(NULL, (LPSTR)cmdBuffer, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi);
    if(!created){
        DWORD errorCode = GetLastError();
        printf("Failed to create subProcess");
    }
    WaitForSingleObject(pi.hProcess, INFINITE);
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    deleteJar(jarName);
    //system("pause");
}

int main(int argc, char* argv[]){
    char* mode = "normal";
    for(int i = 0; i < argc; i++)
        if(strcmp("--type", argv[i]) == 0 && i + 1 < argc)
            mode = argv[i + 1];
    char jarName[MAX_PATH];
    sprintf(jarName, "%s.jar", mainClassName);
    if(strcmp(mode, "normal") == 0)
        createJarProcess(jarName);
    else if(strcmp(mode, "jar") == 0)
        runJar(jarName);
    else 
        printf("%s is not a valid mode", mode);
    return 0;
}

int CALLBACK WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow){
    return main(__argc, __argv);
}