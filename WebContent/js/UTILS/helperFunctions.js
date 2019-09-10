



function browserName(){
    let nVer = navigator.appVersion;
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getTD_URL(urlAddr){


    $.getJSON(urlAddr,function(data){
     
   
   $("#td-text").empty();
   $("#td-text").append(JSON.stringify(data,null,'\t'));
 
   
   //console.log(data);

}).error(function(){alert("The JSON couldnt be fetched from the address:\n"+urlAddr)});


}


function populateExamples(urlAddrObject){

    var examplesHtml="";

	


	$.each(urlAddrObject,function(name,data) {

		if (data["type"]=="valid")
			examplesHtml+='<option class="btn-sucess" value='+name+'>'+name +'</option>';
		if (data["type"]=="warning")
			examplesHtml+='<option class="btn-warning" value='+name+'>'+name +'</option>';
		if (data["type"]=="invalid")
			examplesHtml+='<option class="btn-danger" value='+name+'>'+name +'</option>';
		
		
	});

	$("#load_example").append(examplesHtml);



}



function getExamplesList(){
            let examples={
                "formOpArray":{"addr":"https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Valid/formOpArray.json",
                                "type":"valid"},
                "certSec":{"addr":"https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Valid/certSec.json",
                            "type":"valid"},
                "enumConst":{"addr":"https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Warning/enumConst.json",
                            "type":"warning"},
                "earrayNoItems":{"addr":"https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Warning/arrayNoItems.json",
                            "type":"warning"},
                "invalidOp":{"addr":"https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Invalid/invalidOp.json",
                            "type":"invalid"},
                "emptySecDef":{"addr":"https://raw.githubusercontent.com/thingweb/thingweb-playground/master/WebContent/Examples/Invalid/emptySecDef.json",
                            "type":"invalid"}

            };

    return examples;
}



    function exampleSelectHandler (e){
        
        clearLog();
        e.preventDefault();
        if($("#load_example").val()=="select_none"){
            $("#td-text").empty();
    
        }
        else{
            let urlAddr=e.data.urlAddrObject[$("#load_example").val()]["addr"];
            
            
            getTD_URL(urlAddr);
    
    
        }
    
    }


    ////////////////////////////////////////////////////////////////////////////////////////////
    ////////////takes charcter number and gives out the line number//////////////////////////
    function getLineNumber(characterNo,str)
    {
       
        var charsPerLine=[];
        //convert into lines
       // var str2lines="healhekahdaehjaehd aedh \n akushdakhda \n hakdha \n".split("\n");
        var str2lines=str.split("\n");
        
        console.log(str2lines);
        

        //calculate number of characters in each line
    

        $.each(str2lines,function(index,value){
            let str_val=String(value);
            charsPerLine.push(str_val.length);
            characterNo++;
            //console.log(str_val.length);

        });
         





        // find the line containing that characterNo
       let count=0;
       let lineNo=0;
        while(characterNo>count)
        {
            count+=charsPerLine[lineNo];
            lineNo++;

             
        }
     console.log(characterNo+"  "+lineNo);
        return lineNo;


    }

