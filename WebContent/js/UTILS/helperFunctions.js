function browserName(){
    let nAgt = navigator.userAgent;
    let browserName  = navigator.appName;
    let fullVersion  = ''+parseFloat(navigator.appVersion); 
    let majorVersion = parseInt(navigator.appVersion,10);
    let nameOffset,verOffset,ix;
    
    // In Opera 15+, the true version is after "OPR/" 
    if ((verOffset=nAgt.indexOf("OPR/"))!=-1) {
     browserName = "Opera";
     fullVersion = nAgt.substring(verOffset+4);
    }
    // In older Opera, the true version is after "Opera" or after "Version"
    else if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
     browserName = "Opera";
     fullVersion = nAgt.substring(verOffset+6);
     if ((verOffset=nAgt.indexOf("Version"))!=-1) 
       fullVersion = nAgt.substring(verOffset+8);
    }
    // In MSIE, the true version is after "MSIE" in userAgent
    else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
     browserName = "Microsoft Internet Explorer";
     fullVersion = nAgt.substring(verOffset+5);
    }
    // In Chrome, the true version is after "Chrome" 
    else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
     browserName = "Chrome";
     fullVersion = nAgt.substring(verOffset+7);
    }
    // In Safari, the true version is after "Safari" or after "Version" 
    else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
     browserName = "Safari";
     fullVersion = nAgt.substring(verOffset+7);
     if ((verOffset=nAgt.indexOf("Version"))!=-1) 
       fullVersion = nAgt.substring(verOffset+8);
    }
    // In Firefox, the true version is after "Firefox" 
    else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
     browserName = "Firefox";
     fullVersion = nAgt.substring(verOffset+8);
    }
    // In most other browsers, "name/version" is at the end of userAgent 
    else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) < 
              (verOffset=nAgt.lastIndexOf('/')) ) 
    {
     browserName = nAgt.substring(nameOffset,verOffset);
     fullVersion = nAgt.substring(verOffset+1);
     if (browserName.toLowerCase()==browserName.toUpperCase()) {
      browserName = navigator.appName;
     }
    }
    
    return browserName;
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getTD_URL(urlAddr){

    $.getJSON(urlAddr,function(data){
 
     window.editor.setValue(JSON.stringify(data,null,'\t'));

    }).error(function(){alert("The JSON could not be fetched from the address:\n"+urlAddr)});

}
///////////////////////////////////////////////////////////////////

function populateExamples(urlAddrObject){

    var examplesHtml="";

	$.each(urlAddrObject,function(name,data) {
		if (data["type"]=="valid") {
            examplesHtml+='<option class="btn-success" value='+name+'>'+name +'</option>';
        }
		if (data["type"]=="warning") {
            examplesHtml+='<option class="btn-warning" value='+name+'>'+name +'</option>';
        }
		if (data["type"]=="invalid"){
			examplesHtml+='<option class="btn-danger" value='+name+'>'+name +'</option>';
        }
	});

    $("#load_example").append(examplesHtml);
    
}
//////////////////////////////////////////////////////////////////////

function performAssertionTest(e){

    e.preventDefault()
    $("#curtain").css("display","block")// drop curtian while  assertions test going on
    $("#curtain-text").html("Assertion test is going to be loaded.")
    var assertionSchemas=[]
    var manualAssertionsJSON=[]
    var tdToValidate=window.editor.getValue()
    

    var tdSchema=[];
    var draft=[];
    const bcp47pattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i; // eslint-disable-line max-len

    


    $.getJSON('list.json', function (assertionList) {
        
        var tAssertions=assertionList.length
        
        for (var i = 0; i < tAssertions; i++) {
            // send an AJAX request to each individual JSON file
            // available on the server as returned by the discover endpoint
            $("#curtain-text").html("Loading Assertion Schemas:"+(i*100/tAssertions).toString()+"%")
            $.getJSON('../AssertionTester/Assertions/'+assertionList[i], function (assertion) {
                
                assertionSchemas.push(assertion);
                
            });
        }
        console.log(assertionSchemas)
        $("#curtain-text").html("Loading JSON Schema Darft 06");
        $.getJSON('json-schema-draft-06.json', function (json) {
                
            draft=json;
            $("#curtain-text").html("Loading TD Schema. ");
            $.getJSON('td-schema.json', function (schemajson) {
                tdSchema=schemajson;
                var curCsvResults = []
                
                try {
                    curCsvResults = assertionValidate(tdToValidate, assertionSchemas, manualAssertions, tdSchema, draft);
                    
                    //toOutput(JSON.parse(tdToValidate).id, outputLocation, curCsvResults)
                    console.log(curCsvResults);
                } catch (error) {
                    //this needs to go to output
                    console.log({
                        "ID": error,
                        "Status": "fail",
                        "Comment":"Invalid TD"
                    });
                    results.push({
                        "ID": error,
                        "Status": "fail",
                        "Comment":"Invalid TD"
                    });
                    curCsvResults=results
                }
                //console.log(schemajson)

                $("#curtain-text").html("Creating outputfile.");
                assertionTestResult=curCsvResults;
                 var assertionTestResultFormatted=[];
                let csvContent = "data:text/csv;charset=utf-8,";
    
               
                
                var headers = {
                    ID: "ID",
                    Status: "Status",
                    Comment:"Comment"
                };


                assertionTestResult.forEach((item) => {
                    if(item.Comment){
                    assertionTestResultFormatted.push({
                        ID: item.ID.replace(/,/g, ''), // remove commas to avoid errors,
                        Status: item.Status.replace(/,/g, ''),
                        Comment: item.Comment.replace(/,/g, '')    })}
                    else{
                        assertionTestResultFormatted.push({
                            ID: item.ID.replace(/,/g, ''), // remove commas to avoid errors,
                            Status: item.Status.replace(/,/g, ''),
                            Comment: "no Comment"})
                        }
                    
                    });
                
                var fileTitle="assertionTest";

                exportCSVFile(headers, assertionTestResultFormatted, fileTitle);

                
                $("#curtain").css("display","none")// remove curtain

        });

    });
    });
}

///////////////////////////////////////////////////////////
function textAreaManipulation(e) {
    if(e.keyCode === 9) { // tab was pressed
        // get caret position/selection
        var start = this.selectionStart;
        var end = this.selectionEnd;

        var $this = $(this);
        var value = $this.val();

        // set textarea value to: text before caret + tab + text after caret
        $this.val(value.substring(0, start)
                    + "\t"
                    + value.substring(end));

        // put caret at right position again (add one for the tab)
        this.selectionStart = this.selectionEnd = start + 1;

        // prevent the focus lose
        e.preventDefault();
    }
}

/////////////////////////////////////////////////////////////////////////

function submitAsGist(){
    var name = prompt("Please enter the Name of TD:");
    
    var data={
            "description": "Directly from playground",
                "public": true,
                "files": {
                [name]: {
                "content": window.editor.getValue()
                        }
                }
            };

        var url='https://api.github.com/gists';

        /////please fill in the token after getting the code from github for example:
        ////"Authorization" : `Token #`
        ////To
        ////"Authorization" : `Token 60222272d2d5c5a82d2df4a857c528cf4620f175`

        const headers = {
                "Authorization" : `Token 5671aca3addfdf7ee2d595d6f38daeb15dd6ecc9 `
            }
        
        $.ajax({
                type: "POST",
                url: url,
                headers:headers,
                success: success,
                data:JSON.stringify(data),
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                     alert(errorThrown);
                  }

        
            });

            function success(data)
                {  
                    let file=data.files[name].raw_url;
                    
                    window.open(file, '_blank');
                    //console.log(file);
                    

                    }
            }

////////////////////////////////////////////////////////////////////////////
function toggleValidationStatusTable(e){
    $("#validation_table").fadeToggle("fast"); 
    if($("#table_head_arrow").attr('class')=="up"){
        $("#table_head_arrow").removeClass();
            $("#table_head_arrow").toggleClass("down");

    }
    else{
        {
        $("#table_head_arrow").removeClass();
            $("#table_head_arrow").toggleClass("up");

     }

    }


}
////////////////////////////////////////////////////

function getExamplesList(){
            let examples={
                "Simple TD": {
                    "addr": "https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Valid/simple.json",
                    "type": "valid"
                },
                "Multiple op":{
                    "addr":"https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Valid/formOpArray.json",
                    "type":"valid"
                },
                "Enum-Const Contradiction":{
                    "addr":"https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Warning/enumConst.json",
                    "type":"warning"
                },
                "Array with no Items":{
                    "addr":"https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Warning/arrayNoItems.json",
                    "type":"warning"
                },
                "Invalid Operation":{
                    "addr":"https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Invalid/invalidOp.json",
                    "type":"invalid"
                 },
                "Empty Security Defs":{
                    "addr":"https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Invalid/emptySecDef.json",
                    "type":"invalid"
                }
            };

    return examples;
}

//////////////////////////////////////////////////////////////////////

    function exampleSelectHandler (e){
        
        clearLog();
        e.preventDefault();
        if($("#load_example").val()=="select_none"){
            window.editor.setValue("");
    
        }
        else{
            let urlAddr=e.data.urlAddrObject[$("#load_example").val()]["addr"];
            getTD_URL(urlAddr);
        }
    
    }

////////////////////////////////////////////////////////////////////////////////////////////
    ////////////takes character number and gives out the line number//////////////////////////
    function getLineNumber(characterNo,str)
    {
        var charsPerLine=[];
        var str2lines=str.split("\n");


        //calculate number of characters in each line
        $.each(str2lines,function(index,value){
            let str_val=String(value);
            charsPerLine.push(str_val.length);
            characterNo++;
        });

        // find the line containing that characterNo
        let count=0;
        let lineNo=0;
        while(characterNo>count)
        {
            count+=charsPerLine[lineNo];
            lineNo++;
        }
        return lineNo;

    }



/////////////////////////////////////

function isUtf8(bytes)
{
    var i = 0;
    while(i < bytes.length)
    { 
        if(     (// ASCII
                    bytes[i] == 0x09 ||
                    bytes[i] == 0x0A ||
                    bytes[i] == 0x0D ||
                    (0x20 <= bytes[i] && bytes[i] <= 0x7E)
                )
          ) {
              i += 1;
              continue;
          }

        if(     (// non-overlong 2-byte
                    (0xC2 <= bytes[i] && bytes[i] <= 0xDF) &&
                    (0x80 <= bytes[i+1] && bytes[i+1] <= 0xBF)
                )
          ) {
              i += 2;
              continue;
          }

        if(     (// excluding overlongs
                    bytes[i] == 0xE0 &&
                    (0xA0 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
                    (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
                ) ||
                (// straight 3-byte
                 ((0xE1 <= bytes[i] && bytes[i] <= 0xEC) ||
                  bytes[i] == 0xEE ||
                  bytes[i] == 0xEF) &&
                 (0x80 <= bytes[i + 1] && bytes[i+1] <= 0xBF) &&
                 (0x80 <= bytes[i+2] && bytes[i+2] <= 0xBF)
                ) ||
                (// excluding surrogates
                 bytes[i] == 0xED &&
                 (0x80 <= bytes[i+1] && bytes[i+1] <= 0x9F) &&
                 (0x80 <= bytes[i+2] && bytes[i+2] <= 0xBF)
                )
          ) {
              i += 3;
              continue;
          }

        if(     (// planes 1-3
                    bytes[i] == 0xF0 &&
                    (0x90 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
                    (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
                    (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
                ) ||
                (// planes 4-15
                 (0xF1 <= bytes[i] && bytes[i] <= 0xF3) &&
                 (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
                 (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
                 (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
                ) ||
                (// plane 16
                 bytes[i] == 0xF4 &&
                 (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x8F) &&
                 (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
                 (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
                )
          ) {
              i += 4;
              continue;
          }
        return true;
    }
    return true;
}
////////////////
function convertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ','

            line += array[i][index];
        }
        str += line + '\r\n';
    }
    return str;
}

/////////////////////
function exportCSVFile(headers, items, fileTitle) {
    if (headers) {
        items.unshift(headers);
    }

    // Convert Object to JSON
    var jsonObject = JSON.stringify(items);

    var csv = this.convertToCSV(jsonObject);

    var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, exportedFilenmae);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilenmae);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}