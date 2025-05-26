const EC = require('elliptic').ec, ec = new EC('secp256k1')


const JOHN_PRIVATE_ADDRESS = "0700a1ad28a20e5b2a517c00242d3e25a88d84bf54dce9e1733e6096e6d6495e";
const JOHN_KEY_PAIR = ec.keyFromPrivate(JOHN_PRIVATE_ADDRESS, "hex");

module.exports = {
JOHN_KEY: JOHN_KEY_PAIR
}