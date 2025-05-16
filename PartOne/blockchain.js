const crypto = require('crypto'); SHA256 = message => crypto.createHash('sha256').update(message).digest('hex')

class Block {
    constructor(data = []){
        this.timestamp = Date.now(),
        this.data = data,
        this.hash = this.getHash(),
        this.prevHash = '',
        this.nonce = 0
    };

    getHash() {
        return SHA256(this.timestamp + JSON.stringify(this.data) + this.prevHash + this.nonce);
    }

    mine(difficulty) {
        while(!this.hash.startsWith(Array(difficulty + 1).join('0'))) {
            this.nonce++;

            this.hash = this.getHash();
        }
    }


}

const block1 = new Block(["Transaction 1"]);
block1.mine(5);
console.log(block1);
