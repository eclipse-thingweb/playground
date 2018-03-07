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
var ajv; /* JSON Schema validator */

function trigger(name, data) {
	var ev = new CustomEvent(name, {
		detail: data
	});
	document.dispatchEvent(ev);
}

function light(success, id) {
	var circle = $('#' + id);
	circle.css('visibility', 'visible');
	var color = success ? 'green' : 'red';
	circle.attr('fill', color);
}

function reset(id) {
	var circle = $('#' + id);
	circle.css('visibility', 'hidden');
}

function validate() {
	var text = $('#td-text').val();
	reset('spot-json');
	reset('spot-json-schema');
	reset('spot-json-ld');
	reset('spot-owl');
	trigger('validate-json', text);
}

function log(message) {
	var pgConsole = $('#console');
	pgConsole.append(message + '&#13;&#10;');
}

$(function() {
	$('#td-text').linedtextarea();
	
	$.getJSON('td-schema-eko.json', function(schema) {
		ajv = Ajv();
		ajv.addSchema(schema, 'td');
		
		document.addEventListener('validate-json', function(e) {
			try {
				var data = JSON.parse(e.detail);
				light(true, 'spot-json');
				log('JSON validation... OK');
				trigger('validate-json-schema', data);
			} catch (err) {
				if (err instanceof SyntaxError) {
					light(false, 'spot-json');
					log('JSON validation... KO:');
					log('> ' + err.message);
				}
			}
		}, false);
		
		document.addEventListener('validate-json-schema', function(e) {
			var valid = ajv.validate('td', e.detail);
			if (valid) {
				light(true, 'spot-json-schema');
				log('JSON Schema validation... OK');
				trigger('validate-json-ld', e.detail);
			} else {
				light(false, 'spot-json-schema');
				log('JSON Schema validation... KO:');
				log('> ' + ajv.errorsText());
			}
		}, false);
		
		document.addEventListener('validate-json-ld', function(e) {
			jsonld.toRDF(e.detail, { format: 'application/nquads' }, function(err, triples) {
				if (!err) {
					light(true, 'spot-json-ld');
					log('JSON-LD validation... OK');
					trigger('validate-owl', triples);
				} else {
					light(false, 'spot-json-ld');
					log('JSON-LD validation... KO:');
					log('> ' + err);
				}
			});
		}, false);
		
		document.addEventListener('validate-owl', function(e) {
			$.post({
				url: 'sem',
				data: e.detail,
				contentType: 'application/nquads',
				success: function(diagnosis) {
					if (diagnosis.valid) {
						light(true, 'spot-owl');
						log('TD/OWL validation... OK');
					} else {
						light(false, 'spot-owl');
						log('TD/OWL validation... KO!');
					}
				}
			});
		}, false);
		
		$('#td-validate').removeAttr('disabled');
	});
});
