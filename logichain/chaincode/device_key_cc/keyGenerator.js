const { generateKeyPairSync, createHash, createSign, createVerify } = require('crypto');
const util = require('util');
const fs = require('fs');
const filePath = `${__dirname}/keystore.json`;
const testString = 'helloworld';
const digestAlgo = 'RSA-SHA256';
const signatureFormat = 'hex';
const message = {
    id: 1,
    damaged: false,
    location: [
        '48.191656',
        '11.571069'
    ]
}
const wrongMessage = {
    id: 1,
    damaged: true,
    location: [
        '48.191656',
        '11.571069'
    ]
}

const _publicKeyEncoding = {
    type: 'spki',
    format: 'pem'
};
const _privateKeyEncoding = {
    type: 'pkcs8',
    format: 'pem',
};


/**
 * Generate keypair 
*/
function doGenerate() {
    const keyAmount = 5;
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
 * @param message Message to calculate hash
 * @returns Digest
*/
function getDigest(message) {
    const hash = createHash(digestAlgo);
    hash.update(message);
    const digest = hash.digest('hex');
    return digest; 
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

/**
 * Generate test transaction
 * @param {JSON} message message
 * @returns {string} test transaction in json string
*/
function generateTestTx(privateKey, message) {
    const messageAsString = JSON.stringify(message)
    let txAsJSON = {
        txid: getDigest(messageAsString),
        payload: {...message},
        signature: doSign(privateKey,messageAsString)
    }
    const txAsJSONString = JSON.stringify(txAsJSON);
    return txAsJSONString;
}

function main() {
    let keyStore = [];
    try {
        keyStore = JSON.parse(fs.readFileSync(filePath));
        if (keyStore) {
            //fs.unlinkSync(filePath);
        }    
    } catch (error) {
        console.log('Generate new keystore.');
        doGenerate();
    }
    
    const testTx = generateTestTx(keyStore[1].priKey,message);
    const signature = JSON.parse(testTx).signature;
    
    console.log(testTx);
    console.log(keyStore[0].pubKey);
    console.log(`Verify with correct publickey: ${doVerify(keyStore[1].pubKey,signature,JSON.stringify(message))}`);
    console.log(`Verify with wrong publickey: ${doVerify(keyStore[0].pubKey,signature,JSON.stringify(message))}`);
    console.log(`Verify with wrong data: ${doVerify(keyStore[1].pubKey,signature,JSON.stringify(wrongMessage))}`);

    // fs.writeFileSync(filePath, JSON.stringify(keyStore));

    // const testPubKey = keyStore[0].pubKey;
    // const testPriKey = keyStore[0].priKey;
    // const wrongPubKey = keyStore[1].pubKey;

    // const signtature = doSign(testPriKey, testString);
    // console.log(`Signature: ${signtature}`);

    // console.log(`Verify with correct publickey: ${doVerify(testPubKey,signtature,testString)}`);
    // console.log(`Verify with wrong publickey: ${doVerify(wrongPubKey,signtature,testString)}`);
    // console.log(`Verify with wrong data: ${doVerify(testPubKey,signtature,"wrong data")}`);
}

main();