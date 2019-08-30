const { generateKeyPairSync, createHash, createSign, createVerify } = require('crypto');
const util = require('util');
const fs = require('fs');
const filePath = `${__dirname}/keystore.json`;
const testString = 'helloworld';
const digestAlgo = 'RSA-SHA256';
const signatureFormat = 'hex';

const _publicKeyEncoding = {
    type: 'spki',
    format: 'pem'
};
const _privateKeyEncoding = {
    type: 'pkcs8',
    format: 'pem',
};


let keyStore = [];
const keyAmount = 5;

/**
 * Generate keypair 
*/
function doGenerate() {
    for (let index = 0; index < keyAmount; index++) {
        let keyPair = {};
        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: _publicKeyEncoding,
            privateKeyEncoding: _privateKeyEncoding
        });
        keyPair.pubKey = publicKey;
        keyPair.priKey = privateKey;
        keyStore.push(keyPair);
    }

};

/**
 * Get digest
*/
function getDigest() {
    const hash = createHash(digestAlgo);
    hash.update(testString);
    const digest = hash.digest('hex');
    console.log(digest);
}

/**
 * Sign a message
 * @param {string} privateKey private key
 * @param {string} message message
 * @returns {string} signature
*/
function doSign(privateKey, message) {
    const signer = createSign(digestAlgo);
    signer.update(message);
    signer.end();
    const signature = signer.sign(privateKey, signatureFormat);
    return signature;
}

/**
 * Verify a signature
 * @param {string} publicKey public key
 * @param {string} signature signature
 * @param {string} message message
 * @returns {boolean} true if signature is valid
*/
function doVerify(publicKey, signature, message) {
    const verifier = createVerify(digestAlgo);
    verifier.update(message);
    verifier.end();
    return verifier.verify(publicKey, signature, signatureFormat);
}

function main() {
    if (JSON.parse(fs.readFileSync(filePath))) {
        fs.unlinkSync(filePath);
    }
    doGenerate();
    fs.writeFileSync(filePath, JSON.stringify(keyStore));

    const testPubKey = keyStore[0].pubKey;
    const testPriKey = keyStore[0].priKey;
    const wrongPubKey = keyStore[1].pubKey;

    const signtature = doSign(testPriKey, testString);
    console.log(`Signature: ${signtature}`);

    console.log(`Verify with correct publickey: ${doVerify(testPubKey,signtature,testString)}`);
    console.log(`Verify with wrong publickey: ${doVerify(wrongPubKey,signtature,testString)}`);
}

main();