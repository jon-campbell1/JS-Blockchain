const { Blockchain, Transaction } = require("./blockchain");

//Library to generate public/private key
const EC = require('elliptic').ec;

// Algorithm that is the basis of bitcoin wallets
const ec = new EC('secp256k1');

//Generate a public and private key pair object using the generated private key found in keys.txt
const myKeyPair = ec.keyFromPrivate("d0cd8d6abac881d9c2a98823e9534fc69c5b048826ed958ba7b45e871ab414a4");

// Extract public key from the generated key pair, this is our wallet address
const myWalletAddress = myKeyPair.getPublic('hex');

// Create the blockchain
let myBlockchain = new Blockchain();

// Transfer 10 coins from your wallet to a recipient
const tx1 = new Transaction(myWalletAddress, 'exampleRecipientAddress', 10);
tx1.signTransaction(myKeyPair);
myBlockchain.addTransaction(tx1);

console.log("Starting the miner...");
myBlockchain.minePendingTransactions(myWalletAddress);

console.log("Balance is " + myBlockchain.getBalanceOfAddress(myWalletAddress) + " coins");
