
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

int main(){
    char pathBuffer[MAX_PATH];
    getPath(pathBuffer);
    char classPath[MAX_PATH];
    char optString[MAX_PATH];
    sprintf(classPath, "%sprog.jar", pathBuffer);
    sprintf(optString, "-Djava.class.path=%s", classPath);
    FILE* file = fopen(classPath, "w");
    printf("%s\n", optString);
    if(file == NULL){
        printf("Error: Failed to open file!");
        exit(1);
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
        printf("Error: Failed to create VM");
        exit(1);
    }
    jint ver = (*env)->GetVersion(env);
    printf("JNI version %d.%d init sucessful", ver>>16, ver&0x0f);
    //jclass c = (*env)->FindClass(env,)
    return 0;
}