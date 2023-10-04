## Fequently Asked Questions

This document outlines solutions to some known issues encountered with the extension and its development.

#### 1. Graph-View

While trying to bring up the graph-editor/ graph-view, the following message is displayed.
```
GSN Graph Editor must be activated from an open .gsn-document.
```
*Solution:*  To bring up the Graph-View open a `.gsn`-document and click anywhere on the opened `.gsn`-document and try again.

#### 2. Webview issues (encountered in extension development)

The following message is displayed during extension development, when you try to bring up the graph-view
```
Error loading webview: 
    Error: Could not register service workers: 
        InvalidStateError: Failed to register a ServiceWorker: The document is in an invalid state..
```

*Solution:*

 1. close vscode (make sure no process is running)
 1. `rm -rf ~/.config/Code/*Cache*`
 1. open vs code
