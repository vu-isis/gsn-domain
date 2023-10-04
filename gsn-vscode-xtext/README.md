# GSN-VS code

## Project Structure

- `demo` (example models)
- `vscode-extension-self-contained` (node based vs-code extension)
- `edu.vanderbilt.isis.caid.assurancedsl` (contains the dsl)
- `edu.vanderbilt.isis.caid.assurancedsl.ide` (contains the dsl specific customizations of the Xtext language server)
- `edu.vanderbilt.isis.caid.assurancedsl.web`

## Running the extension as a whole
```
./gradlew startCode
```

## Debugging the java language server
The application consists of two  main pieces; the language server and the vs-code extension with a client communicating with the sever.

Transpile `xtext` and `xtend` into java classes:

```
./gradlew build
```

Open vs-code with this directory as root:
```
code .
```

Make sure you have the [Extension Pack for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack)
extension installed.

From "Run and Debug" (Ctrl + Shift + D) start the debugger at RunServer (defined in .`vscode/launch.json`).

Once the server is up and running open another vs-code instance with the vscode-extension-self-contained directory as root:
```
code vscode-extension-self-contained
```
### Steps not needed each time
 - First time or new node_modules added.
    - `npm install`
    - (This will also build the graph-editor bundle and compile the extension code).
 - When the extension code (`vscode-extension-self-contained/src/extension.ts`) has been modified.
    - `npm run compile`
 - When the graph-editor GUI has been updated.
    - `npm run build`

From "Run and Debug" (Ctrl + Shift + D) start the debugger at Launch Extension (defined in .`vscode/launch.json`). 
Note that since the environment-variable `SEPARATE_SERVER` is defined it won't start a new language server.

It's important that the server is running at the point when the extension is started. If the server should crash
or you forgot to start it - you'll need to restart the extension debug session.

In the Development-Host instance of vs-code open up the `demo` folder and open a `.gsn`-file and the server process should log out the communication.

## Creating a tagged release
From the master branch - run and follow the instructions.
```
./gradlew release
```

This will trigger a workflow at GitLab which will build the VSIX bundle and attach it as [an artifact](https://docs.gitlab.com/ee/ci/pipelines/job_artifacts.html).

## Troubleshooting

### Problem
```
Error loading webview: 
    Error: Could not register service workers: 
        InvalidStateError: Failed to register a ServiceWorker: The document is in an invalid state..
```

### Solution (proposed)
 1. close vscode (make sure no process is running)
 1. `rm -rf ~/.config/Code/*Cache*`
 1. open vs code

## Version notes
Tested on Ubuntu 18.04 with 
VSCode version> 1.73.0
java version -> openJDK 11
./gradlew --version --> 7.4