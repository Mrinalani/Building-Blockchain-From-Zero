const crypto = require("crypto");
SHA256 = (message) => crypto.createHash("sha256").update(message).digest("hex");

class Block {
  constructor(data = []) {
    (this.timestamp = Date.now()),
      (this.data = data),
      (this.hash = this.getHash()),
      (this.prevHash = ""),
      (this.nonce = 0);
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
}

// const block1 = new Block(["Transaction 1"]);
// block1.mine(5);
// console.log(block1);

class Blockchain {
  constructor() {
    (this.chain = [new Block(["Genisis Block"])]),
      (this.difficulty = 2),
      (this.blockTime = 2000);
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

      if (currentBlock.hash !== currentBlock.getHash() || currentBlock.prevHash !== prevBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

const satoshiCoin = new Blockchain();
satoshiCoin.addBlock(new Block(["Transaction1"]));
satoshiCoin.addBlock(new Block(["Transaction2"]));
satoshiCoin.addBlock(new Block(["Transaction3"]));
satoshiCoin.chain[2].data = "hacked";
console.log(satoshiCoin.chain);
console.log("blockchain is valid",satoshiCoin.isValid());

