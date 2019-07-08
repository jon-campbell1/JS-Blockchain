// Package used to generate hashes
const SHA256 = require("crypto-js/sha256");

//Library to generate public/private key
const EC = require('elliptic').ec;
// Algorithm that is the basis of bitcoin wallets
const ec = new EC('secp256k1');

// Every transaction contains a fromAddress, toAddress, and amount of coins
class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  calculateHash() {
    //Generate hash for the transaction
    return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
  }

  signTransaction(signingKey) {
    // Check if public key matches the fromAddress (Your wallet address)
    if(signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error("You cannot sign transactions for other wallets!");
    }
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    this.signature = sig.toDER('hex');
  }

  isValid() {
    // if fromAddress equals null then it is valid, because it is a miner reward transaction.
    if(this.fromAddress === null) return true;

    // if signature does not exist, throw error
    if(!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    // Return true or false if signature contains the calculated hash
    return publicKey.verify(this.calculateHash(), this.signature);
  }

}

class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();

    // the nonce property will increment so the hash can change in the the "mineBlock()" method
    this.nonce = 0;
  }

  // Each block must have a unique hash which is computed using the block's own properties
  calculateHash() {
    return SHA256(this.transactions + this.nonce + this.previousHash + this.timestamp + JSON.stringify(this.data)).toString();
  }

  /*
  A block can only be mined if the hash starts with the correct amount of "0"s determined by "difficulty"
  If difficulty equals 4 then the hash must start with "0000"
  The nonce will increment and a new hash will be generated until the hash starts with the correct amount of "0"s
  In Bitcoin, it takes about 10 minutes for a correct hash to be generated. To increase the amount of time it takes
  to mine a block, increase the difficulty in the "Blockchain" class.
  */
  mineBlock(difficulty) {
    while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log("Block mined: " + this.hash)
  }

  // Check to see if all transactions in the block are valid
  hasValidTransactions() {
    for(const tx of this.tranactions) {
      if(!tx.isValid()) {
        return false;
      }
    }
    return true;
  }

}

// Create and manage your blockchain
class Blockchain {
  constructor() {

    // Array of blocks starting with the genesis block
    this.chain = [this.createGenesisBlock()];

    // Difficulty to control how fast a block can be mined
    this.difficulty = 5;

    // Array of pending transactions
    this.pendingTransactions = [];

    // The reward for successfully mining a new block
    this.miningReward = 100;

  }

  // Create in intitial genesis block
  createGenesisBlock() {
    return new Block("01/01/2017", "Genesis Block", "0");
  }

  // Get the last block created in the blockchain
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    /*
    In Bitcoin, miners get to choose which transactions to include in a block,
    in our example we will put all pending transactions into out blocks
    */
    let block = new Block(Date.now(), this.pendingTransactions);
    block.mineBlock(this.difficulty);
    this.chain.push(block);

    // send mining reward to the provided miner address
    this.pendingTransactions = [
      new Transaction(null, miningRewardAddress, this.miningReward)
    ];
    console.log("Transferring Miner Reward of " + this.miningReward + " coins...")
    let rewardBlock = new Block(Date.now(), this.pendingTransactions);
    rewardBlock.mineBlock(this.difficulty);
    this.chain.push(rewardBlock);
  }

  addTransaction(transaction) {
    if(!transaction.fromAddress || !transaction.toAddress) {
      throw new Error("Transaction must include from and to address!");
    }

    if(!transaction.isValid()) {
      throw new Error("Cannot add invalid transaction to the chain!");
    }

    this.pendingTransactions.push(transaction);
  }

  // Get number of coins in wallet address
  getBalanceOfAddress(address) {
    let balance = 0;
    for(const block of this.chain) {
      for(const trans of block.transactions) {
        if(trans.fromAddress === address) {
          balance -= trans.amount;
        }
        if(trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }
    return balance;
  }

  /*
  A blockchain is valid if:
  - all blocks contain the current hash,
  - for each block, the "previousBlock" property matches the hash of the block before it,
  - if all blocks contain valid transactions
  */
  isChainValid() {
    // loop through all the blocks and compare the hash and previous hash
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      //if the hash of the current block is not correct
      if(currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
      // if the hash of the previous block does not match the "previousHash" of the current block
      if(currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      if(!currentBlock.hasValidTransactions()) {
        return false;
      }

    }
    // If chain is valid return true
    return true;
  }

}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
