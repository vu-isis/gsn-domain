Grammar explanation
==================

The language server treats all the files in a workspace folder as part of the same `AssuranceModel`


Assurance Model
================
`AssuranceModel` includes one or more `GSNDefinition`

- `AssuranceModel:
	assurancemodels += GSNDefinition*
;`


GSNDefinition
=============

Each `GSNDefinition` is an object of type - `Goals`, `Strategies`, `Contexts`, `Assumptions`, `Justifications` or `Solutions`


- `GSNDefinition:
	Goals|Strategies|Contexts|Assumptions|Justifications|Solutions
;`


Goals - GSNDefinition
------------------------

- Defines a series of goals using `Goals` object. They start with a key word `GOALS` and is followed by a name and then within braces includes zero or more definition of nodes of the type `GoalNode`.


- `Goals:
	'GOALS'  name=ID  '{' goals += GoalNode* '}'
;`


Other GSNDefinition
------------------

- A series of node definitions can be made for Goals, Strategies, Contexts, Assumptions, Justifications and Solutions


GoalNode
----------

Definition of each GoalNode begins with keyword `goal`  and is followed by a name.

Within  curly brances, it includes  
- the BaseNode information for the node i.e. labels, info, summary, artifacts
- zero or more child nodes for a goal - GoalDetails

- `GoalNode:
	'goal' name=ID '{'
		  (details += BaseNode)	
		  (nodedetails += GoalDetails*)
	 '}'
	 ;`


BaseNode information in all nodes
-----------------------------
This information includes 
- uuid
- summary
- info
- labels
- artifacts
  
- `BaseNode:
      {BaseNode}
	  uuid=UUIDType
      (summary += Summary)?
      (info += Description)? 
      (labels +=LabelInfo*) 
      (artifacts += URIA*)
	;`


Child node or Goal Details
-----------

Child nodes for a goal `GoalDetails` could be one of the GoalSupportNodes, ContextNodes, AssumptionNodes or JustificationNodes


- `GoalDetails:
	GoalSupportNodes|
	ContextNodes|
	AssumptionNodes|
	JustificationNodes
;`

On further expansion this would mean Goal, Strategy, Solution, Context, Assumption, Justification or one of their references.



Nodes
=========

Goal Node
----------

- Begins with keyword `goal`  and is followed by a name.
- within curly brances, provide 
- the BaseNode information for the node i.e. labels, info, summary, artifacts
- zero or more child nodes for a goal - `GoalDetails`
  
- `GoalDetails:
	GoalSupportNodes|
	ContextNodes|
	AssumptionNodes|
	JustificationNodes
;`


Strategy Node
----------------------------
- Begins with keyword `strategy`  and is followed by a name.
- within curly brances, provide 
- the `BaseNode` information for the node i.e. labels, info, summary, artifacts
- zero or more child nodes for a strategy - `StrategyDetails`


- `StrategyNode:
	'strategy' name=ID '{'
		   (details += BaseNode)
	      (nodedetails += StrategyDetails*)
	'}'
	;`


Context Node
----------------------------
- Begins with keyword `context`  and is followed by a name.
- within curly brances, provide 
- the `BaseNode` information for the node i.e. labels, info, summary, artifacts


- `ContextNode:
	'context' name=ID '{'
	      (details += BaseNode)
	'}'
	;`
	

Assumption Node
------------------------

- Begins with keyword `assumption`  and is followed by a name.
- within curly brances, provide 
- the `BaseNode` information for the node i.e. labels, info, summary, artifacts

-`AssumptionNode:
	'assumption' name=ID '{'
	      (details += BaseNode)
	'}'
	;`


Justification  Node
---------------------

- Begins with keyword `justification`  and is followed by a name.
- within curly brances, provide 
- the `BaseNode` information for the node i.e. labels, info, summary, artifacts


- `JustificationNode:
	'justification' name=ID '{'
	      (details += BaseNode)
	'}'
	;`

Solution Node
-------------
- Begins with keyword `solution`  and is followed by a name.
- within curly brances, provide 
- the `BaseNode` information for the node i.e. labels, info, summary, artifacts


- `SolutionNode:
	'solution' name=ID '{'
	      (details += BaseNode)
	'}'
	;`


Reference nodes
=================

Definition of Reference nodes. Reference nodes begin with a keyword `ref_goal`, `ref_strategy`, `ref_solution`, `ref_context`, `ref_assumption`, `ref_justifiction`.
This is followed by the name of an appropriate node defined in the same file or its fully qualified name (if defined in another file)

- `GoalNodeRef:
	'ref_goal:' ref=[GoalNode|RefFQN] ';'
;`

- `StrategyNodeRef:
	'ref_strategy:' ref=[StrategyNode|RefFQN] ';'
;`

- `SolutionNodeRef:
	'ref_solution:' ref=[SolutionNode|RefFQN] ';'
;`

- `ContextNodeRef:
	'ref_context:' ref=[ContextNode|RefFQN] ';'
;`

- `AssumptionNodeRef:
	'ref_assumption:' ref=[AssumptionNode|RefFQN] ';'
;`

- `JustificationNodeRef:
	'ref_justification:' ref=[JustificationNode|RefFQN] ';'
;`


RefFQN
------
A `RefFQN` is a series of names separated by a '.'
`RefFQN: // this rules matches either an FQN or a simple identifier
	ID ("." ID)*;`



Base Node attributes
====================

UUID
----

UUID starts with `uuid:` and is followed by a string
UUIDType: 
    'uuid:' info=STRING';'
    ;

Summary/ Info
---------
Summary/ Info starts with `summary:` or `info:` and is followed by `ML_INFO` i.e. a series of characters (including white space and newline) between '```' and '```;'

- `Summary: 
    'summary:' info=ML_INFO
    ;`

- `Description: 
    'info:' info=ML_INFO
    ;`

- `terminal ML_INFO : '\'\'\''  -> '\'\'\'';`


Label
-------
A Label starts with keyword `label:`, followed by a label ID and is terminated by a ';'

`
LabelInfo: 
    'label:' label=ID ';'	
    ;`

Artifact
--------
Currently URI is just an ID.
Each artifact definition starts with the keyword `artifact:` and is followed by a `URI`

`URI: 
    'artifact:' uri=ID ';'
    ;`



Child nodes 
==================================

Child nodes for a goal is specified by  `GoalDetails`. 

- `GoalDetails:
	GoalSupportNodes|
	ContextNodes|
	AssumptionNodes|
	JustificationNodes
;`

- On further expansion this would mean Goal, Strategy, Solution, Context, Assumption, Justification or one of their references.

Child nodes for a strategy is specified by `StrategyDetails` 


- `StrategyDetails:
	StrategySupportNodes|
	ContextNodes|
	AssumptionNodes|
	JustificationNodes
;`

- On further expansion this would mean Strategy, Context, Assumption, Justification or one of their references.


Goal Support Nodes
-----------------

- Support nodes for a goal include Goal or Strategy or Solution or one of their references.

- `GoalSupportNodes:
	GoalNode
	| StrategyNode
	| SolutionNode
	| GoalNodeRef
	| StrategyNodeRef
	| SolutionNodeRef
	;`

Strategy Support nodes
-------------------------
- Support nodes for a strategy include all of the Goal support nodes except `SolutionNode`


`StrategySupportNodes:
	GoalNode
	| StrategyNode
	| GoalNodeRef
	| StrategyNodeRef
	;`


ContextNodes, JustificationNodes, AssumptionNodes
==========================
- These node definitions are used as aliases in the grammar and do not affect the actual usagge.

- These types with a 's' at the end include either the node or 
- +its reference

`ContextNodes` is either a ContextNode or its reference

`
ContextNodes:
	ContextNode
	| ContextNodeRef
;`

`AssumptionNodes` is either a AssumptionNode or its reference
- `
AssumptionNodes:
	AssumptionNode
	| AssumptionNodeRef
;

`JustificationNodes` is either a JustificationNode or its reference
- `JustificationNodes:
	JustificationNode
	| JustificationNodeRef
;`




