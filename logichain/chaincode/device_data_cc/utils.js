const {
    DEVICEKEY_CC_NAME, 
    QUERY_FUNCTION_NAME, 
    TRANSIENT_MAPNAME
} = require('./constants.js');

class CryptoHelper {

}

/**
 * Helper class
*/
class Helper {
    /**
     * Constructor
     * @param {Context} ctx the transaction context
    */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Query publicKey of the device
     * @param {String} deviceID requested device ID
     * @return {String} device publicKey in string format
    */
    async queryDeviceKeyChaincode(deviceID) {
        console.info(`Check "${DEVICEKEY_CC_NAME}" chaincode.`);

        const invokeArgs = [QUERY_FUNCTION_NAME, String(deviceID)];
        const txObj = await this.ctx.stub.invokeChaincode(DEVICEKEY_CC_NAME, invokeArgs);

        const deviceKeyObjasByteBuffer = new Buffer(txObj.payload.toArrayBuffer());
        const deviceKeyObjasString = deviceKeyObjasByteBuffer.toString();
        console.log(deviceKeyObjasString);
        return deviceKeyObjasString;
    }

    /**
     * Get Tx private payload from transient field
     * @return {object} tx as JSON object
    */
    getTxPayload() {
        let transientData = this.ctx.stub.getTransient();
        // convert into buffer
        let buffer = new Buffer(transientData.map[TRANSIENT_MAPNAME].value.toArrayBuffer());
        // from buffer into string
        let JSONString = buffer.toString('utf8');
        // from json string into object
        console.log(JSONString);
        return JSON.parse(JSONString);
    }

    /**
     * Verify if this transaction txid is recorded or not.
     * @param {string} contract Name of the private data collection.
     * @param {string} txID Transaction ID.
     * @return {boolean} Return true if tx is recorded.
    */
    // async isTxRedundance(contract, txID) {
    //     const queryString = `{"selector":{"inputTxID":"${txID}"}, "use_index":["_design/indexPrivateDataInputTxIDDoc", "indexPrivateDataInputTxID"]}`;
    //     try {
    //         const iterator = await this.ctx.stub.getPrivateDataQueryResult(contract, queryString);
    //         console.log(typeof iterator);

    //         // const result = {};
    //         // while (true) {
    //         //     const res = await iterator.next();

    //         //     if (res.value && res.value.value.toString()) {
    //         //         console.log(res.value.value.toString('utf8'));
    //         //         result = JSON.parse(res.value.value.toString('utf8'));
    //         //     }
    //         //     if (res.done) {
    //         //         console.log('end of data');
    //         //         await iterator.close();
    //         //         console.log(result);
    //         //         return false //Boolean(!devicePrivateDataAsBytes || devicePrivateDataAsBytes.length === 0)
    //         //     }
    //         // }
    //     } catch (error) {
    //         throw error;
    //     }
    //     return false;
    // }

    /**
     * Verify transaction signature.
     * @param {object} tx transaction sent from iot device
     * @return {boolean} Return false if tx could not be verified.
    */
    async verifyInputTx(tx) {
        const deviceID = tx.payload.id;
        const deviceKeyObj = await this.queryDeviceKeyChaincode(deviceID);
        if (!deviceKeyObj.publicKey) {
            throw new Error(`Public key of device id "${deviceID}" could not be found on ledger.`);   
        }
        console.log(deviceKeyObj.publicKey);
        
        return true;
    }

    /**
     * Check if chaincode function is provided with required args
     * @param {Array} args array of args
     * @return {boolean} return true if all args are provided
    */
    checkFunctionArgs(args) {
        return args.every((arg) => Boolean(arg));
    }
}

module.exports = Helper;