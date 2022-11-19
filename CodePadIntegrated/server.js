const express = require("express");
const http = require("http");
const app = express();
const fast2sms = require("fast-two-sms");
const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);
const compiler = require("compilex");
let options = { stats: true }; //prints stats on console
compiler.init(options);

const path = require("path");
const { render } = require("ejs");
let publiPath = path.join(__dirname, "public");

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static(publiPath));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let rooms = {};
let validDetails = {};

let connections = new Set();
let imageData;
let port = process.env.PORT || 8800;

app.get("/", (req, res) => {
    res.render("index", { rooms: rooms });
});

// app.get("/:room", (req, res) => {
//     console.log("Join Room: " + req.params.room);
//     if (rooms[req.params.room] == null) {
//         return res.redirect("/");
//     }
//     res.render("room", { room_id: req.params.room });
// });

let roomID, SNAME, SNUMBER;
let check = 0;
let otp = Math.floor(1000 + Math.random() * 9000);
app.post("/join_&:room", (req, res) => {
    console.log(validDetails);
    let studentName = req.body.student_name;
    let studentNumber = req.body.student_number;

    let count = 0;
    console.log(studentName, studentNumber);
    console.log("Joining", req.params.room);
    for (let i = 0; i < validDetails[req.params.room].students.length; i++) {
        let student = validDetails[req.params.room].students[i];
        if (student.sName == studentName && student.sContact == studentNumber) {
            count++;
        }
    }
    if (count == 0) {
        alert("Access denied!");
        res.redirect("/");
    }
    console.log(studentName);
    console.log(studentNumber);

    // if(studentNumber == validDetails[room].students)

    roomID = req.params.room;
    SNAME = studentName;
    SNUMBER = studentNumber;
    // var options = {
    //     authorization:
    //         "xiS594Xk4rmi3kwc9Ic2lmESQRtaURXEKUJEldmYQ9bUgxY4ZHJRdQf788Yz",
    //     message: otp,
    //     numbers: [studentNumber],
    // };

    console.log(otp);
    fast2sms
        .sendMessage({
            authorization:
                "xiS594Xk4rmi3kwc9Ic2lmESQRtaURXEKUJEldmYQ9bUgxY4ZHJRdQf788Yz",
            message: otp,
            numbers: [studentNumber],
        })
        .then((res) => {
            console.log("messeage sent successfully");
        })
        .catch((err) => {
            console.log(err.message);
        });
    setTimeout(() => {
        if (check != 1) {
            check = 0;
            res.redirect("/");
        }
    }, 600000);
    res.render("otp");
    //render otp auth page

    // res.render("room", {
    //     room_id: req.params.room,
    //     sName: studentName,
    //     sNumber: studentNumber,
    // });
});

app.post("/otp-validator", (req, res) => {
    let otpval = req.body.otpvalue;
    if (otp == otpval) {
        check = 1;
        res.render("room", {
            room_id: roomID,
            sName: SNAME,
            sNumber: SNUMBER,
        });
    }
});

app.post("/join_util&:room", (req, res) => {
    console.log(req.params.room);
    res.render("join", { room: req.params.room });
});

app.post("/create-room", (req, res) => {
    console.log(req.body);
    let teacherName = req.body.teacher_name;
    let teacherContact = req.body.teacher_contact;
    let roomName = req.body.room_name;
    //let count = req.body.studentCount;
    console.log("Create", teacherName, teacherContact, roomName);
    console.log(" Create Room: " + roomName);
    if (rooms[roomName] != null) {
        return res.redirect("/");
    }
    validDetails[roomName] = {
        teacher: { tName: teacherName, tContact: teacherContact },
        students: [],
    };
    rooms[roomName] = {
        teacher: { tName: teacherName, tContact: teacherContact },
        students: [],
    };
    console.log(validDetails);
    console.log(validDetails[roomName]);
    validDetails[roomName] = {
        teacher: { tName: teacherName, tContact: teacherContact },
        students: [],
    };
    console.log(req.body.names.length);
    console.log(typeof req.body.names);
    if (typeof req.body.names == "string") {
        console.log("String");
        console.log(req.body.names, req.body.contact);
        validDetails[roomName].students.push({
            sName: req.body.names,
            sContact: req.body.contact,
        });
    } else if (typeof req.body.names == "object") {
        console.log("Object");
        for (let i = 0; i < req.body.names.length; i++) {
            console.log(req.body.names[i], req.body.contact[i]);
            validDetails[roomName].students.push({
                sName: req.body.names[i],
                sContact: req.body.contact[i],
            });
        }
    }
    console.log(validDetails[roomName].students);
    //res.redirect(req.body.room_name);
    res.render("room", {
        room_id: roomName,
        sName: teacherName,
        sNumber: teacherContact,
    });
});
app.post("/create-util", (req, res) => {
    res.render("create");
});

server.listen(port, (error) => {
    if (error) {
        console.error(error);
    } else {
        console.log(`Server listening at port ${port}`);
    }
});
io.on("connection", (socket) => {
    console.log(`${socket.id} has connnected`);
    socket.on("request-data", (room_no, details) => {
        socket.join(room_no);
        console.log(`${socket.id} New connection`);
        console.log(room_no);
        console.log("Before:", connections.size);
        if (rooms[room_no] == undefined)
            rooms[room_no] = { teacher: {}, students: [] };
        console.log(rooms);
        if (rooms[room_no].teacher != undefined) {
            console.log("Inside rooms --> " + rooms);
            let t = rooms[room_no].teacher;

            let obj = new Object();
            obj.sock = socket.id;
            obj.data = details;
            if (t.tContact != details.sNumber) {
                rooms[room_no].students.push(obj);
                console.log(
                    rooms[room_no].students[rooms[room_no].students.length - 1]
                );
                console.log("Requesting drawing and code");
                let src = rooms[room_no].teacher.sock;
                console.log(src);
                io.to(src).emit("get-data", socket.id);
                io.to(src).emit("get-code", socket.id);
            } else {
                let obj1 = new Object();
                obj1.sock = socket.id;
                obj1.data = t;
                rooms[room_no].teacher = obj1;
            }
        }
        connections.add(socket.id);
        console.log("After:", connections.size);
    });

    socket.on("receive-data", (data, dest, color, brushsize, erasing) => {
        console.log("Receive", dest);
        imageData = data;
        io.to(dest).emit(
            "new-connection",
            imageData,
            color,
            brushsize,
            erasing
        );
    });
    socket.on("draw", (data, room_no) => {
        console.log("Draw ---" + room_no);
        socket
            .to(room_no)
            .emit("onDraw", data.X, data.Y, data.colorVal, data.sizeVal);
    });
    socket.on("drawMode", (room_no) => {
        io.in(room_no).emit("onDrawMode");
    });
    socket.on("eraseMode", (room_no) => {
        io.in(room_no).emit("onEraseMode");
    });
    socket.on("clearScreen", (room_no) => {
        io.in(room_no).emit("onClearScreen");
    });
    socket.on("down", (data, room_no) => {
        io.in(room_no).emit("onDown", data.X, data.Y);
    });
    socket.on("up", (room_no) => {
        let typer;
        if (socket.id == rooms[room_no].teacher.sock) {
            typer = rooms[room_no].teacher.data.sName;
        } else {
            rooms[room_no].students.forEach((student) => {
                if (socket.id == student.sock) {
                    typer = student.data.sName;
                }
            });
        }
        console.log("Up Typer", typer);
        io.in(room_no).emit("onUp");
    });
    socket.on("linecolorchange", (data, room_no) => {
        socket.to(room_no).emit("onlinecolorchange", data);
    });
    socket.on("brushSizechange", (data, room_no) => {
        socket.to(room_no).emit("onbrushsizechange", data);
    });
    socket.on("disconnect", (reason) => {
        // Object.keys(rooms).forEach(room => {
        //     Obj
        // })
    });
    socket.on(
        "receive-code",
        (data, pos, htmlValue, language, dest, ip, result) => {
            // if (isEditor(socket)) {
            console.log("Updating", dest);
            io.to(dest).emit("onRender", data, pos);
            io.to(dest).emit("onlang", htmlValue, language);
            // }
        }
    );
    socket.on("render", (data, pos, room_no) => {
        //console.log(data);
        // if (isEditor(socket)) {
        console.log(`Render ${data}`);
        let typer;
        if(socket.id == rooms[room_no].teacher.sock) {
            typer = rooms[room_no].teacher.data.tName;
        } else {
            rooms[room_no].students.forEach(student => {
                if(socket.id == student.sock) {
                    typer = student.data.sName;
                }
            })
        }
        socket.to(room_no).emit('onTyper', typer, data);
        console.log("Render Src", typer);
        socket.to(room_no).emit("onRender", data, pos, typer);
        // }
    });

    socket.on("lang", (htmlValue, language, room_no) => {
        // if (isEditor(socket)) {
        //console.log(data);
        socket.to(room_no).emit("onlang", htmlValue, language);
        // }
    });

    socket.on("op", (data, room_no) => {
        // if (isEditor(socket)) {
        //console.log(data);
        socket.to(room_no).emit("onop", { char: data });
        // }
    });

    socket.on("ip", (data, room_no) => {
        // if (isEditor(socket)) {
        //console.log(data);
        socket.to(room_no).emit("onip", { char: data });
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
    console.log(req.body);
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
