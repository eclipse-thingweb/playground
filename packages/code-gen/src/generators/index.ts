import { CodeGenerator } from "./helpers.js";

// Language-specific generators
import {
    generateFetchCode,
    generateNodeWotCode,
    generateWebthingCode,
    generateModbusSerialCode,
} from "./javascript.js";
import { generateRequestsCode, generateWotPyCode, generatePyModbusCode } from "./python.js";
import { generateJavaHttpClientCode, generateWotServientCode, generateDigitalpetriModbusCode } from "./java.js";
import { generateReqwestCode } from "./rust.js";
import { generateGoNetHttpCode } from "./go.js";
import { generateCSharpHttpClientCode, generateWotNetCode } from "./csharp.js";
import { generatePhpCurlCode } from "./php.js";
import { generateRubyNetHttpCode } from "./ruby.js";
import { generateDartWotCode, generateDartHttpCode } from "./dart.js";

/**
 * Registry mapping "language:library" keys to their code generator functions.
 * Add new entries here when adding support for a new language or library.
 */
export const GENERATOR_REGISTRY: Record<string, CodeGenerator> = {
    // JavaScript
    "javascript:fetch": generateFetchCode,
    "javascript:node-wot": generateNodeWotCode,
    "javascript:webthing": generateWebthingCode,
    "javascript:modbus-serial": generateModbusSerialCode,

    // Python
    "python:requests": generateRequestsCode,
    "python:wotpy": generateWotPyCode,
    "python:PyModbus": generatePyModbusCode,

    // Java
    "java:httpclient": generateJavaHttpClientCode,
    "java:wot-servient": generateWotServientCode,
    "java:digitalpetri/modbus": generateDigitalpetriModbusCode,

    // Rust
    "rust:reqwest": generateReqwestCode,

    // Go
    "go:net-http": generateGoNetHttpCode,

    // C#
    "c#:httpclient": generateCSharpHttpClientCode,
    "c#:WoT.Net": generateWotNetCode,

    // PHP
    "php:curl": generatePhpCurlCode,

    // Ruby
    "ruby:net-http": generateRubyNetHttpCode,

    // Dart
    "dart:dart-wot": generateDartWotCode,
    "dart:http": generateDartHttpCode,
};
