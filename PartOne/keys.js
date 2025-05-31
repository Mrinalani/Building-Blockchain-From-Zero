const EC = require('elliptic').ec, ec = new EC('secp256k1')


const JOHN_PRIVATE_ADDRESS = "0700a1ad28a20e5b2a517c00242d3e25a88d84bf54dce9e1733e6096e6d6495e";
const JOHN_KEY_PAIR = ec.keyFromPrivate(JOHN_PRIVATE_ADDRESS, "hex");

const MINER_PRIVATE_ADDRESS = "33f201809376d407959b1d2030933b89f9503f2441a92bf0505e0fdd1b5cf4e";
const MINER_KEY_PAIR = ec.keyFromPrivate(MINER_PRIVATE_ADDRESS, "hex");

module.exports = {
JOHN_KEY: JOHN_KEY_PAIR,
MINER_KEY: MINER_KEY_PAIR
}