const server = require("./server").server;
const app = require('./server').app;
const io = require("socket.io")(server);
const compiler = require("compilex");
let options = { stats: true }; //prints stats on console
compiler.init(options);

let connectionsEditor = [];

io.on("connect", (socket) => {
    connectionsEditor.push(socket);
    console.log(`${socket.id} has connected`);

    socket.on("draw", (data) => {
        //console.log(data);
        connectionsEditor.forEach((conn) => {
            if (conn.id != socket.id) {
                //console.log(data);
                //console.log(typeof data);
                conn.emit("ondraw", { char: data });
            }
        });
    });

    socket.on("lang", (data) => {
        //console.log(data);
        connectionsEditor.forEach((conn) => {
            if (conn.id != socket.id) {
                //console.log(data);
                //console.log(typeof data);
                conn.emit("onlang", { char: data });
            }
        });
    });

    socket.on("op", (data) => {
        //console.log(data);
        connectionsEditor.forEach((conn) => {
            if (conn.id != socket.id) {
                //console.log(data);
                //console.log(typeof data);
                conn.emit("onop", { char: data });
            }
        });
    });

    socket.on("ip", (data) => {
        //console.log(data);
        connectionsEditor.forEach((conn) => {
            if (conn.id != socket.id) {
                //console.log(data);
                //console.log(typeof data);
                conn.emit("onip", { char: data });
            }
        });
    });

    socket.on("disconnect", (reason) => {
        console.log(`${socket.id} is disconnected`);
        connectionsEditor = connectionsEditor.filter((con) => {
            con.id != socket.id;
        });
    });
});

app.post("/getOutput", (req, res) => {
    let content = req.body;
    let lang = content[0];
    let code = content[1];
    let input = content[2];
    console.log(lang);
    console.log(code);
    console.log(input);

    console.log(content);

    if (lang === "c" || lang === "cpp") {
        var envData = {
            OS: "windows",
            cmd: "g++",
            options: { timeout: 10000 },
        }; // (uses g++ command to compile )

        if (input === "") {
            compiler.compileCPP(envData, code, function (data) {
                if (data.error) {
                    console.log(data.error);
                    res.json({ output: data.error });
                } else {
                    console.log(data.output);
                    res.json({ output: data.output });
                }
                //data.error = error message
                //data.output = output value
            });
        } else if (input !== "") {
            compiler.compileCPPWithInput(envData, code, input, function (data) {
                if (data.error) {
                    console.log(data.error);
                    res.json({ output: data.error });
                } else {
                    console.log(data.output);
                    res.json({ output: data.output });
                }
            });
        }
    } else if (lang === "python") {
        var envData = { OS: "windows" };

        if (input === "") {
            compiler.compilePython(envData, code, function (data) {
                if (data.error) {
                    console.log(data.error);
                    res.json({ output: data.error });
                } else {
                    console.log(data.output);
                    res.json({ output: data.output });
                }
            });
        } else if (input !== "") {
            compiler.compilePythonWithInput(
                envData,
                code,
                input,
                function (data) {
                    if (data.error) {
                        console.log(data.error);
                        res.json({ output: data.error });
                    } else {
                        console.log(data.output);
                        res.json({ output: data.output });
                    }
                }
            );
        }
    }
    // else if(lang ==='java')
    // {
    //     var envData = { OS : "windows"};
    //     if(input==="")
    //     {
    //         compiler.compileJava( envData , code , function(data){
    //             if(data.error)
    //             {
    //                 console.log(data.error);
    //                 res.json({output:data.error});
    //             }
    //             else
    //             {
    //                 console.log(data.output);
    //                 res.json({output:data.output});
    //             }
    //         });
    //     }
    //     else if(input!=="")
    //     {
    //         compiler.compileJavaWithInput( envData , code , input ,  function(data){
    //             if(data.error)
    //             {
    //                 console.log(data.error);
    //                 res.json({output:data.error});
    //             }
    //             else
    //             {
    //                 console.log(data.output);
    //                 res.json({output:data.output});
    //             }
    //         });
    //     }
    // }
});

compiler.flush(function () {
    console.log("All temporary files flushed !");
});
