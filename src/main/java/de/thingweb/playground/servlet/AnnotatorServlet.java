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
        mAnnotator = new Annotator(new HashMap<String, String>());
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
