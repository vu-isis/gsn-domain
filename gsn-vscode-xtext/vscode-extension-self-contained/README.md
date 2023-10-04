# GSN Assurance VSCode

This extension includes a grammar and a corresponding language server that facilitates syntax highlighting, grammar checks, and code completion for the GSN Assurance Language. This language is a Domain Specific Language (DSL) based on Goal Structuring Notation (GSN).

In addition to the textual DSL, the extension offers a graphical editor that displays the GSN models as Directed Acyclic Graphs (DAGs).

## Getting started

### System Requirements
This extension requires a Java 8+ installation available in path as `java` (or via the `JAVA_HOME` env. var).
A version that's confirmed to work is:
```
openjdk version "11.0.20.1" 2023-08-24
```

### Example model

A GSN model consists of one or more `.gsn` files contained in a single folder. Entities can be cross-referenced between files by defining namespaces and reference nodes.

Below, there is a simple example illustrating some entity types (goal, strategy, context). To begin, create a folder named `myModel` and a file named `myModel.gsn`, then copy and paste the model below into that file.

```
GOALS gauss
{
    goal Statement
    {
        uuid:"adaa653c-737a-4080-bf74-4f0fa0da3495";
        summary:'''The sum of the natural numbers less or equal to n equals to Sn = n*(n + 1) / 2''';
        strategy Mathematical_Induction
        {
            uuid:"3c168586-1c57-4269-9187-35dfe3123691";
            summary:'''''';
            goal Base
            {
                uuid:"53cfa782-7250-45bf-b24c-1a32a4e6ac38";
                summary:'''Holds for n = 1''';
                solution S1
                {
                    uuid:"9038480f-ae65-4c2c-b399-0e4aeaa44cb1";
                    summary:'''S1 = 1*(1 + 1) / 2 = 1''';
                }
            }
            goal Inductive_Step
            {
                uuid:"0f9bb9a7-abaa-467f-9798-b59fb42e26fe";
                summary:'''Holds for n = k + 1''';
                assumption Assuming
                {
                    uuid:"391acf6d-d507-4a3b-a88f-537e09ce25de";
                    summary:'''Holds for n = k''';
                }
                solution Sk_plus_1
                {
                    uuid:"aa4e0fc7-a74f-45fc-bb59-75a3dd82067c";
                    summary:'''Sk + 1 = (k + 1)(k + 2)/2

Sk + 1
= Sk + (k + 1)
= k*(k + 1) / 2 + (k + 1)
= (k + 1)*(k + 2) / 2''';
                }
            }
        }
    }
}
```

After opening the file in VSCode, granted this extension is installed and functioning correctly, keywords and symbols 
will be highlighted in accordance to your current theme.

Make sure the file has been saved, then bring up the command panel (`Ctrl/Cmd + Shift + P`) and type `gsn`.
Select `GSN: Graph View` and the graphical editor will open up in a separate tab. 

You can continue to expand on the model using either the graphical editor or the textual editor. Changes made in either 
perspective within the same VSCode instance will automatically be reflected in the other. (Edits in the textual 
`.gsn`-files must be saved in order for the editor to pick up the changes.)

### Tutorial Videos

These videos were recorded using v0.11.2 of the extension.

 - [Getting started - UI overview](https://drive.google.com/file/d/1aBmUljgwraYtcvzqYZTXxz1sUn4lRX1l/view?usp=sharing)
 - [References and Multiple files](https://drive.google.com/file/d/1inABqavpEjdJCLV1SQ51h0qOqukZgBie/view?usp=sharing)
 - [State, artifacts, views, labels and groups](https://drive.google.com/file/d/1pdyvSOx9d3fT8w8yGak0XQq0po6GSkZA/view?usp=sharing)

## Public Release History
### v0.12.0
- Public release of `GSN Assurance` extension for VSCode.
- `GSN Assurance` extension includes 
    - a Graphical Editor for Assurance models based on GSN
    - an XText based language server that supports the above graphical-editor as well as textual development of GSN based assurance models (`.gsn` files) in VSCode editor. 

### [Known Issues](./faq.md)  

## Acknowledgements
This work was supported by the DARPA Assured Autonomy program and Air Force Research Laboratory. Any opinions, findings, 
and conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect 
the views of DARPA or AFRL.