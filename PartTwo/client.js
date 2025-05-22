const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8081');

ws.on("open", () => {
    console.log("Connnected to the server");
})

ws.on("message", (data) => {  // handles the messages received from the server
    console.log(`${data}`);
})