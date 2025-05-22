const crypto = require("crypto");
const EC = require('elliptic').ec, ec = new EC('secp256k1')

SHA256 = (message) => crypto.createHash("sha256").update(message).digest("hex");

const MINT_WALLET = ec.genKeyPair();
const MINT_PUBLIC_ADDRESS = MINT_WALLET.getPublic('hex');
const MINT_PRIVATE_ADDRESS = MINT_WALLET.getPrivate('hex');
class Block {
  constructor(data = []) {
    this.timestamp = Date.now(),
      this.data = data,
      this.hash = this.getHash(),
      this.prevHash = "",
      this.nonce = 0;
  }

  getHash() {
    return SHA256(
      this.timestamp + JSON.stringify(this.data) + this.prevHash + this.nonce
    );
  }

  mine(difficulty) {
    while (!this.hash.startsWith(Array(difficulty + 1).join("0"))) {
      this.nonce++;

      this.hash = this.getHash();
    }
  }

  hasValidTransactions(chain) {
    return this.data.every(transaction => transaction.isValid(transaction, chain));
  }
}

// const block1 = new Block(["Transaction 1"]);
// block1.mine(5);
// console.log(block1);

class Blockchain {
  constructor() {
    const initialCoinRelease = new Transaction(MINT_PUBLIC_ADDRESS, JOHN_WALLET.getPublic('hex'), 1000)
    this.chain = [new Block([initialCoinRelease])];
    this.difficulty = 2,
    this.blockTime = 2000;
    this.transactions = [];
    this.reward = 10;
  }

  addTransactions(transaction) {
    if(transaction.isValid(transaction, this))
    this.transactions.push(transaction);
  }

  mineTransactions(rewardAddress) {
    let gas = 0;

    this.transactions.forEach((transaction) => {
      gas += transaction.gas;
    })

    const rewardTransaction = new Transaction(MINT_PUBLIC_ADDRESS, rewardAddress, this.reward + gas);

    if(this.transactions.length !== 0){
    this.addBlock(new Block([rewardTransaction, ...this.transactions]));
    }
    this.transactions = [];
  }

  getBalance(address) {
    let balance = 0;

    this.chain.forEach(block => {
      block.data.forEach((transaction)=>{
        if(transaction.from === address){
          balance -= transaction.amount
          balance -= transaction.gas
        }
        if(transaction.to === address){
          balance += transaction.amount
        }
      })

    })

    return balance;
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(block) {
    block.prevHash = this.getLastBlock().hash;
    block.mine(this.difficulty);

    this.chain.push(block);
    this.difficulty +=
      Date.now() - this.getLastBlock().timestamp < this.blockTime ? 1 : -1;
  }

  isValid() {
    for (let i = 1; i < this.chain.length - 1; i++) {
      let currentBlock = this.chain[i];
      let prevBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.getHash() ||
          currentBlock.prevHash !== prevBlock.hash || 
          !currentBlock.hasValidTransactions(this)) {
        return false;
      }
    }
    return true;
  }
}

// const satoshiCoin = new Blockchain();
// satoshiCoin.addBlock(new Block(["Transaction1"]));
// satoshiCoin.addBlock(new Block(["Transaction2"]));
// satoshiCoin.addBlock(new Block(["Transaction3"]));
// satoshiCoin.chain[2].data = "hacked";
// console.log(satoshiCoin.chain);
// console.log("blockchain is valid",satoshiCoin.isValid());

class Transaction {
    constructor(from, to, amount, gas = 0) {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.gas = gas;
    }

    sign(keyPair) {     // keyPair -> wallet address
      if(keyPair.getPublic('hex') == this.from) {
        this.signature = keyPair.sign(SHA256(this.from + this.to + this.amount + this.gas)).toDER('hex') //sign is a elliptic function of eliptic library. it will take input a hash by combining these three property. It will sign this hash with the private key(of this keyPair wallet) and return a hash in hex format. this hash store in this.signature is a proof that transaction is sign by orignal innitiater of the transaction.
      }
    }

    isValid(tx, chain) {
      return(
        tx.from && tx.to && tx.amount &&
        chain.getBalance(tx.from) >= tx.amount + this.gas &&
        ec.keyFromPublic(tx.from, 'hex').verify(SHA256(tx.from + tx.to + tx.amount + this.gas), this.signature)
      )
    }
}

const JOHN_WALLET = ec.genKeyPair();
const JENIFER_WALLET = ec.genKeyPair();
const MINER_WALLET  = ec.genKeyPair();
const BOB_WALLET = ec.genKeyPair();

const satoshiCoin = new Blockchain();

const transaction1 = new Transaction(JOHN_WALLET.getPublic('hex'), JENIFER_WALLET.getPublic('hex'), 200, 20);
transaction1.sign(JOHN_WALLET);
satoshiCoin.addTransactions(transaction1);
satoshiCoin.mineTransactions(MINER_WALLET.getPublic('hex'));

const transaction2 = new Transaction(JENIFER_WALLET.getPublic('hex'), BOB_WALLET.getPublic('hex'), 100, 10);
transaction2.sign(JENIFER_WALLET);
satoshiCoin.addTransactions(transaction2);
satoshiCoin.mineTransactions(MINER_WALLET.getPublic('hex'));

console.log(satoshiCoin.chain);

console.log("John's balance", satoshiCoin.getBalance(JOHN_WALLET.getPublic('hex')));
console.log("Jenfer's balance", satoshiCoin.getBalance(JENIFER_WALLET.getPublic('hex')));
console.log("Bob's balance", satoshiCoin.getBalance(BOB_WALLET.getPublic('hex')));
console.log("Miner's balance", satoshiCoin.getBalance(MINER_WALLET.getPublic('hex')));





// console.log("Public address",MINT_PUBLIC_ADDRESS)
// console.log("peivate address",MINT_PRIVATE_ADDRESS)


