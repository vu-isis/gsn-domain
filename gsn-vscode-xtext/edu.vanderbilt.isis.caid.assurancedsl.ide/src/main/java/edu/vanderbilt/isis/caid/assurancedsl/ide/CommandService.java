package edu.vanderbilt.isis.caid.assurancedsl.ide;

import java.util.List;
import java.util.ArrayList;
import com.google.inject.Inject;
import com.google.inject.Injector;
import com.google.inject.Provider;
import org.eclipse.lsp4j.ExecuteCommandParams;
import org.eclipse.xtext.ide.server.ILanguageServerAccess;
import org.eclipse.xtext.ide.server.commands.IExecutableCommandService;
import org.eclipse.xtext.util.CancelIndicator;
import org.eclipse.emf.common.util.URI;
import org.eclipse.xtext.resource.IResourceDescriptions;
import org.eclipse.emf.ecore.resource.ResourceSet;
import org.eclipse.emf.ecore.util.EcoreUtil;
import org.eclipse.emf.ecore.util.EcoreUtil.UsageCrossReferencer;
import org.eclipse.emf.ecore.xmi.impl.URIHandlerImpl;
import org.eclipse.xtext.EcoreUtil2;
import org.eclipse.xtext.generator.GeneratorContext;
import org.eclipse.xtext.generator.JavaIoFileSystemAccess;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.xtext.generator.IGenerator2;
import com.google.common.collect.Iterables;
import com.google.common.collect.Lists;
import edu.vanderbilt.isis.caid.assurancedsl.AssuranceStandaloneSetup;
import edu.vanderbilt.isis.caid.assurancedsl.generator.AssuranceGenerator;
import org.eclipse.xtext.xbase.lib.IteratorExtensions;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import java.io.File;
import java.util.HashMap;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.ALLNodes;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.AssuranceFactory;
import org.eclipse.xtext.resource.SaveOptions;
import org.eclipse.emf.common.notify.Notifier;
import org.eclipse.xtext.resource.XtextResource;
import org.eclipse.xtext.nodemodel.INode;
import org.eclipse.xtext.nodemodel.util.NodeModelUtils;
import org.eclipse.xtext.nodemodel.ICompositeNode;
import org.eclipse.xtext.validation.IResourceValidator;
import org.eclipse.xtext.validation.Issue;
import org.eclipse.xtext.validation.CheckMode;
import org.eclipse.xtext.serializer.ISerializer;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.ecore.EStructuralFeature;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.URIA;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.LabelInfo;

import org.eclipse.emf.ecore.EStructuralFeature.Setting;

public class CommandService implements IExecutableCommandService {

    @Inject
    Provider<ResourceSet> resourceSetProvider;

    @Inject
    IResourceDescriptions resourceDescriptions;

    @Inject
    JavaIoFileSystemAccess fileAccess;

    @Inject
    private IGenerator2 generator;

    @Inject
    private IResourceValidator resourceValidator;

    @Inject
    private ISerializer serializer;

    @Override
    public List<String> initialize() {
        return Lists.newArrayList("gsn.GET_MODEL_JSON", "gsn.GENERATE_MODEL_JSON", "gsn.MODEL_UPDATE",
                "gsn.REVEAL_ORIGIN", "gsn.ASSIGN_UUIDS");
    }

    public String getPath(String input) {
        String moduri = input.trim();
        if (moduri.startsWith("\"file://")) {
            moduri = moduri.substring(8);

        }
        if (moduri.endsWith("\"")) {
            moduri = moduri.substring(0, moduri.indexOf("\""));
        }
        return moduri;

    }

    public JSONArray getCommand(String input) {

        JSONObject command = new JSONObject(input.trim());
        JSONArray cmds = command.getJSONArray("commandList");
        return cmds;

    }

    public ResourceSet getResourceSet() {
        Injector injector = new AssuranceStandaloneSetup().createInjectorAndDoEMFRegistration();
        return injector.getInstance(ResourceSet.class);
    }

    public IResourceValidator getResourceValidator() {
        Injector injector = new AssuranceStandaloneSetup().createInjectorAndDoEMFRegistration();
        return injector.getInstance(IResourceValidator.class);
    }

    public ISerializer getSerializer() {
        Injector injector = new AssuranceStandaloneSetup().createInjectorAndDoEMFRegistration();
        return injector.getInstance(ISerializer.class);
    }

    public List<Resource> getResourceList(String moduri, ResourceSet resourceSet) {
        String parentPath = moduri;
        File fileorig = new File(moduri);
        if (fileorig.isFile()) {
            parentPath = fileorig.getParent();
        }
        fileAccess.setOutputPath(parentPath);
        File folder = new File(parentPath);

        List<Resource> resourceList = new ArrayList<Resource>();
        for (File file : folder.listFiles()) {

            if (file.getName().endsWith(".gsn")) {
                Resource r = resourceSet.getResource(URI.createFileURI(file.getPath()), true);
                r.setTrackingModification(true);
                resourceList.add(r);
            }

        }
        return resourceList;
    }

    public JSONArray generateJSONOutput(List<Resource> resourceList, AssuranceGenerator a1, ResourceSet resourceSet) {
        long startTime = System.currentTimeMillis();
        JSONArray jsonarray = new JSONArray();

        for (Resource cr : resourceList) {
            JSONArray js = a1.generateJSON(cr);
            for (int i = 0; i < js.length(); i++) {
                if (js.get(i).toString().equals("{}"))
                    continue;
                jsonarray.put(js.get(i));
            }
        }
        System.out.println(
                String.format("generateJSONOutput without sort : %d[ms]", System.currentTimeMillis() - startTime));

        startTime = System.currentTimeMillis();
        jsonarray = a1.JsonObjectSort(jsonarray);
        System.out
                .println(String.format("generateJSONOutput sorting : %d[ms]", System.currentTimeMillis() - startTime));
        startTime = System.currentTimeMillis();
        // saveResourceSet(resourceList, resourceSet);
        System.out.println(
                String.format("generateJSONOutput saveResourceSet : %d[ms]", System.currentTimeMillis() - startTime));
        return jsonarray;
    }

    public HashMap<String, ALLNodes> generateObjectDict(List<Resource> resourceList, AssuranceGenerator a1) {
        HashMap<String, ALLNodes> map = new HashMap<String, ALLNodes>();

        for (Resource cr : resourceList) {
            map = a1.getObjectDictionary(cr, map);
        }
        return map;
    }

    private String checkArg(String filepath) {
        File fileorig = new File(filepath);
        if (!fileorig.exists()) {
            return "Missing Directory/File Path or Unable to parse Directory/File parameter -  " + filepath;

        }
        return "";
    }

    public String OnAttributeChange(HashMap<String, ALLNodes> objDict, AssuranceGenerator a1, JSONObject commandObj,
            ALLNodes node) {
        String attr = commandObj.getString("attr");
        Object newValue = commandObj.get("newValue");
        switch (attr) {
            case "summary": {
                String updatedValue = newValue.toString();
                newValue = "\'\'\'" + updatedValue + "\'\'\'";
                break;
            }
            case "info": {
                String updatedValue = newValue.toString();
                newValue = "\'\'\'" + updatedValue + "\'\'\'";
                break;
            }
            case "labels": {
                JSONArray jsonArray = (JSONArray) newValue;
                ArrayList<LabelInfo> listdata = new ArrayList<LabelInfo>();
                for (int i = 0; i != jsonArray.length(); i++) {

                    // Adding each element of JSON array into ArrayList
                    LabelInfo label = AssuranceFactory.eINSTANCE.createLabelInfo();
                    label.setName(jsonArray.get(i).toString());
                    listdata.add(label);
                }
                newValue=listdata;
                break;
            }

            case "artifacts": {
                
                JSONArray jsonArray = (JSONArray) newValue;
                ArrayList<URIA> listdata = new ArrayList<URIA>();
                for (int i = 0; i != jsonArray.length(); i++) {

                    // Adding each element of JSON array into ArrayList
                    URIA uri = AssuranceFactory.eINSTANCE.createURIA();
                    uri.setUri(jsonArray.get(i).toString());
                    // uri.setUri("abcd");

                    listdata.add(uri);

                }
                newValue = listdata;
                break;
            }
            default:
                break;

        }

        return a1.OnAttributeChange(node, attr, newValue);
    }

    public String onNewChildRef(HashMap<String, ALLNodes> objDict, AssuranceGenerator a1, JSONObject commandObj,
            ALLNodes node) {
        String childType = commandObj.getString("relationType");
        String childID = commandObj.getString("childId");
        ALLNodes childNode = objDict.get(childID);

        if (childNode == null) {
            return "Child Node not found ID = " + childID;
        }

        return a1.onNewChildRef(node, childNode);
    }

    public String onNewChildNode(HashMap<String, ALLNodes> objDict, AssuranceGenerator a1, JSONObject commandObj,
            ALLNodes node) {
        String childType = commandObj.getString("childType");
        String childName = commandObj.getString("childName");

        return a1.onNewChildNode(node, childType, childName);
    }

    public String onRemoveChildNode(HashMap<String, ALLNodes> objDict, AssuranceGenerator a1, JSONObject commandObj,
            ALLNodes node) {
        String childID = commandObj.getString("childId");
        ALLNodes childNode = objDict.get(childID);
        if (childNode == null) {
            return "Child Node not found ID = " + childID;
        }
        return a1.onRemoveChildNode(node, childNode);
    }

    public String onDeleteNode(HashMap<String, ALLNodes> objDict, AssuranceGenerator a1, JSONObject commandObj,
            ALLNodes node) {
        return a1.onDeleteNode(node);
    }

    public String updateModel(HashMap<String, ALLNodes> objDict, AssuranceGenerator a1, JSONObject commandObj,
            ResourceSet resourceSet) {
        String message = "";
        String nodeID = commandObj.getString("nodeId");
        ALLNodes node = objDict.get(nodeID);
        if (node == null) {
            return "Node not found ID = " + nodeID;
        }
        String cmd = commandObj.getString("cmd");
        switch (cmd) {
            case "onAttributeChange":
                java.util.Collection<EStructuralFeature.Setting> l1 = EcoreUtil.UsageCrossReferencer.find(node,
                        resourceSet);
                message = OnAttributeChange(objDict, a1, commandObj, node);
                if (message == "") {
                    EcoreUtil2.resolveAll(node);
                    for (Setting setting : l1) {
                        EObject source = setting.getEObject();
                        EcoreUtil2.resolveAll(source);
                    }
                }

                return message;
            case "onNewChildNode":
                return onNewChildNode(objDict, a1, commandObj, node);
            case "onNewChildRef":
                return onNewChildRef(objDict, a1, commandObj, node);
            case "onRemoveChildNode":
                return onRemoveChildNode(objDict, a1, commandObj, node);
            case "onRemoveChildRef":
                return onRemoveChildNode(objDict, a1, commandObj, node);
            case "onDeleteNode":
                return onDeleteNode(objDict, a1, commandObj, node);
            default:
                message = "Unknown command " + cmd;
        }

        return message;
    }

    public boolean checkSerializer(ResourceSet rs) {
        ISerializer serializer = getSerializer();
        boolean ret = true;
        long startTime = System.currentTimeMillis();
        Iterable<ALLNodes> _filter = Iterables.<ALLNodes>filter(
                IteratorExtensions.<Notifier>toIterable(rs.getAllContents()), ALLNodes.class);
        System.out
                .println(String.format("    checkSerializer (get AllNodes): %d[ms]",
                        System.currentTimeMillis() - startTime));
        startTime = System.currentTimeMillis();
        for (final ALLNodes g : _filter) {
            try {
                serializer.serialize(g);

            } catch (Exception ex) {
                ret = false;
                System.out.println("issues with object " + ex.toString());
            }

        }

        System.out
                .println(String.format("    checkSerializer (loop:serialize): %d[ms]",
                        System.currentTimeMillis() - startTime));
        return ret;

    }

    public boolean saveResourceSet(List<Resource> resourceList, ResourceSet rs) {
        // TODO: Improve error handling here. Can we swallow some exception? And when
        // not - couldn't we just let
        // the exception be handled by the caller and return the error message to vscode
        // extension?

        // IResourceValidator rv = getResourceValidator();
        long startTime = System.currentTimeMillis();
        for (Resource cr : resourceList) {
            try {
                EcoreUtil2.resolveAll(cr);
            } catch (Exception ex) {

            }
        }

        System.out
                .println(String.format("  saveResourceSet (resolve): %d[ms]", System.currentTimeMillis() - startTime));
        startTime = System.currentTimeMillis();
        // if (!checkSerializer(rs)) {
        // return false;
        // }

        System.out.println(
                String.format("  saveResourceSet (checkSerializer): %d[ms]", System.currentTimeMillis() - startTime));

        SaveOptions.Builder options = SaveOptions.newBuilder();
        options.format();
        

        startTime = System.currentTimeMillis();
        for (Resource cr : resourceList) {
            try {

                // if (cr.isModified()) {
                // System.out.println(cr.getURI().toFileString());
                // }
                // if (cr.isTrackingModification()) {
                // System.out.println(cr.getURI().toFileString());
                // }

                // List<Issue> issues = rv.validate(cr,CheckMode.ALL, CancelIndicator.NullImpl);
                // boolean doSave = true;
                // for (Issue issue: issues) {
                // switch (issue.getSeverity()) {
                // case ERROR:
                // {
                // doSave = false;
                // System.out.println("ERROR: " + issue.getMessage());
                // break;
                // }
                // case WARNING:
                // {
                // System.out.println("WARNING: " + issue.getMessage());
                // break;
                // }
                // default:
                // break;
                // }
                // }

                cr.save(options.getOptions().toOptionsMap());

            } catch (Exception ex) {
                System.out.println(ex.toString());
                return false;
            }

        }

        System.out.println(
                String.format("  saveResourceSet (loop:isMod|Track|save): %d[ms]",
                        System.currentTimeMillis() - startTime));
        return true;

    }

    public String getPosition(HashMap<String, ALLNodes> map, String path) {

        ALLNodes childNode = map.get(path);
        if (childNode != null) {
            ICompositeNode n = NodeModelUtils.getNode(childNode); //
            JSONObject j = new JSONObject();
            j.put("filePath", childNode.eResource().getURI().toFileString());
            j.put("lineNumber", n.getStartLine());
            return j.toString();

        }
        return "Could not find node at path : " + path;
    }

    @Override
    public Object execute(ExecuteCommandParams params, ILanguageServerAccess access, CancelIndicator cancelIndicator) {
        List<Object> parameters = params.getArguments();
        String cmd = params.getCommand();
        JSONObject args;
        String dirPath;
        if (parameters != null && parameters.size() > 0) {
            try {
                args = new JSONObject(parameters.get(0).toString());
            } catch (Exception ex) {
                return "Unable to parse JSON arugment " + ex.toString();
            }

            dirPath = args.getString("modelDir");
            String mesg = checkArg(dirPath);
            if (mesg != "") {
                return mesg;
            }
        } else {
            return "Missing arguments";
        }

        if ("gsn.GET_MODEL_JSON".equals(cmd) || "gsn.GENERATE_MODEL_JSON".equals(cmd)) {
            try {
                long startTime = System.currentTimeMillis();
                ResourceSet resourceSet = getResourceSet();
                resourceSet.getLoadOptions().put(XtextResource.OPTION_RESOLVE_ALL, Boolean.TRUE);
                List<Resource> resourceList = getResourceList(dirPath, resourceSet);
                GeneratorContext gc = new GeneratorContext();
                gc.setCancelIndicator(cancelIndicator);
                AssuranceGenerator a1 = (AssuranceGenerator) generator;
                JSONArray jsonarray = generateJSONOutput(resourceList, a1, resourceSet);
                System.out
                        .println(String.format("GET/GENERATE_MODEL_JSON : %d[ms]",
                                System.currentTimeMillis() - startTime));
                if ("gsn.GENERATE_MODEL_JSON".equals(cmd)) {
                    fileAccess.generateFile("model.json", jsonarray.toString(4));
                    return null;
                } else {
                    return jsonarray.toString();
                }
            } catch (Exception e) {
                return e.getMessage() != null ? e.getMessage() : e.toString();
            }
        }

        else if ("gsn.ASSIGN_UUIDS".equals(cmd)) {
            try {
                ResourceSet resourceSet = getResourceSet();
                resourceSet.getLoadOptions().put(XtextResource.OPTION_RESOLVE_ALL, Boolean.TRUE);
                List<Resource> resourceList = getResourceList(dirPath, resourceSet);
                GeneratorContext gc = new GeneratorContext();
                gc.setCancelIndicator(cancelIndicator);
                AssuranceGenerator a1 = (AssuranceGenerator) generator;
                generateJSONOutput(resourceList, a1, resourceSet);

                if (saveResourceSet(resourceList, resourceSet)) {
                    return null;
                } else {
                    return "Failed to save model after assigning UUIDs";
                }

            } catch (Exception e) {
                return e.getMessage() != null ? e.getMessage() : e.toString();
            }
        }

        else if ("gsn.MODEL_UPDATE".equals(cmd)) {
            try {
                JSONArray commandObj;

                try {
                    commandObj = args.getJSONArray("commandList");
                } catch (JSONException ex) {
                    return "Unable to Parse CommandList " + ex.toString();
                }

                if (commandObj == null) {
                    return "Null CommandList ";
                }

                ResourceSet resourceSet = getResourceSet();
                resourceSet.getLoadOptions().put(XtextResource.OPTION_RESOLVE_ALL, Boolean.TRUE);
                List<Resource> resourceList = getResourceList(dirPath, resourceSet);
                AssuranceGenerator a1 = (AssuranceGenerator) generator;
                GeneratorContext gc = new GeneratorContext();
                gc.setCancelIndicator(cancelIndicator);

                HashMap<String, ALLNodes> objDict = generateObjectDict(resourceList, a1);
                for (int i = 0; i != commandObj.length(); i++) {

                    String message = updateModel(objDict, a1, commandObj.getJSONObject(i), resourceSet);
                    if (message != "") {
                        return message;
                    }
                }

                EcoreUtil2.resolveAll(resourceSet);
                // Iterable<ALLNodes> _filter = Iterables.<ALLNodes>filter(
                // IteratorExtensions.<Notifier>toIterable(resourceSet.getAllContents()),
                // ALLNodes.class);
                // for (final ALLNodes g : _filter) {
                // System.out.println(g.toString());
                // }

                JSONArray jsonarray = generateJSONOutput(resourceList, a1, resourceSet);
                // fileAccess.generateFile("model.json", jsonarray.toString(4));
                if (saveResourceSet(resourceList, resourceSet)) {
                    // System.exit(1);
                    return jsonarray.toString();
                } else {
                    return "Could not save resources due to errors";
                }

            } catch (Exception e) {
                return e.getMessage() != null ? e.getMessage() : e.toString();
            }

        } else if ("gsn.REVEAL_ORIGIN".equals(cmd)) {
            try {

                String objID = null;
                try {
                    objID = args.getString("nodeId");

                } catch (JSONException ex) {
                    return "Unable to get object path - nodeId " + ex.toString();
                }

                if (objID == null) {
                    return "Null Object Path ";
                }

                ResourceSet resourceSet = getResourceSet();
                System.out.println(resourceSet.getLoadOptions().toString());
                resourceSet.getLoadOptions().put(XtextResource.OPTION_RESOLVE_ALL, Boolean.TRUE);

                List<Resource> resourceList = getResourceList(dirPath, resourceSet);
                AssuranceGenerator a1 = (AssuranceGenerator) generator;
                GeneratorContext gc = new GeneratorContext();
                gc.setCancelIndicator(cancelIndicator);

                HashMap<String, ALLNodes> objDict = generateObjectDict(resourceList, a1);
                return getPosition(objDict, objID);
            } catch (Exception e) {
                return e.getMessage() != null ? e.getMessage() : e.toString();
            }

        }
        return "Bad Command";
    }
}
