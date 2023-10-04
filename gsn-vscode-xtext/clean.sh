#!/bin/bash
./gradlew clean
rm -rf build
rm -rf node_modules/
rm -rf vscode-extension-self-contained/node_modules/
rm -rf vscode-extension-self-contained/build
rm -rf vscode-extension-self-contained/.gradle/
rm -rf .gradle
