# GSN-domain

This is a snap-shot of the source code for the vscode-extension [GSN Assurance](https://marketplace.visualstudio.com/items?itemName=vu-isis.gsn-assurance).

### Tutorials
These videos were recorded using v0.11.2 of the extension.

 - [Getting started - UI overview](https://drive.google.com/file/d/1aBmUljgwraYtcvzqYZTXxz1sUn4lRX1l/view?usp=sharing)
 - [References and Multiple files](https://drive.google.com/file/d/1inABqavpEjdJCLV1SQ51h0qOqukZgBie/view?usp=sharing)
 - [State, artifacts, views, labels and groups](https://drive.google.com/file/d/1pdyvSOx9d3fT8w8yGak0XQq0po6GSkZA/view?usp=sharing)

### gsn-vscode-xtext
The source code for the visual studio code extension with two main parts:
  - A textual DSL with grammar specified in xtext together with a language server integrating with vs code to provide syntax 
    highlighting, code-completion, grammar check etc. when editing the textual `.gsn`-files.
  - A graph-editor which calls out to the language server, to etiher, parse the models from or persists changes to the `.gsn`-files. 

### json2gsn
CLI module for converting exported model-json into .gsn files. 
Three ways of execution see [README](./json2gsn/README.md) for more details:
 - Run as a standalone node (cli) process.
 - Invoke via the vscode extension command AI.
 - Use as a node-module and require the function.
