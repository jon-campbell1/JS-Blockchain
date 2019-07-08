//Use this to generate a public/private key pair to use as an example

//Library to generate public/private key
const EC = require('elliptic').ec;

// Algorithm that is the basis of bitcoin wallets
const ec = new EC('secp256k1');

const key = ec.genKeyPair();
const publicKey = key.getPublic('hex');
const privateKey = key.getPrivate('hex');

console.log();
console.log("Private key:", privateKey);
console.log();
console.log("Public key:", publicKey);
