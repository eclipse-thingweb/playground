# thingweb-playground
Validation tool for W3C WoT Thing Descriptions. Your Thing Descriptions should be written according to the W3C standard found [here](https://w3c.github.io/wot-thing-description/#).

## Quick Start
The project uses [Gradle](https://gradle.org/gradle-download/) as a build tool.

 - Run `gradle build`
 - Run `gradle jettyRunWar`
 - Go to http://localhost:8080/thingweb-playground/

Alternatively, the generated .war in `build/libs/` can be deployed on any
Java EE server implementing the Servlet API
(like [Apache Tomcat](http://tomcat.apache.org/), [Jetty](https://www.eclipse.org/jetty/) and many others).

## Examples

- Some example Thing Descriptions are provided in the Examples folder at directory WebContent/Examples. There are both valid and invalid ones.

## Troubleshooting

- The Jetty plug-in is no more used with Gradle 4.1 +. Be sure that the build.gradle doesn't contain it. The replacement is Gretty. However jettRunWar command still works
- If 'gradle build' cannot find tools.jar make sure that Java JRE and JDK are installed and are at least version 1.7. If Eclipse can build and run a project, this doesn't imply that JRE and JDK are installed since Eclipse has its own built-in JDK and JRE. If you still have problems check that your JAVA_HOME environment variable is set to the JDK installation location and that gradle.properties in 'GRADLE_USER_HOME' directory points to the tools.jar of your jdk.