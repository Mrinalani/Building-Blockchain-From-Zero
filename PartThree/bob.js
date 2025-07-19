const WS = require("ws"); // Import web socket

const readline = require('readline')

const { satoshiCoin, Block, Transaction } = require("../PartOne/blockchain");
const keys = require("../PartOne/keys");

const PORT = 3003; // port
const MY_ADDRESS = "ws://localhost:3003"; // server address
const PEERS = ["ws://localhost:3002"]

const server = new WS.Server({ port: PORT }); // Create web socket server

const opened = []; // store socket and address
const connected = []; // store address


console.log("BOB is listening on port", PORT); // log


server.on("connection", (socket) => { // socket object is the socket of node which wishes to connect bob node
   console.log("[BOB] New connection established"); // log


   socket.on("message", (message) => { // event which handle incoming messages from node

       const _message = JSON.parse(message.toString()); // convert string messae into object
       console.log("[BOB] Received:", _message); // log


       switch (_message.type) { // message structure => {type:..., data:...}

        case "TYPE_BALANCE":
            const amount = _message.data;
            console.log("Bob balance", amount)  
            break;

        case "TYPE_VERIFY":
            const isValid = _message.data;
            console.log("Is blockchain valid", isValid)
            break;
       }


       console.log("[BOB] Connected:", connected); // log
   });
});


const connect = (address) => {
   if (!connected.includes(address) && address !== MY_ADDRESS) { // dont connect to node if its already in connected and if its own address
       const socket = new WS(address); // socket of respective node


       socket.on("open", () => { // fired when connection with node is established
           console.log(`[BOB] Connected to ${address}`); // log


           // send known connections
           socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [MY_ADDRESS, ...connected]))); // produceMessage is utility function


           opened.forEach(peer => { // send the nodes BOB is already connected to other node
               peer.socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [address]))); // produceMessage is utility function
           });


           opened.push({ socket, address }); // add node to opened
           connected.push(address); // add node to connected


           console.log("[MINER] Total Connected:", connected); // log
       });


       socket.on("close", () => { // Fired when connection with node is closed
           console.log(`[BOB] Connection closed with ${address}`); // log
           opened.splice(opened.findIndex(p => p.address === address), 1); // remove node from opened
           connected.splice(connected.findIndex(p => p === address), 1); // remove node from connected
       });
   }
};


const produceMessage = (type, data) => ({ type, data }); // produceMessage is utility function

const sendMessage = (data) => { // sendMessage is utility function
   const message = JSON.stringify(produceMessage(data.type, data.data)); // produceMessage is utility function
   opened.forEach(peer => peer.socket.send(message)); // send message to all connected nodes
};

PEERS.forEach((peer) => connect(peer));


let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Enter a command:/n"
})

rl.on("line", (command) => {
    switch (command.toLowerCase()) {
        case 'send':
            const transaction = new Transaction(keys.BOB_KEY.getPublic('hex'), keys.JOHN_KEY.getPublic('hex'), 50, 10);
            console.log("sign", keys.BOB_KEY);
            transaction.sign(keys.BOB_KEY);
            console.log("produce message", produceMessage("CREATE_TRANSACTION", transaction))
            sendMessage(produceMessage("CREATE_TRANSACTION", transaction));
            break;

            case 'balance':
            sendMessage(produceMessage("TYPE_BALANCE", ["ws://localhost:3003"], keys.BOB_KEY.getPublic('hex')));
            break;

            case 'verify':
                sendMessage(produceMessage('TYPE_VERIFY', ["ws://localhost:3003"]))
                break;

            case 'clear':
            console.clear()
            break;
    
        default:
            break;
    }
    rl.prompt()
}).on("close", ()=>{
    console.log("existing");
    process.exit(0);
})

process.on("uncaughtException", err => console.log("[BOB ERROR]", err)); // log error if anything goes wrong



