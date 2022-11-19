// var client = io.connect("http://localhost:9999", {
//     query: {
//         type: 'editor'
//     }
// });

let editor;
let selection;
let res = "";

client.on('get-code', newSocket => {
    let language = document.getElementById("languages").value;
    let lang = document.getElementById(language).innerHTML;
    console.log('Get code');
    let ip = document.querySelector(".input").value;
    console.log(res);
    console.log(ip);
    client.emit('receive-code', editor.getValue(), editor.getCursorPosition(), lang, language, newSocket, ip, res);
})
window.onload = function () {
    editor = ace.edit("editor", {
        mode: "ace/mode/c_cpp",
        theme: "ace/theme/monokai",
        selectionStyle: "text",
    });
    selection = editor.getSession().getSelection();
    console.log(typeof editor);
};

function changeLanguage() {
    let language = document.getElementById("languages").value;

    console.log(language);

    if (language == "c" || language == "cpp")
        editor.session.setMode("ace/mode/c_cpp");
    else if (language == "python") editor.session.setMode("ace/mode/python");
    // else if(language == 'java')editor.session.setMode("ace/mode/java");

    let lang = document.getElementById(language).innerHTML;

    console.log(document.getElementById("languages").selectedIndex,lang);
    
    let id = document.getElementById("languages").selectedIndex;

    client.emit("lang", id, language);
}

client.on("onlang", (htmlValue, language) => {

    document.getElementById("languages").selectedIndex = htmlValue;

    console.log(language);

    if (language == "c" || language == "cpp")
        editor.session.setMode("ace/mode/c_cpp");
    else if (language == "python") editor.session.setMode("ace/mode/python");
});

async function executeCode() {
    let url = `http://${ip}:9999/getOutput`;
    let input = document.querySelector(".input").value;

    console.log(typeof input);
    let content = [
        document.getElementById("languages").value,
        editor.getSession().getValue(),
        input,
    ];

    console.log(content);
    const response = await fetch(url, {
        headers: {
            "Content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(content),
    });
    const data = await response.json();
    console.log(data.output);

    let str1 = data.output;
    console.log("str1");
    console.log(str1);
    let str2 = "";
    for (let i = 0; i < str1.length; i++) {
        if (str1[i] === "\n") {
            str2 += "<br>";
            continue;
        }
        str2 += str1.charAt(i);
    }
    console.log("str2");
    console.log(str2);
    document.querySelector(".output").innerHTML = str2;

    //io.emit('ip',input);
    client.emit("op", str2);
    res = str2;
}

client.on("onip", ({ char }) => {
    console.log('Input changed', char);
    console.log(typeof char);

    document.querySelector(".input").value = char;
});

client.on("onop", ({ char }) => {
    console.log(char);
    console.log(typeof char);

    document.querySelector(".output").innerHTML = char;
    console.log("Exiting ondraw");
});



client.on("onRender", (char, pos,inp,result) => {
    console.log("Inside ondraw");

    // console.log(char);
    console.log(typeof char);

    editor.setValue(char);
    editor.focus();
    selection.clearSelection();
    editor.moveCursorToPosition(pos);
    console.log(result);
    console.log(inp);
    if(result)
        document.querySelector(".output").innerHTML = result;
    if(inp)
        document.querySelector(".input").value = inp;
});

document.querySelector(".input").addEventListener("change", (event) => {
    let input = document.querySelector(".input").value;
    console.log("Input change");
    client.emit("ip", input);
    console.log(typeof ed);
});

document.getElementById("editor").addEventListener("keyup", (event) => {
        var ed = editor.getValue();
        console.log("Inside keyup");
        console.log(ed[ed.length - 1]);
        client.emit("render", ed, editor.getCursorPosition());
        console.log(typeof ed);
        console.log("Exiting keyup");
    });
