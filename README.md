# Lightweight-Jar-To-Exe
Lightweight Windows .Jar to .Exe converter using a Node.js script

## Disclaimer
This is perhaps the jankiest solution of all time to a problem that [Launch4j](http://launch4j.sourceforge.net/) solved very well ages ago. I designed this project as a lightweight alternative to l4j, however due to the odd tooling you need on your Window’s path for this work correctly, I advise using Launch4j in all cases. This application is really just developed for my own personal use.

## Requirements
In order for the converter to work, the commands “xxd”, “gcc”, “jar”, and “javac”, must all be available on your PATH. While “javac” is never used by the script, it is used to determine if and where you have a JDK installed, since internally jni.h is a required header. Both “xxd” and “gcc” are available through [MSYS](http://www.mingw.org/wiki/MSYS), while both “javac” and “jar” are available via [JDKs](https://www.oracle.com/java/technologies/javase-downloads.html), which if you need a jar to exe program, you probably already have. 

## Running
Place `converter.js` (located in /build/) in the same directory as the desired .jar to convert (I’ll be referring to it as `program.jar` for this example). Run `converter.jar` with node passing in the name of the jar as a command line argument. Ex:
```
node converter.js progam.jar
```
If all goes well, `program.exe` will appear in the same directory. It is highly advised you move the newly created .exe file out of the directory of the .jar as soon as it’s created, since if the Main-Class’s name is the same as the jar file’s, it will create undefined behavior at runtime due to naming conflicts. More on why in the section “How the Generated .exe works”.

## How it works

### How the builder works
The builder, `build.js` in /tools/ builds the main converter and all of the examples. It copies the C code from “/src/main.c” (used for the exe) as a string into “/src/converter.js”. This is so the final converter (located in /build/converter.js) is just one simple script file, rather than a folder with the required C file(s) inside of it. 

### How the converter works
In /build/ you will find `converter.js`, this is the script that actually “converts” the .jar to an .exe.
This converter program takes the name of the jar to convert as a command line argument then uses that jar to generate a C program that will store and execute that Jar. Essentially it does this in three steps; First it uses:
```
xxd -i program.jar > jar.h
```
To convert the jar to a .h file containing all the jar’s binary data. Then it extracts the jar’s manifest using:
```
jar xf prog.jar META-INF/MANIFEST.MF
```
It uses the Main-Class in the manifest to generate another .h file letting the internally stored C program know the name of the main class for the JNI to call later on. Finally it compiles the C program to an exe using GCC. 

### How the Generated .exe works
The .exe starts by creating a subprocess that acts as a sandbox for the JNI to run the .jar file in. This is important because if the java code in the jar calls `System.exit(0)`, jvm.dll will kill the entire process, not just the java program, which would make cleaning up afterwards impossible.
This sandbox process copies the jar from within the exe to the same directory, the jar will have the name of the class specified by Main-Class, having another jar with the same name in the directory with the exe will cause undefined behavior and probably break the other jar in the directory. The program then will start the JNI using the now external jar as the class path. The program will then call the main method and hand control over to the jar. Finally cleanup begins either when the Jar hands control back or kills the process via `System.exit()`. The jar file is then deleted and you are just left with the exe.

