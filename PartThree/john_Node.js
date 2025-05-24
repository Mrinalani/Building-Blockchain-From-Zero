// In peer to peer network each node will act as a server but it is not totaly right because it works both as a server and  client
// each node has a ip address and a port to which other node is connected

const WS = require('ws');

const PORT = 3001;
const MY_ADDRESS = "ws://localhost:3001";

const server = new WS.Server({port:PORT});

let opened = [] // store socket and addresses
let connected = [] // only addresses

console.log("john listing on port: ", PORT)

    // triger when node connected to the miner node

    //event listener that runs every time a new peer connects to the miner node.
    server.on("connection", (socket) => { // this socket is the socket of the node that wishes to connect to the miner node
        socket.on("message", (message) => { // handle the incomming msg from the node
            const _message = JSON.parse(message); // might include block, transaction etc.
            console.log(_message)
            // _message(type..., data...)

            switch (_message.type) {
                case "TYPE_HANDSHAKE":  // If a node sends a "TYPE_HANDSHAKE" message, we expect it to contain a list of peers it's connected to. // node is sendeing the addresses of the node it is alredy connected with
                    const nodes = _message.data;
                    nodes.forEach((node) => connect(node)) // miner node has to connect with each node
                    break;
            
                default:
                    break;
            }

        })
    })


    function connect(address) {
      if (!connected.find((peerAddress) => peerAddress == address) && address !== MY_ADDRESS) {
        const socket = new WS(address);

        socket.on("open", () => {
  socket.send(JSON.stringify(ProduceMessage("TYPE_HANDSHAKE", [MY_ADDRESS, ...connected])));

  opened.forEach((node) => {
    node.socket.send(JSON.stringify(ProduceMessage("TYPE_HANDSHAKE", [address])));
  });

  if (!opened.find((node) => node.address == address) && address !== MY_ADDRESS) {
    opened.push({ socket, address });
    connected.push(address);
  }
});


        socket.on("close", () => {
            opened.splice(connected.indexOf(address), 1)
            connected.splice(connected.indexOf(address), 1)
        })
      }
    }

    function ProduceMessage(type, data) {
            return {type, data};
}

function sendMessage(message) {
    opened.forEach((node) => {
        node.socket.send(JSON.stringify(message))
    })

}

setTimeout(() => {
    sendMessage(ProduceMessage("Message", "Hello from the john"));
},10000);

process.on("uncaughtException", err => console.log(err));