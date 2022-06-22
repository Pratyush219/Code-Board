const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);
const compiler = require("compilex");
let options = { stats: true }; //prints stats on console
compiler.init(options);

let publicPath = "./public";
app.use(express.static(publicPath));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let port = process.env.PORT || 9999;
server.listen(port, (error) => {
    if (error) {
        console.log("Something went wrong");
    } else console.log("Server listening on port ", port);
});
let connections = new Set();
let imageData;
function isBoard(sock) {
    return sock.handshake.query.type === "board";
}
function isEditor(sock) {
    return sock.handshake.query.type === "editor";
}
io.on("connection", (socket) => {
    console.log(`${socket.id} has connnected`);
    console.log(connections.size);
    socket.on("request-data", () => {
        console.log(`${socket.id} New connection`);
        console.log("Before:", connections.size);
        let requestedBoardData = false;
        let requestedEditorData = false;
        if(connections.size > 0) {
            console.log('Requesting drawing and code');
            let it = connections.values();
            let src = it.next();
            console.log(src.value);
            io.to(src.value).emit('get-data', socket.id);
            io.to(src.value).emit("get-code", socket.id);
        }

        // for (let src of connections.values()) {
        //     console.log(
        //         "Requesting",
        //         socket.handshake.query.type,
        //         src.handshake.query.type,
        //         requestedBoardData,
        //         requestedEditorData,
        //         isBoard(socket),
        //         isEditor(socket)
        //     );
        //     if (isBoard(socket)) {
        //         if (
        //             !requestedBoardData &&
        //             src.handshake.query.type === "board"
        //         ) {
        //             console.log("Requesting", src.id, src.handshake.query.type);
        //             io.to(src.id).emit("get-data", socket.id);
        //             requestedBoardData = true;
        //         }
        //     } 
        //     else {
        //         if (
        //             !requestedEditorData &&
        //             src.handshake.query.type === "editor"
        //         ) {
        //             console.log("Requesting", src.id, src.handshake.query.type);
        //             io.to(src.id).emit("get-code", socket.id);
        //             requestedEditorData = true;
        //         }
        //     }
        // }

        connections.add(socket.id);
        console.log("After:", connections.size);
    });

    socket.on("receive-data", (data, dest, color, brushsize, erasing) => {
        // if (isBoard(socket)) {
            console.log("Receive", dest);
            imageData = data;
            io.to(dest).emit("new-connection", imageData, color, brushsize, erasing);
        // }
    });
    socket.on("receive-code", (data, pos, htmlValue, language, dest,ip,result) => {
        // if (isEditor(socket)) {
            console.log("Updating", dest);
            io.to(dest).emit("onRender", data, pos,ip,result);
            io.to(dest).emit("onlang", htmlValue, language);
        // }
    });
    socket.on("draw", (data) => {
        // console.log(data.X, data.Y);
        // if (isBoard(socket)) {
            socket.broadcast.emit(
                "onDraw",
                data.X,
                data.Y,
                data.colorVal,
                data.sizeVal
            );
        // }
    });
    socket.on('drawMode', () => {
        io.emit('onDrawMode');
    })
    socket.on("eraseMode", () => {
        io.emit("onEraseMode");
    });
    socket.on("clearScreen", () => {
        // if (isBoard(socket)) {
            socket.broadcast.emit("onClearScreen");
        // }
    });
    socket.on("down", (data) => {
        // if (isBoard(socket)) {
            socket.broadcast.emit("onDown", data.X, data.Y);
        // }
    });
    socket.on("lineEnd", () => {
        // if (isBoard(socket)) {
            io.emit("onLineEnd");
        // }
    });
    socket.on("propertyChange", () => {
        // if (isBoard(socket)) {
            io.emit("onPropertyChange");
        // }
    });
    socket.on("linecolorchange", (data) => {
        // if (isBoard(socket)) {
            socket.broadcast.emit("onlinecolorchange", data);
        // }
    });
    socket.on("brushSizechange", (data) => {
        // if (isBoard(socket)) {
            socket.broadcast.emit("onbrushsizechange", data);
        // }
    });
    socket.on("disconnect", (reason) => {
        for(let sock of connections.values()) {
            if(sock == socket.id) {
                connections.delete(sock);
            }
        }
        console.log(`${socket.id} has disconnnected`);
    });
    socket.on("render", (data, pos) => {
        //console.log(data);
        // if (isEditor(socket)) {
            console.log(`Render ${data}`);
            socket.broadcast.emit("onRender", data, pos);
        // }
    });

    socket.on("lang", (htmlValue, language) => {
        // if (isEditor(socket)) {
            //console.log(data);
            socket.broadcast.emit("onlang", htmlValue, language);
        // }
    });

    socket.on("op", (data) => {
        // if (isEditor(socket)) {
            //console.log(data);
            socket.broadcast.emit("onop", { char: data });
        // }
    });

    socket.on("ip", (data) => {
        // if (isEditor(socket)) {
            //console.log(data);
            socket.broadcast.emit("onip", { char: data });
        // }
    });
});

// io.on("connect", (socket) => {
//     connectionsEditor.push(socket);
//     console.log(`${socket.id} has connected`);
//     connections.add(socket);
//     console.log(socket.id, socket.handshake.query.type);
//     socket.on("render", (data, pos) => {
//         //console.log(data);
//         console.log(`Render ${data}`);
//         socket.broadcast.emit("onRender", data, pos);
//     });

//     socket.on("lang", (htmlValue, language) => {
//         //console.log(data);
//         socket.broadcast.emit("onlang", htmlValue, language);
//     });

//     socket.on("op", (data) => {
//         //console.log(data);
//         socket.broadcast.emit("onop", { char: data });
//     });

//     socket.on("ip", (data) => {
//         //console.log(data);
//         socket.broadcast.emit("onip", { char: data });
//     });

//     socket.on("disconnect", (reason) => {
//         connections = new Set(
//             Object.values(connections).filter((con) => con.id !== socket.id)
//         );
//         console.log(`${socket.id} is disconnected`);
//         // connectionsEditor = connectionsEditor.filter((con) => {
//         //     con.id != socket.id;
//         // });
//     });
// });

app.post("/getOutput", (req, res) => {
    console.log("Getting output...");
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
