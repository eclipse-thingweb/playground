# thingweb-playground
Validation tool for thing descriptions

## Quick Start
The project uses [Gradle](https://gradle.org/gradle-download/) as a build tool.

 - Run `gradle build`
 - Run `gradle jettyRunWar`
 - Go to http://localhost:8080/thingweb-playground/

Alternatively, the generated .war in `build/libs/` can be deployed on any
Java EE server implementing the Servlet API
(like [Apache Tomcat](http://tomcat.apache.org/), [Jetty](https://www.eclipse.org/jetty/) and many others).
