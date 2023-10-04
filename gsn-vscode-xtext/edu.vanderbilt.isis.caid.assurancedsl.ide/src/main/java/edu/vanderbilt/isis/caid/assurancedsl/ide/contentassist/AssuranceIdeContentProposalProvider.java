package edu.vanderbilt.isis.caid.assurancedsl.ide.contentassist;

import org.eclipse.xtext.RuleCall;
import org.eclipse.xtext.ide.editor.contentassist.ContentAssistContext;
import org.eclipse.xtext.ide.editor.contentassist.IIdeContentProposalAcceptor;
import org.eclipse.xtext.ide.editor.contentassist.IdeContentProposalProvider;
import org.eclipse.xtext.scoping.IScope;
import org.eclipse.xtext.scoping.IScopeProvider;
import edu.vanderbilt.isis.caid.assurancedsl.assurance.AssurancePackage;
import edu.vanderbilt.isis.caid.assurancedsl.services.AssuranceGrammarAccess;

import com.google.common.base.Joiner;
import com.google.common.collect.Iterables;
import com.google.inject.Inject;

public class AssuranceIdeContentProposalProvider extends IdeContentProposalProvider {
	@Inject
	private AssuranceGrammarAccess assuranceGrammarAccess;

	@Inject
	private IScopeProvider scopeProvider;

	@Override
	protected void _createProposals(RuleCall ruleCall, ContentAssistContext context,
			IIdeContentProposalAcceptor acceptor) {
		// if (assuranceGrammarAccess.getGreetingRule().equals(ruleCall.getRule()) && context.getCurrentModel() != null) {
		// 	IScope scope = scopeProvider.getScope(context.getCurrentModel(), AssurancePackage.Literals.GREETING__FROM);
		// 	acceptor.accept(getProposalCreator().createSnippet(
		// 			"Hello ${1|A,B,C|} from ${2|" + Joiner.on(",")
		// 					.join(Iterables.transform(scope.getAllElements(), it -> it.getName().toString())) + "|}!",
		// 			"New Greeting (Template with Choice)", context), 0);
		// 	acceptor.accept(getProposalCreator().createSnippet("Hello ${1:name} from ${2:fromName}!",
		// 			"New Greeting (Template with Placeholder)", context), 0);
		// }
		super._createProposals(ruleCall, context, acceptor);
	}
}
