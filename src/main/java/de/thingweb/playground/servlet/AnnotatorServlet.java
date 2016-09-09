package de.thingweb.playground.servlet;

import java.io.IOException;
import java.util.HashMap;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.semanticweb.owlapi.model.OWLOntologyCreationException;

import de.thingweb.playground.sem.Annotator;
import de.thingweb.playground.sem.AnnotatorException;

/**
 * Servlet implementation class AnnotatorServlet
 */
@WebServlet(name = "sem", description = "Semantic validation of a Thing Description", urlPatterns = { "/sem" })
public class AnnotatorServlet extends HttpServlet {
  
    private static final long serialVersionUID = 1L;
  
    private final Annotator mAnnotator;
       
    /**
     * @throws OWLOntologyCreationException 
     * @see HttpServlet#HttpServlet()
     */
    public AnnotatorServlet() throws OWLOntologyCreationException {
        super();
        mAnnotator = new Annotator(new HashMap<String, String>() {
            {
                put("http://www.loa-cnr.it/ontologies/DUL.owl", "file:///d:/ontologies/DUL.xml");
                put("http://purl.oclc.org/NET/ssnx/ssn", "file:///d:/ontologies/ssn.xml");
                
                put("http://www.loa-cnr.it/ontologies/IRE/IRE.owl", "file:///d:/ontologies/IRE-extended.xml");
                put("http://www.loa-cnr.it/ontologies/KCO/KCO.owl#", "file:///d:/ontologies/KCO.owl.xml");
                put("http://www.loa-cnr.it/ontologies/IOLite.owl", "file:///d:/ontologies/IOLite.owl.xml");
      
                put("http://homepages.laas.fr/nseydoux/ontologies/IoT-O", "file:///d:/ontologies/IoT-O.xml");
                put("http://elite.polito.it/ontologies/poweront.owl", "file:///d:/ontologies/poweront.xml");
                put("http://homepages.laas.fr/nseydoux/ontologies/IoT-Lifecycle", "file:///d:/ontologies/IoT-lifecycle.xml");
                put("http://homepages.laas.fr/nseydoux/ontologies/SAN", "file:///d:/ontologies/SAN.xml");
                put("http://iserve.kmi.open.ac.uk/ns/msm/msm-2014-09-03.rdf", "file:///d:/ontologies/msm.xml");
      
                put("http://purl.oclc.org/NET/UNIS/fiware/iot-lite#", "file:///d:/ontologies/iot-lite.xml");
                
                put ("http://www.w3c.org/wot/td", "file:///d:/ontologies/w3c-wot-td.v2.0.rdf");
            }
        });
    }

    /**
     * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
     */
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
      try
      {
        mAnnotator.addThingDescription(request.getInputStream(), "Turtle");
        response.setContentType("application/json");
        response.getWriter().write("{\"valid\":true}");
      }
      catch (AnnotatorException e)
      {
        response.getWriter().write("{\"valid\":false}");
      }
      catch (OWLOntologyCreationException e)
      {
        throw new IOException(e);
      }
    }

}
