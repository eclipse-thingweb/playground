package de.thingweb.playground.sem;

import org.semanticweb.owlapi.model.OWLAxiom;

public class AnnotatorException extends RuntimeException {

    public AnnotatorException(OWLAxiom axiom) {
	super("Axiom " + axiom + " is inconsistent with current TD.");
    }
    
}
