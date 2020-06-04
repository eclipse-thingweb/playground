// Load monaco editor ACM
require.config({ paths: { 'vs': './node_modules/monaco-editor/min/vs' }});
require(['vs/editor/editor.main'], function() {
    const editor = monaco.editor.create(document.getElementById('container'), {
        value: [
            'function x() {',
            '\tconsole.log("Hello world!");',
            '}'
        ].join('\n'),
        language: 'javascript'
    });
});
setTimeout(()=>{monaco.editor.setTheme("vs-dark")},2000)

fetch('./list.json')
.then(res => res.json())
.then(data => console.log(data))