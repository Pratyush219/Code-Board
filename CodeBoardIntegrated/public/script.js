let ip = "10.0.5.53";
var client = io(`http://${ip}:8800`);
console.log("Started");
var optionView = document.getElementById("view-selection");
var ideSelector = document.getElementById("ide-selector");
var canvasSelector = document.getElementById("canvas-selector");
var canvasContainer = document.getElementById("canvas-container");
var ideContainer = document.getElementById("ide-container");
var toolsContainer = document.getElementById("tools-section");
var colorPicker = document.getElementById("line-color");
var brushSizeOptionMenu = document.getElementById("brush-size");
var clearButton = document.getElementById("clear-canvas");
var drawBtn = document.getElementById("draw");
var eraseBtn = document.getElementById("erase");
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let erasing = false;
canvas.style.cursor = "crosshair";

let canvasEnabled = false;
var brushSize = brushSizeOptionMenu.value;
var lineColor = colorPicker.value;
var offset = canvas.getBoundingClientRect();
let diff = offset.top;
canvas.width = Math.max(0.98 * window.innerWidth, canvas.width);
canvas.height = Math.max(window.innerHeight, canvas.height);

let XOFFSET = 0,
    YOFFSET = 0;
let x;
let y;
let mouseDown = false;
canvasContainer.style.display = "none";

const head = document.getElementsByTagName("head")[0];
const room_no = head.getAttribute("data-room");
const student_name = head.getAttribute("data-name");
const student_number = head.getAttribute("data-number");

console.log(`Room_NO: ` + room_no);
console.log("Student Name: " + student_name);
console.log("Student Number: " + student_number);

// Window properties
window.onresize = function () {
    let data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = Math.max(window.innerWidth, canvas.width);
    canvas.height = Math.max(window.innerHeight, canvas.height);
    ctx.putImageData(data, 0, 0);
};
window.onscroll = function () {
    // console.log(window.scrollX);
    // console.log(window.scrollY);
    XOFFSET = window.scrollX;
    YOFFSET = window.scrollY;
};
window.onmousedown = function (e) {
    console.log("Mouse down", erasing);
    if (erasing) {
        ctx.globalCompositeOperation = "destination-out";
    } else {
        ctx.globalCompositeOperation = "source-over";
    }
    if (canvasEnabled) {
        console.log(typeof e);
        client.emit(
            "down",
            {
                X: e.clientX + XOFFSET,
                Y: e.clientY + YOFFSET - diff,
            },
            room_no
        );
        ctx.beginPath();
        ctx.moveTo(e.clientX + XOFFSET, e.clientY + YOFFSET - diff);
        mouseDown = true;
    }
};
ideSelector.onclick = () => {
    ideSelector.style.border = "thin solid black";
    canvasSelector.style.border = "none";
    canvasEnabled = false;
    ideContainer.style.display = "block";
    canvasContainer.style.display = "none";
};
canvasSelector.onclick = () => {
    canvasSelector.style.border = "thin solid black";
    ideSelector.style.border = "none";
    canvasEnabled = true;
    ideContainer.style.display = "none";
    canvasContainer.style.display = "block";
};
client.on("onDown", (x, y) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
});
window.onmouseup = function (e) {
    mouseDown = false;
    ctx.closePath();
};
window.onmousemove = function (e) {
    x = XOFFSET + e.clientX;
    y = YOFFSET + e.clientY - diff;
    if (mouseDown) {
        client.emit(
            "draw",
            {
                X: x,
                Y: y,
                colorVal: colorPicker.value,
                sizeVal: brushSize,
            },
            room_no
        );
        drawPixel(x, y, lineColor, brushSize);
    }
};
client.on("onDraw", (x, y, colorData, brushWidth) => {
    drawPixel(x, y, colorData, brushWidth);
    console.log(x, y, colorData, brushWidth);
});
// New Connection
client.on("connect", () => {
    console.log(`${client.id} connected`);
    client.emit("request-data", room_no, {
        sName: student_name,
        sNumber: student_number,
    });
});
client.on("get-data", (newSocketID) => {
    console.log("Get data");
    // let data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log(`Data requested from ${client.id}`);
    let dataUrl = canvas.toDataURL();
    client.emit(
        "receive-data",
        dataUrl,
        newSocketID,
        colorPicker.value,
        brushSizeOptionMenu.value,
        erasing,
        room_no
    );
});
client.on("new-connection", (imageData, color, brushsize, erasingNow) => {
    var img = new Image();
    if (imageData != null) {
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
    } else console.log("No data");

    colorPicker.value = color;
    console.log("Erasing ", erasingNow, erasing);
    console.log(ctx.globalCompositeOperation);
    lineColor = color;
    brushSizeOptionMenu.value = brushsize;
    brushSize = brushsize;
    erasing = erasingNow;
    if (erasing) {
        eraseBtn.style.border = "medium solid black";
        drawBtn.style.border = "thin solid black";
        erasing = true;
    } else {
        drawBtn.style.border = "medium solid black";
        eraseBtn.style.border = "thin solid black";
        erasing = false;
    }
});
clearButton.onclick = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    client.emit("clearScreen", room_no);
};
client.on("onClearScreen", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
client.on("onlinecolorchange", (data) => {
    client.emit("drawMode", room_no);
    colorPicker.value = data;
    lineColor = data;
    drawBtn.style.border = "medium solid black";
    eraseBtn.style.border = "thin solid black";
    erasing = false;
    ctx.globalCompositeOperation = "source-over";
});
client.on("onbrushsizechange", (data) => {
    brushSizeOptionMenu.value = data;
    brushSize = data;
});
drawBtn.onclick = () => {
    drawBtn.style.border = "medium solid black";
    eraseBtn.style.border = "thin solid black";
    erasing = false;
    client.emit("drawMode", room_no);
};
eraseBtn.onclick = () => {
    eraseBtn.style.border = "medium solid black";
    drawBtn.style.border = "thin solid black";
    erasing = true;
    client.emit("eraseMode", room_no);
};
client.on("onDrawMode", () => {
    drawBtn.style.border = "medium solid black";
    eraseBtn.style.border = "thin solid black";
    erasing = false;
    ctx.globalCompositeOperation = "source-over";
});
client.on("onEraseMode", () => {
    eraseBtn.style.border = "medium solid black";
    drawBtn.style.border = "thin solid black";
    erasing = true;
    ctx.globalCompositeOperation = "destination-out";
});
colorPicker.onchange = function (event) {
    lineColor = event.target.value;
    console.log("Line Property Change");
    client.emit("linecolorchange", lineColor, room_no);
};
brushSizeOptionMenu.onchange = function (event) {
    brushSize = event.target.value;
    console.log("Brush Property Change");
    client.emit("brushSizechange", brushSize, room_no);
};
function drawPixel(x, y, colorData, brushThickness) {
    console.log(lineColor);
    ctx.lineWidth = brushThickness;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = colorData;

    ctx.lineTo(x, y);
    ctx.stroke();
}
