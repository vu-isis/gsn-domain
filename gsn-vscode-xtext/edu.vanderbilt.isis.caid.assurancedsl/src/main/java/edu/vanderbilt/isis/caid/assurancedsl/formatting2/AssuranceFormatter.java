
package edu.vanderbilt.isis.caid.assurancedsl.formatting2;
import org.eclipse.xtext.formatting2.AbstractJavaFormatter;
import org.eclipse.xtext.formatting2.IFormattableDocument;
import org.eclipse.xtext.generator.trace.node.IndentNode;

import edu.vanderbilt.isis.caid.assurancedsl.assurance.ALLNodes;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.AssuranceModel;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.AssumptionNode;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.AssumptionNodeRef;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.AssuranceFactory;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.AssurancePackage;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.BaseNode;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.ContextNode;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.ContextNodeRef;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.Description;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.GSNDefinition;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.GoalDetails;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.GoalNode;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.GoalNodeRef;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.JustificationNode;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.JustificationNodeRef;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.SolutionNode;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.SolutionNodeRef;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.StrategyDetails;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.StrategyNode;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.StrategyNodeRef;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.Summary;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.URIA;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.LabelInfo;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.UUIDType;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.impl.SolutionNodeImpl;

import com.google.common.collect.Iterables;
import org.eclipse.xtext.xbase.lib.IteratorExtensions;
import org.eclipse.emf.ecore.EObject;
import java.util.List;
import java.util.LinkedHashMap;
import org.eclipse.xtext.formatting2.FormatterPreferenceKeys;
import org.eclipse.xtext.preferences.MapBasedPreferenceValues;
import org.eclipse.xtext.preferences.ITypedPreferenceValues;
import org.eclipse.xtext.preferences.PreferenceKey;

import org.eclipse.xtext.formatting.IIndentationInformation;


public class AssuranceFormatter extends AbstractJavaFormatter {

	protected void format(AssuranceModel model, IFormattableDocument doc) {
        ITypedPreferenceValues prefs = this.getPreferences();
        
        LinkedHashMap <String,String> newMap = new LinkedHashMap<String, String>();
        newMap.put(FormatterPreferenceKeys.indentation.getId(), "    ");
        MapBasedPreferenceValues res = new MapBasedPreferenceValues(prefs, newMap);
        this.getRequest().setPreferences(res);


        

		for (GSNDefinition gsndef : model.getAssurancemodels()) {
			doc.format(gsndef);
		}
	}
	
	protected void format(GSNDefinition model, IFormattableDocument doc) {
		
		//doc.interior(regionFor(model).keyword("{"), regionFor(model).keyword("}"), it1->it1.setSpace("    ") );
		doc.surround(regionFor(model).keyword("{"), this::newLine);
		doc.surround(regionFor(model).keyword("}"), this::newLine);
		Iterable<ALLNodes> _filter = Iterables.<ALLNodes>filter(IteratorExtensions.<EObject>toIterable(model.eAllContents()), ALLNodes.class);
		for (ALLNodes g : _filter) 
		{
			doc.format(g);
		}

		

		// Iterable<StrategyDetails> _filter2 = Iterables.<StrategyDetails>filter(IteratorExtensions.<EObject>toIterable(model.eAllContents()), StrategyDetails.class);
		// for (StrategyDetails g : _filter2) 
		// {
		// 	if (checkRef(g))
		// 	{
		// 		doc.format(g);
		// 	}
		// }
		
		//}
	}

	public List<BaseNode> getBaseNodes(ALLNodes obj1)
	{
		int _classifierID = obj1.eClass().getClassifierID();
    	switch (_classifierID) {
			case AssurancePackage.ASSUMPTION_NODE:
				return ((AssumptionNode) obj1).getDetails();
			case AssurancePackage.CONTEXT_NODE:
				return ((ContextNode) obj1).getDetails();
			case AssurancePackage.GOAL_NODE:
				return ((GoalNode) obj1).getDetails();
			case AssurancePackage.JUSTIFICATION_NODE:
				return ((JustificationNode) obj1).getDetails();
			case AssurancePackage.SOLUTION_NODE:
				return ((SolutionNode) obj1).getDetails();
			case AssurancePackage.STRATEGY_NODE:
				return ((StrategyNode) obj1).getDetails();
		}
  
		return null;
	}

	protected void format(ALLNodes model, IFormattableDocument doc) {
		doc.surround(model, it -> it.newLine());
		doc.surround(model, it -> it.indent());
		doc.surround(regionFor(model).keyword("{"), this::newLine);
		doc.surround(regionFor(model).keyword("}"), this::newLine);

		List<BaseNode> bns = getBaseNodes(model);
		if (bns != null && bns.size()==1)
		{
			doc.format(bns.get(0));
		}

		if (model.eClass().getClassifierID()==AssurancePackage.GOAL_NODE)
		{
			GoalNode g =(GoalNode) model;
			for (GoalDetails gd : g.getNodedetails())
			{
				if (checkRef(gd))
				{
					formatRef(gd, doc);
				}
			}
		}

		if (model.eClass().getClassifierID()==AssurancePackage.STRATEGY_NODE)
		{
			StrategyNode g =(StrategyNode) model;
			for (StrategyDetails gd : g.getNodedetails())
			{
				if (checkRef(gd))
				{
					formatRef(gd, doc);
				}
			}
		}

        if (model.eClass().getClassifierID()==AssurancePackage.SOLUTION_NODE)
		{
            EObject modelobj = model;
            doc.prepend(regionFor(modelobj).keyword(";"), it ->{  it.noSpace();});
            doc.append(regionFor(modelobj).keyword(";"), it ->{  it.newLine();});
            doc.prepend(regionFor(modelobj).keyword("status:"), it ->{  it.newLine();});
		    doc.surround(regionFor(modelobj).keyword("status:"), it ->{  it.noSpace();});
            doc.prepend(regionFor(modelobj).keyword("status:"), it ->{  it.indent();});
            doc.surround(regionFor(modelobj).keyword("status:"), it ->{  it.indent();});
            
		}

		// Iterable<GoalDetails> _filter1 = Iterables.<GoalDetails>filter(IteratorExtensions.<EObject>toIterable(model.eAllContents()), GoalDetails.class);
		// for (GoalDetails g : _filter1) 
		// {
		// 	if (checkRef(g))
		// 	{
		// 		doc.format(g);
		// 	}
			
		// }
		
		
	}

	public boolean checkRef(EObject obj1)
	{
		int _classifierID = obj1.eClass().getClassifierID();
    	switch (_classifierID) {
			case AssurancePackage.ASSUMPTION_NODE_REF:
			case AssurancePackage.CONTEXT_NODE_REF:
			case AssurancePackage.GOAL_NODE_REF:
			case AssurancePackage.JUSTIFICATION_NODE_REF:
			case AssurancePackage.SOLUTION_NODE_REF:
			case AssurancePackage.STRATEGY_NODE_REF:
				return true;
		}
  
		return false;
	}

	protected void formatRef(EObject model, IFormattableDocument doc) {
		if (checkRef(model))
		{
            doc.prepend(regionFor(model).keyword(";"), it ->{  it.noSpace();});
			doc.surround(model, it -> it.newLine());
			doc.surround(model, it -> it.indent());
			doc.append(regionFor(model).keyword(";"), it ->{  it.newLine();});
            
            
		}

	}

	
	protected void format(Summary model, IFormattableDocument doc) {
        doc.prepend(regionFor(model).keyword(";"), it ->{  it.noSpace();});
		doc.append(regionFor(model).keyword(";"), it ->{  it.newLine();});
		doc.prepend(regionFor(model).keyword("summary:"), it ->{  it.newLine();});
		doc.surround(regionFor(model).keyword("summary:"), it ->{  it.noSpace();});
		doc.surround(regionFor(model).keyword("summary:"), it ->{  it.indent();});
	}

	protected void format(Description model, IFormattableDocument doc) {
        doc.prepend(regionFor(model).keyword(";"), it ->{  it.noSpace();});
		doc.append(regionFor(model).keyword(";"), it ->{  it.newLine();});
		doc.prepend(regionFor(model).keyword("info:"), it ->{  it.newLine();});
		doc.surround(regionFor(model).keyword("info:"), it ->{  it.noSpace();});
		doc.surround(regionFor(model).keyword("info:"), it ->{  it.indent();});
	}

	protected void format(URIA model, IFormattableDocument doc) {
        doc.prepend(regionFor(model).keyword(";"), it ->{  it.noSpace();});
		doc.append(regionFor(model).keyword(";"), it ->{  it.newLine();});
		doc.prepend(regionFor(model).keyword("artifact:"), it ->{  it.newLine();});
		doc.surround(regionFor(model).keyword("artifact:"), it ->{  it.noSpace();});
		doc.surround(regionFor(model).keyword("artifact:"), it ->{  it.indent();});
	}


    protected void format(LabelInfo model, IFormattableDocument doc) {
        doc.prepend(regionFor(model).keyword(";"), it ->{  it.noSpace();});
		doc.append(regionFor(model).keyword(";"), it ->{  it.newLine();});
		doc.prepend(regionFor(model).keyword("label:"), it ->{  it.newLine();});
		doc.surround(regionFor(model).keyword("label:"), it ->{  it.noSpace();});
		doc.surround(regionFor(model).keyword("label:"), it ->{  it.indent();});
	}

	protected void format(UUIDType model, IFormattableDocument doc) {
        doc.prepend(regionFor(model).keyword(";"), it ->{  it.noSpace();});
		doc.append(regionFor(model).keyword(";"), it ->{  it.newLine();});
		doc.prepend(regionFor(model).keyword("uuid:"), it ->{  it.newLine();});
		doc.surround(regionFor(model).keyword("uuid:"), it ->{  it.noSpace();});
		doc.surround(regionFor(model).keyword("uuid:"), it ->{  it.indent();});
	}

  
           

	
	protected void format(BaseNode model, IFormattableDocument doc) {
	{
		doc.format(model.getUuid());
		if (model.getSummary().size()== 1)
		{
			doc.format(model.getSummary().get(0));
		}

		if (model.getInfo().size()== 1)
		{
			doc.format(model.getInfo().get(0));
		}

        for(LabelInfo u : model.getLabels())	
		{
			doc.format(u);
		}


		for(URIA u : model.getArtifacts())	
		{
			doc.format(u);
		}
		


		// if (model.eIsSet(AssurancePackage.Literals.BASE_NODE__LABEL))
		// {
        //     doc.prepend(regionFor(model).keyword(";"), it ->{  it.noSpace();});
		// 	doc.prepend(regionFor(model).keyword("label:"), it ->{  it.newLine();});
		// 	doc.surround(regionFor(model).keyword("label:"), it ->{  it.noSpace();});
		// 	doc.surround(regionFor(model).keyword("label:"), it ->{  it.indent();});
		// 	doc.append(regionFor(model).keyword(";"), it ->{  it.newLine();});
		// }
			
		
	}
}
	
}
