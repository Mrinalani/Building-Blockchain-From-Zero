// In peer to peer network each node will act as a server but it is not totaly right because it works both as a server and  client
// each node has a ip address and a port to which other node is connected

const WS = require('ws');
const readLine = require('readline');

import {Block, satoshiCoin, Transaction} from "../PartOne/blockchain.js";
import keys from "../PartOne/keys.js";
import key from "../PartOne/keys.js"

const PORT = 3002;
const MY_ADDRESS = "ws://localhost:3002";

const server = new WS.Server({port:PORT});

let opened = [] // store socket and addresses
let connected = [] // only addresses

console.log("Jenifer listing on port: ", PORT)

    // triger when node connected to the miner node

    //event listener that runs every time a new peer connects to the miner node.
    server.on("connection", (socket) => { // this socket is the socket of the node that wishes to connect to the miner node
        socket.on("message", (message) => { // handle the incomming msg from the node
            const _message = JSON.parse(message); // might include block, transaction etc.
            console.log(_message)
            // _message(type..., data...)

            switch (_message.type) {
              case "TYPE_REPLACE_CHAIN":
                const [ newBlock, newDiff ]  = _message.data;

                if(newBlock.prevHash !== satoshiCoin.getLastBlock().prevHash &&
                   satoshiCoin.getLastBlock().hash === newBlock.prevHash() && 
                   Block.hasValidTransactions(newBlock, satoshiCoin))
                   {
                    satoshiCoin.chain.push(newBlock);
                    satoshiCoin.difficulty = newDiff;
                   }
              break;

              case "TYPE_CREATE_TRANSACTION":
                const transaction = _message.data;
                if(!isTransactionDuplicate(transaction)){
                  satoshiCoin.addTransactions(transaction);
                }

                case "TYPE_HANDSHAKE":  // If a node sends a "TYPE_HANDSHAKE" message, we expect it to contain a list of peers it's connected to. // node is sendeing the addresses of the node it is alredy connected with
                    const nodes = _message.data;
                    nodes.forEach((node) => connect(node)) // miner node has to connect with each node
                    break;
            
                default:
                    break;
            }

        })
    })

     function broadcastTransaction() {
          satoshiCoin.transactions.forEach((transaction, index) => {
            if(isTransactionIncluded(transaction)){
              satoshiCoin.transactions.splice(index, 1);
            }else{
              sendMessage(ProduceMessage("TYPE_CREATE_TRANSACTION", transaction));
            }
          })
          setTimeout(broadcastTransaction,1000);
        }
        broadcastTransaction();

    function isTransactionDuplicate(transaction) {
      return satoshiCoin.transactions.some(tx => JSON.stringify(tx) == JSON.stringify(transaction));
    }

    function isTransactionIncluded(transaction) {
      satoshiCoin.chain.some((block) => block.data.some(tx => JSON.stringify(tx) === JSON.stringify(transaction)))
    }

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

const rl = readLine.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Enter a command:/n"
})

rl.on("line", (command) => {
  switch (command.toLowerCase()) {
    case "send":
     const transaction = new Transaction(keys.JENIFER_KEY.getPublic('hex'), keys.JOHN_KEY.getPublic('hex'), 500, 50);
     transaction.sign(keys.JENIFER_KEY);
     sendMessage(ProduceMessage("TYPE_CREATE_TRANSACTION", transaction));
      break;

    case "balance":
      console.log("Jenifer Balance", satoshiCoin.getBalance(key.JENIFER_KEY.getPublic('hex')))
      break;

    case "blockchain":
      console.log(satoshiCoin)
      break; 
      
    case "clear":
      console.clear()
      break; 
  }
  rl.prompt();
}).on('close', () => {
  console.log("existing!")
  process.exit(0)
})



process.on("uncaughtException", err => console.log(err));