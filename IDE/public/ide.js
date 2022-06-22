var io = io.connect('http://localhost:8080/');

let editor;
let selection;

window.onload = function() {
    editor = ace.edit("editor", {
        mode: "ace/mode/c_cpp",
        theme: "ace/theme/monokai",
        selectionStyle: "text",
    });
    selection = editor.getSession().getSelection();
    console.log(typeof editor);
}

function changeLanguage() {

    let language = document.getElementById("languages").value;

    console.log(language);

    if(language == 'c' || language == 'cpp')editor.session.setMode("ace/mode/c_cpp");
    else if(language == 'python')editor.session.setMode("ace/mode/python");
    // else if(language == 'java')editor.session.setMode("ace/mode/java");

    let lang = document.querySelector(`#${language}`).innerHTML;

    io.emit('lang',lang);
}

io.on('onlang',({char})=>{
    console.log(char);
    console.log(typeof char);
    
    document.getElementById("languages").innerHTML=`<option value="c">${char}</option>`;

});

async function executeCode(){

    let url = "http://localhost:8080/getOutput";
    let input = document.querySelector(".input").value;

    console.log(typeof input);
    let content = [document.getElementById("languages").value,editor.getSession().getValue(),input];

    console.log(content);
    const response = await fetch(url,{
            headers: {
                'Content-type': 'application/json'
            },
            method : 'POST',
            body : JSON.stringify(content)
        });
        const data = await response.json();
        console.log(data.output);

        let str1 = data.output;
        console.log("str1");
        console.log(str1);
        let str2 = "";
        for(let i=0;i<str1.length;i++)
        {
            if(( str1[i] === "\n"))
            {
                str2 += '<br>';
                continue;
            }
            str2 += str1.charAt(i);
        }
        console.log("str2");
        console.log(str2);
        document.querySelector(".output").innerHTML = str2;

        //io.emit('ip',input);
        io.emit('op',str2);
}

io.on('onip',({char})=>{
    console.log(char);
    console.log(typeof char);
    
    document.querySelector(".input").innerHTML = char;
});

io.on('onop',({char})=>{
    console.log(char);
    console.log(typeof char);
    
    document.querySelector(".output").innerHTML = char;
    console.log("Exiting ondraw");

});

// function executeeCode() {

//     $.ajax({

//         url: "/ide/app/compiler.php",

//         method: "POST",

//         data: {
//             language: document.getElementById("languages").value,
//             code: editor.getSession().getValue()
//         },

//         success: function(response) {
//             $(".output").text(response)
//         }
//     });
// }

io.on('ondraw',({char})=>{
    console.log("Inside ondraw");
    
    // console.log(char);
    console.log(typeof char);
    
    editor.setValue(char);
    editor.focus();
    selection.clearSelection();
});

document.querySelector(".input").addEventListener('change',event=>{
    let input = document.querySelector(".input").value;
    io.emit('ip',input);
    console.log(typeof ed);
});

document
    .getElementById("editor-container")
    .addEventListener("keyup", (event) => {
        var ed = editor.getValue();
        console.log("Inside keyup");
        console.log(ed[ed.length - 1]);
        io.emit("draw", ed);
        console.log(typeof ed);
        console.log("Exiting keyup");
    });