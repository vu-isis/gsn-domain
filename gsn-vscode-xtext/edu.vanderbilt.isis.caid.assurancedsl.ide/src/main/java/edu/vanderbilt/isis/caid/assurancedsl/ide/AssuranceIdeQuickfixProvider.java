package edu.vanderbilt.isis.caid.assurancedsl.ide;

import org.eclipse.xtext.ide.editor.quickfix.AbstractDeclarativeIdeQuickfixProvider;
import org.eclipse.xtext.ide.editor.quickfix.DiagnosticResolutionAcceptor;
import org.eclipse.xtext.ide.editor.quickfix.QuickFix;
import org.eclipse.xtext.xbase.lib.StringExtensions;
import edu.vanderbilt.isis.caid.assurancedsl.validation.AssuranceValidator;


public class AssuranceIdeQuickfixProvider extends AbstractDeclarativeIdeQuickfixProvider {
	
	// @QuickFix(AssuranceValidator.INVALID_NAME)
	// public void textFixLowerCaseName(DiagnosticResolutionAcceptor acceptor) {
	// 	acceptor.accept("Capitalize Name",  (diagnostic, obj, document) -> {
	// 		return createTextEdit(diagnostic, StringExtensions.toFirstUpper(document.getSubstring(diagnostic.getRange())));
	// 	}
			
	// 	);
	// }

}
