@echo off
mkdir tmp
copy "src\main.c" "tmp\main.c"
copy %1 "tmp\prog.jar"
cd tmp
xxd -i "prog.jar" > "jar.h"
gcc -g main.c -o jar.exe -I"C:\\Program Files\\Java\\jdk-10.0.2\\include" -I"C:\\Program Files\\Java\\jdk-10.0.2\\include\\win32" -L"C:\\Program Files\\Java\\jdk-10.0.2\\lib" -ljvm
cd ..
copy "tmp\jar.exe" "jar.exe"
rmdir /Q /S tmp
