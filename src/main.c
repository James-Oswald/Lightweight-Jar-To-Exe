
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
        goto vmFail; //That's right I'm edgy, check out these sick gotos
    }
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
    (*env)->CallStaticVoidMethod(env, mainClass, mainMethod, args);
    vmErr:
    (*jvm)->DestroyJavaVM(jvm);
    vmFail:
    remove("prog.jar");
    free(options);
    fileFail:
    return 0;
}