## GSN-App

GSN-editor which is 100% client based and can be served as a static website. The persisting is taking place in the
browsers local-storage and the app is only intended for smaller test projects.

To start dev-server:

```
npm run start
```

This will copy over the [graph](..webgme-gsn/src/visualizers/panels/GsnEditor/components/graph)-directory from webgme-gsn
at the first invocation. If making any changes to those files invoke, `npm run pre_build`, and the dev-server will pick up the changes.
