### v0.12.0
- ref_nodes now takes a ':' after the keyword, e.g. `ref_goal main.g1.g2;` is now `ref_goal: main.g1.g2;`.
- The textual representation of label is the same as for artifacts, that is each label requires one keyword value pair.
For example what used to be: `label:t1,t2;` is now `'label:t1; label:t2;'`
- Text formatting more consistent.

### v0.11.0
- Variable depth of clustering in cluster view.
- If depi not turned on, expose artifacts at nodes in node-editor.
- Updated available user-settings.
- Better validation of uuids.
- Expose getModelJson as external command.
- Expose generateUuids and genenerateModelJson commands from Command Palette.

### v0.10.0
- Grammar change: info and summary fields are now expressed as multiline strings ('''str''').
- Grammar change: Status field added at Solution nodes (NotReview, Approved, Disapproved).
- Model validation in graph view is based on actual statuses (rather than mock data).
- First cut at integration with depi.
- Major performance improvment when parsing large .gsn-files (+25x speed-up).
- Minor visualization improvments w.r.t. to individual nodes (hover blows up nodes) in cytoscape.

### v0.9.0
- Alternative visualizations using cytoscape.
- Side- and Top-Menus.

### v0.8.0
- Label- and group-definitions.
- Display UUID for nodes.

### v0.7.0
- Introduces UUIDs for all types of assuarance case nodes.