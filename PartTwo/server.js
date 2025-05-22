const WS = require('ws');

const server = new WS.Server({port:8081});

server.on("connection", (ws) => {
console.log("Client is connected");

setInterval(()=>{
    ws.send("Hellow World")
}, 1000)

ws.on("close", () => {
    console.log("Client disconnected");
})

})
