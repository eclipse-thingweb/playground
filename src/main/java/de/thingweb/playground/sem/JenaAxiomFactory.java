package de.thingweb.playground.sem;

import java.util.HashSet;
import java.util.Set;

import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLAxiom;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLDataFactory;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLDatatype;
import org.semanticweb.owlapi.model.OWLImportsDeclaration;
import org.semanticweb.owlapi.model.OWLIndividual;
import org.semanticweb.owlapi.model.OWLLiteral;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import org.semanticweb.owlapi.model.OWLOntology;

import com.hp.hpl.jena.rdf.model.Literal;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ResIterator;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.rdf.model.Statement;
import com.hp.hpl.jena.rdf.model.StmtIterator;

import de.thingweb.playground.sem.Annotator;

/**
 * 
 * Maps Jena statements to OWL axioms.
 *
 * @author z003dp6d
 * @creation 24.05.2016
 *
 */
public class JenaAxiomFactory {
    
    private final OWLDataFactory mFactory;
    private final OWLObjectProperty mRDFType;
    
    public JenaAxiomFactory(OWLDataFactory factory) {
	mFactory = factory;
	mRDFType = mFactory.getOWLObjectProperty(IRI.create("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"));
    }

    public Set<OWLAxiom> getAxioms(Model m) {
	Set<OWLAxiom> axioms = new HashSet<OWLAxiom>();

	StmtIterator it = m.listStatements();
	while (it.hasNext()) {
	    Statement stm = it.next();
        	OWLIndividual s = (stm.getSubject().isAnon()) ?
        		    mFactory.getOWLAnonymousIndividual() :
        		    mFactory.getOWLNamedIndividual(IRI.create(stm.getSubject().getURI()));
        	if (stm.getObject().isResource()) {
        	    OWLObjectProperty p = mFactory.getOWLObjectProperty(IRI.create(stm.getPredicate().getURI()));
        	    if (p.equals(mRDFType)) {
        		OWLClass t = mFactory.getOWLClass(IRI.create(stm.getObject().asResource().getURI()));
        		axioms.add(mFactory.getOWLClassAssertionAxiom(t, s));
        	    } else {
        		OWLIndividual o = (stm.getObject().isAnon()) ?
        			mFactory.getOWLAnonymousIndividual() :
        			mFactory.getOWLNamedIndividual(IRI.create(stm.getObject().asResource().getURI()));
        		axioms.add(mFactory.getOWLObjectPropertyAssertionAxiom(p, s, o));
        	    }
        	} else {
        	    OWLDataProperty p = mFactory.getOWLDataProperty(IRI.create(stm.getPredicate().getURI()));
        	    axioms.add(mFactory.getOWLDataPropertyAssertionAxiom(p, s, getOWLLiteral(stm.getObject().asLiteral())));
        	}
	}
	    
	return axioms;
    }
    
    public Set<OWLImportsDeclaration> getImportDeclarations(Model m, Set<String> ontologies) {
	Set<OWLImportsDeclaration> decl = new HashSet<OWLImportsDeclaration>();
	
	StmtIterator stmIt = m.listStatements();
	while (stmIt.hasNext()) {
	    Statement stm = stmIt.next();
	    String p = toOntoURI(stm.getPredicate().getNameSpace());
	    if (!p.equals(Annotator.WOT_URI) && ontologies.contains(p)) {
		decl.add(mFactory.getOWLImportsDeclaration(IRI.create(p)));
	    }
	    if (stm.getObject().isURIResource()) {
		String o = toOntoURI(stm.getObject().asResource().getNameSpace());
		if (!o.equals(Annotator.WOT_URI) && ontologies.contains(o)) {
			decl.add(mFactory.getOWLImportsDeclaration(IRI.create(o)));
		}
	    }
	}
	
	return decl;
    }
    
    private OWLLiteral getOWLLiteral(Literal l) {
	if (l.getDatatype() == null) {
	    // assumed string
	    return mFactory.getOWLLiteral(l.getLexicalForm());
	} else {
	    OWLDatatype type = mFactory.getOWLDatatype(IRI.create(l.getDatatypeURI()));
	    return mFactory.getOWLLiteral(l.getLexicalForm(), type);
	}
    }
    
    private String toOntoURI(String namespace) {
	if (namespace.endsWith("#") || namespace.endsWith("/")) {
	    return namespace.substring(0, namespace.length() - 1); // remove last char
	}
	return namespace;
    }
    
}
