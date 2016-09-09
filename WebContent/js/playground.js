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
	
	$.getJSON('td-schema.json', function(schema) {		
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
