const crypto = require ('crypto')
const EC = require('elliptic').ec, ec = new EC("secp256k1");

const keys = require('./keys')

const MINT_PRIVATE_ADDRESS = "0700a1ad28a20e5b2a517c00242d3e25a88d84bf54dce9e1733e6096e6d6495e";
// const MINT_WALLET = ec.genKeyPair(MINT_PRIVATE_ADDRESS, "hex");
const MINT_WALLET = ec.keyFromPrivate(MINT_PRIVATE_ADDRESS, "hex");

const MINT_PUBLIC_ADDRESS = MINT_WALLET.getPublic("hex")


// console.log("mint public address",MINT_PUBLIC_ADDRESS)
// console.log("mint private address",MINT_PRIVATE_ADDRESS)

function SHA256(message){
  console.log("message", message)
   return crypto.createHash('sha256').update(message).digest('hex')
}


class Block{
  constructor(timestamp, data = []) {
    console.log("timestamp", timestamp)
    this.timestamp = timestamp;
    this.data = data;
    this.prevhash = '';  // define before getHash()
    this.nonce = 0;      // should be number, not ''
    this.hash = Block.getHash(this); // now safe to call
  }


  static getHash(block){
     return SHA256(block.timestamp + JSON.stringify(block.data) + block.prevhash + block.nonce )
  }

  mine(difficulty){
    let string = '';
    for(let i=0; i< difficulty; i++){
      string = string+'0';
    }

    while(!this.hash.startsWith(string)){
      this.nonce++;
      this.hash = Block.getHash(this);
    }
    
  }

  static hasValidTransaction(block, chain){
   return block.data.every((transaction) => Transaction.isValid(chain, transaction));
  }
}


class Blockchain {
  constructor(){
    const innitialCoinRelease = new Transaction(MINT_PUBLIC_ADDRESS, keys.JOHN_KEY.getPublic("hex"), 2000); 
    innitialCoinRelease.sign(MINT_WALLET);

    this.chain = [new Block("", [innitialCoinRelease])];
    this.difficulty = 2;
    this.blockTime = 5000;
    this.transaction = [];
    this.reward = 10;
  }

  addTransaction(transaction){
    if(Transaction.isValid(this, transaction)){
      this.transaction.push(transaction);
    }
  }

  mineTransaction(rewardAddress){
    let gas = 0;

    this.transaction.forEach((transaction) => gas += transaction.gas);

    const rewardTransaction = new Transaction(MINT_PUBLIC_ADDRESS, rewardAddress, this.reward+gas);
    rewardTransaction.sign(MINT_WALLET);

    if(this.transaction.length !== 0){
    this.addBlock(new Block(Date.now().toString(), [rewardTransaction, ...this.transaction]));
    }
    this.transaction = [];
  }

  getBalance(address) {
    let balance = 0;

    this.chain.forEach((block) => {
      block.data.forEach((transaction) => {
        // console.log(transaction)

        if(transaction.to == address){
          balance += transaction.amount
        }
        else if(transaction.from == address){
          balance -= transaction.amount
          balance -= transaction.gas
        }
      })
    })
    return balance;
  }


  getLastBlock(){
    return this.chain[this.chain.length-1];
  }


  addBlock(block){
      block.prevhash = this.getLastBlock().hash;
      block.mine(this.difficulty);

      this.chain.push(block);
      this.difficulty += Date.now() - parseInt(this.getLastBlock().timestamp) < this.blockTime ? 1 : -1
  }


  isValid(){
    for(let i=1; i<this.chain.length; i++){
      const currentBlock = this.chain[i];
      const prevBlock = this.chain[i-1];

      if(currentBlock.hash !== Block.getHash(currentBlock) ||
      currentBlock.prevhash !== prevBlock.hash || 
      !Block.hasValidTransaction(currentBlock, this)){
        return false;
      }
    }
    return true;
  }
}


class Transaction {
  constructor(from, to, amount, gas=0) {
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.gas = gas;
  }

  sign(keyPair){
    if(keyPair.getPublic('hex') == this.from){
    this.signature = keyPair.sign(SHA256(this.from + this.to + this.amount + this.gas)).toDER('hex');
    }
  }

  static isValid(chain, tx){
    return (tx.from && tx.to && tx.amount &&
      (chain.getBalance(tx.from) > tx.amount + tx.gas || tx.from == MINT_PUBLIC_ADDRESS) &&
      ec.keyFromPublic(tx.from, 'hex').verify(SHA256(tx.from + tx.to + tx.amount + tx.gas), tx.signature)
    )
  }
}


const JOHN_WALLET = ec.genKeyPair(); 
const JENIFER_WALLET = ec.genKeyPair();
const MINER_WALLET = ec.genKeyPair();
const BOB_WALLET = ec.genKeyPair();


const satoshiCoin = new Blockchain();

module.exports = {Block, satoshiCoin, Transaction,}
