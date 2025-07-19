const WS = require("ws"); // Import web socket

const readline = require('readline')

const { satoshiCoin, Block, Transaction } = require("../PartOne/blockchain");
const keys = require("../PartOne/keys");


const PORT = 3002; // port
const MY_ADDRESS = "ws://localhost:3002"; // server address

const server = new WS.Server({ port: PORT }); // Create web socket server

const opened = []; // store socket and address
const connected = []; // store address


console.log("Jenifer is listening on port", PORT); // log


server.on("connection", (socket) => { // socket object is the socket of node which wishes to connect jenifer node
   console.log("[JENIFER] New connection established"); // log


   socket.on("message", (message) => { // event which handle incoming messages from node
       const _message = JSON.parse(message); // convert string messae into object
       console.log("[JENIFER] Received:", _message); // log


       switch (_message.type) { // message structure => {type:..., data:...}
           case "TYPE_HANDSHAKE": // means node sending addresses it is already connected to
               const nodes = _message.data; // extract all nodes from message.data
               console.log("[JENIFER] Received handshake with nodes:", nodes); // log


               nodes.forEach(node => connect(node)); // connect to all nodes
               break;

            case "REPLACE_CHAIN": // Replace old chain with updated new chain after jenifer mines new block
                const[ newBlock, newDiff ] = _message.data;
                console.log("replace chain", newBlock, newDiff)

                if(newBlock.prevhash != satoshiCoin.getLastBlock().prevhash &&
                   satoshiCoin.getLastBlock().hash == newBlock.prevhash &&
                   Block.hasValidTransaction(newBlock, satoshiCoin)
                 ) {
                    console.log("abc")
                    satoshiCoin.chain.push(newBlock);
                    satoshiCoin.difficulty = newDiff;
                 } 
                 break;

                case "CREATE_TRANSACTION":
                    const transaction = _message.data;
                    if(!isTransactionDuplicate(transaction)){
                      satoshiCoin.addTransaction(transaction); 
                    }
                    break;

                case "TYPE_BALANCE":
                    const [address, publicKey] = _message.data;
                    
                    opened.forEach((node) => {
                        if(node.address == address){
                           const balance = satoshiCoin.getBalance(publicKey);
                           console.log("@@@@@@@@@@@", balance)
                           console.log("****$$$$$$$$$",sendMessage(produceMessage("TYPE_BALANCE", balance)))
                           node.socket.send(sendMessage({type: "TYPE_BALANCE", data: balance}))
                        }        
                    });

                case "TYPE_VERIFY":
                    const peerAddress = _message.data;
                    
                    opened.forEach((node) => {
                         if(node.address == peerAddress){
                            const isValid = satoshiCoin.isValid()
                           node.socket.send(sendMessage(produceMessage("TYPE_VERIFY", isValid)))
                        }    
                    })

           case "MESSAGE": // means node sending addresses it is already connected to
               console.log("[JENIFER] Message:", _message.data); // log
               break;
       }


       console.log("[JENIFER] Connected:", connected); // log
   });
});


const connect = (address) => {
   if (!connected.includes(address) && address !== MY_ADDRESS) { // dont connect to node if its already in connected and if its own address
       const socket = new WS(address); // socket of respective node


       socket.on("open", () => { // fired when connection with node is established
           console.log(`[JENIFER] Connected to ${address}`); // log


           // send known connections
           socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [MY_ADDRESS, ...connected]))); // produceMessage is utility function


           opened.forEach(peer => { // send the nodes JENIFER is already connected to other node
               peer.socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [address]))); // produceMessage is utility function
           });


           opened.push({ socket, address }); // add node to opened
           connected.push(address); // add node to connected


           console.log("[MINER] Total Connected:", connected); // log
       });


       socket.on("close", () => { // Fired when connection with node is closed
           console.log(`[JENIFER] Connection closed with ${address}`); // log
           opened.splice(opened.findIndex(p => p.address === address), 1); // remove node from opened
           connected.splice(connected.findIndex(p => p === address), 1); // remove node from connected
       });
   }
};

 function isTransactionDuplicate(transaction) {
    // return satoshiCoin.transaction.some((tx) => JSON.stringify(tx) == JSON.stringify(transaction));
     return satoshiCoin.transaction.some((tx) =>
    tx.from === transaction.from &&
    tx.to === transaction.to &&
    tx.amount === transaction.amount &&
    tx.gas === transaction.gas
  );
}

function broadCastTransaction() {
   satoshiCoin.transaction.forEach((transaction, index) => {
    if(transactionIncluded(transaction)){
     satoshiCoin.transaction.splice(index, 1)
    }else{
        sendMessage(produceMessage("CREATE_TRANSACTION", transaction))
    }
   })

   setTimeout(()=> {
    broadCastTransaction()
}, 10000)
}

broadCastTransaction();

function transactionIncluded(transaction) {
//   return satoshiCoin.chain.some((block) => {
//     return block.data.some((tx) => {
//       return JSON.stringify(tx) === JSON.stringify(transaction);
//     });
//   });
 return satoshiCoin.chain.some((block) =>
    block.data.some((tx) =>
      tx.from === transaction.from &&
      tx.to === transaction.to &&
      tx.amount === transaction.amount &&
      tx.gas === transaction.gas
    )
  );
}


const produceMessage = (type, data) => ({ type, data }); // produceMessage is utility function

const sendMessage = (data) => { // sendMessage is utility function
   const message = JSON.stringify(produceMessage(data.type, data.data)); // produceMessage is utility function
   opened.forEach(peer => peer.socket.send(message)); // send message to all connected nodes
};


let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Enter a command:/n"
})

rl.on("line", (command) => {
    switch (command.toLowerCase()) {
        case 'send':
            const transaction = new Transaction(keys.JENIFER_KEY.getPublic('hex'), keys.BOB_KEY.getPublic('hex'), 70, 10);
            transaction.sign(keys.JENIFER_KEY);
            sendMessage(produceMessage("CREATE_TRANSACTION", transaction));
            break;

            case 'blockchain':
            console.log(satoshiCoin)
            break;

            case 'balance':
            console.log("Jenifer's Balance", satoshiCoin.getBalance(keys.JENIFER_KEY.getPublic("hex")))
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

process.on("uncaughtException", err => console.log("[JENIFER ERROR]", err)); // log error if anything goes wrong



