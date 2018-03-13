/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2016 Victor Charpenay
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */
package de.thingweb.playground.sem;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringBufferInputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Predicate;

//import jdk.internal.dynalink.MonomorphicCallSite;

import org.semanticweb.HermiT.Configuration;
import org.semanticweb.HermiT.Reasoner;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.io.IRIDocumentSource;
import org.semanticweb.owlapi.io.OWLOntologyDocumentSource;
import org.semanticweb.owlapi.model.AddAxiom;
import org.semanticweb.owlapi.model.AddImport;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLAxiom;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLDataFactory;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLImportsDeclaration;
import org.semanticweb.owlapi.model.OWLIndividual;
import org.semanticweb.owlapi.model.OWLLiteral;
import org.semanticweb.owlapi.model.OWLNamedIndividual;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyChange;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyIRIMapper;
import org.semanticweb.owlapi.model.OWLOntologyLoaderConfiguration;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.model.OWLOntologyStorageException;
import org.semanticweb.owlapi.model.RemoveAxiom;
import org.semanticweb.owlapi.model.RemoveImport;
import org.semanticweb.owlapi.reasoner.FreshEntityPolicy;
import org.semanticweb.owlapi.reasoner.Node;
import org.semanticweb.owlapi.reasoner.OWLReasoner;
import org.semanticweb.owlapi.reasoner.OWLReasonerConfiguration;
import org.semanticweb.owlapi.reasoner.OWLReasonerFactory;
import org.semanticweb.owlapi.reasoner.SimpleConfiguration;
import org.semanticweb.owlapi.util.SimpleIRIMapper;

import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;
import com.hp.hpl.jena.rdf.model.Statement;
import com.hp.hpl.jena.rdf.model.StmtIterator;

import de.thingweb.playground.sem.JenaAxiomFactory;

public class Annotator {

  public static final String WOT_URI = "http://w3c.github.io/wot/w3c-wot-td-ontology.owl";

  private static final OWLOntologyManager sManager = OWLManager.createOWLOntologyManager();
  private static final OWLDataFactory sFactory = sManager.getOWLDataFactory();

  private final OWLOntology WoT;
  private final Set<String> mKnownOntologies;

  private OWLOntology mOntology;
  private OWLReasoner mReasoner;

  public Annotator(Map<String, String> m) throws OWLOntologyCreationException {
    for (String k : m.keySet()) {
      OWLOntologyIRIMapper mapper = new SimpleIRIMapper(IRI.create(k),
                                                        IRI.create(m.get(k)));
      sManager.addIRIMapper(mapper);
    }
    mKnownOntologies = m.keySet();

    mOntology = sManager.createOntology();

    WoT = sManager.loadOntology(IRI.create(WOT_URI));
    OWLImportsDeclaration wot = sFactory.getOWLImportsDeclaration(WoT.getOntologyID().getOntologyIRI());
    sManager.applyChange(new AddImport(mOntology, wot));
  }

  public void addThingDescription(InputStream stream, String format) throws IOException, AnnotatorException, OWLOntologyCreationException {
    Model td = ModelFactory.createDefaultModel();
    td.read(stream, "http://localhost/", format); // TODO parameterize base URL?

    JenaAxiomFactory jaf = new JenaAxiomFactory(sFactory);
    List<OWLOntologyChange> changes = new ArrayList<OWLOntologyChange>();

    for (OWLImportsDeclaration i : jaf.getImportDeclarations(td, mKnownOntologies)) {
      changes.add(new AddImport(mOntology, i));
      sManager.loadOntology(i.getIRI());
    }
    for (OWLAxiom a : jaf.getAxioms(td)) {
      changes.add(new AddAxiom(mOntology, a));
    }

    sManager.applyChanges(changes);
    if (!isConsistent()) {
      undoChanges(changes);
      throw new AnnotatorException(null); // FIXME how to find the affected axiom?
    }
  }

  public void addAnnotation(String entity, String type) throws AnnotatorException {
    if (!mOntology.containsIndividualInSignature(IRI.create(entity))) {
      System.out.println("Note: annotated individual has not been defined yet."); // TODO throw exception
    }
    if (!mOntology.containsClassInSignature(IRI.create(type))) {
      System.out.println("Note: annotation type has not been defined yet"); // TODO throw exception
    }

    List<OWLOntologyChange> changes = new ArrayList<OWLOntologyChange>();
    OWLClass t = sFactory.getOWLClass(IRI.create(type));
    OWLNamedIndividual e = sFactory.getOWLNamedIndividual(IRI.create(entity));
    OWLAxiom a = sFactory.getOWLClassAssertionAxiom(t, e);
    changes.add(new AddAxiom(mOntology, a));

    sManager.applyChange(changes.get(0));
    if (!isConsistent()) {
      undoChanges(changes);
      throw new AnnotatorException(a);
    }
  }

  public List<OWLClass> getSuggestions(String prefix) {
    List<OWLClass> types = new ArrayList<OWLClass>();

    // TODO use index instead?
    for (OWLClass t : mOntology.getClassesInSignature()) {
      if (t.getIRI().getFragment().startsWith(prefix)) {
        types.add(t);
      }
    }

    return types;
  }

  private boolean isConsistent() {
    // note: OWL-Time uses data types not supported by the reasoner
    mReasoner = new Reasoner(new Configuration() {{
      ignoreUnsupportedDatatypes = true;
    }}, mOntology);
    //	mReasoner.flush();
    return mReasoner.isConsistent();
  }

  private void undoChanges(List<OWLOntologyChange> changes) {
    List<OWLOntologyChange> inverseChanges = new ArrayList<OWLOntologyChange>();
    for (OWLOntologyChange c : changes) {
      if (c.isAddAxiom()) {
        inverseChanges.add(new RemoveAxiom(c.getOntology(), c.getAxiom()));
      } else if (c.isImportChange()) {
        inverseChanges.add(new RemoveImport(c.getOntology(), ((AddImport) c).getImportDeclaration()));
      }
    }
    sManager.applyChanges(inverseChanges);
  }

}
