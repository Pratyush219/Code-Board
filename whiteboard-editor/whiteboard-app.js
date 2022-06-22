const server = require('./server').server;
// console.log(server);
const socketIO = require("socket.io");

let io = socketIO(server);
let connectionsBoard = [];
let imageData;
io.on("connection", (socket) => {
    console.log(`${socket.id} has connnected`);
    console.log(connectionsBoard.length);
    if (connectionsBoard.length > 0) {
        socket.on("request-data", () => {
            console.log(`${socket.id} New connection`);
            io.to(connectionsBoard[0]).emit("get-data", socket.id);
        });
    }
    connectionsBoard.push(socket.id);
    socket.on("receive-data", (data, dest, color, brushsize) => {
        console.log("Receive");
        imageData = data;
        io.to(dest).emit("new-connection", imageData,color,brushsize);
    });
    socket.on("draw", (data) => {
        // console.log(data.X, data.Y);
        socket.broadcast.emit("onDraw", data.X, data.Y, data.colorVal, data.sizeVal);
    });
    socket.on("clearScreen", () => {
        socket.broadcast.emit("onClearScreen");
    });
    socket.on("down", (data) => {
        socket.broadcast.emit("onDown", data.X, data.Y);
    });
    socket.on("lineEnd", () => {
        io.emit("onLineEnd");
    });
    socket.on("propertyChange", () => {
        io.emit("onPropertyChange");
    });
    socket.on("linecolorchange",(data)=>{
        socket.broadcast.emit("onlinecolorchange",data);
    });
    socket.on("brushSizechange",(data)=>{
        socket.broadcast.emit("onbrushsizechange",data);
    })
    socket.on("disconnect", (reason) => {
        connectionsBoard = connectionsBoard.filter((con) => con !== socket.id);
        console.log(`${socket.id} has disconnnected`);
    });
});


