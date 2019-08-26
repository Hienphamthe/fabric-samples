const { Contract } = require('fabric-contract-api');
const DEVICEKEY_CC_NAME = 'devicekeycc';
const QUERY_FUNCTION_NAME = 'getDeviceKey';
const PRIVATE_CONTRACT_12 = 'contractOf12';
const PRIVATE_CONTRACT_13 = 'contractOf13';
const TRANSIENT_MAPNAME = 'devicedata';


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
     * Query all approval from approval chaincode
     * @param {String} deviceID requested device ID
     * @return {Array} list of all approvals
    */
    async queryDeviceKeyChaincode(deviceID) {
        console.info(`Check ${DEVICEKEY_CC_NAME} chaincode.`);

        const invokeArgs = [QUERY_FUNCTION_NAME, String(deviceID)];
        const txObj = await this.ctx.stub.invokeChaincode(DEVICEKEY_CC_NAME, invokeArgs);

        const txPayloadasByteBuffer = new Buffer(txObj.payload.toArrayBuffer());
        const payloadasJSON = JSON.parse(txPayloadasByteBuffer.toString());
        console.log(txPayloadasByteBuffer.toString());
        return payloadasJSON;
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
     * @return {boolean} Return true if tx is recorded.
    */
    isTxRedundance () {
        return false;
    }

    /**
     * Verify transaction signature.
     * @return {boolean} Return false if tx could not be verified.
    */
    verifyInputTx(tx) {
        return true;
    }

    /**
     * Check all organization approval for changing or adding device ID
     * @param {String} deviceID requested device ID
     * @return {boolean} got approval to change device?
    */
    async checkApproval(deviceID) {
        // const allApproval = await this.queryApprovalCC();

        // if (allApproval.length===0) return false;
        // let allApprovalStatus = false;
        // let deviceKeyApprovalStatus = false;
        // let allApprovalStatusArray = [];
        // let allAllowedDeviceKey = [];
        // for (let index = 0; index < allApproval.length; index++) {
        //     const approval = allApproval[index];
        //     allApprovalStatusArray.push(approval.Record.ApprovalStatus);
        //     approval.Record.ApprovalSet.forEach((deviceKey) => allAllowedDeviceKey.push(deviceKey));
        // }
        // const allAllowedDeviceKeySet = new Set(allAllowedDeviceKey);
        // const allApprovalStatusSet = new Set(allApprovalStatusArray);
        // allApprovalStatus = allApprovalStatusSet.has(true);
        // deviceKeyApprovalStatus = allAllowedDeviceKeySet.has(Number(deviceID));
        // return allApprovalStatus&&deviceKeyApprovalStatus;
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

/**
 * Define chaincode for managing device data ledger
*/
class DeviceDataCC extends Contract {
    /**
     * Constructor
    */
    constructor() {
        super();
        this.privateContractTemplate = {
            description: 'sample text',
            location: ['longitute', 'latitude'],
            contents: ['door1', 'door2', 'door3'],
            timestamp: 'dd.mm.yyyy-hh.mm',
            inputTxID: '1',
            doctype: 'privatedata',
        };
        this.deviceDataTemplate = {
            id: 0,
            damaged: false,
            doctype: 'shareddata',
        };
        this.devicePrivateContract12 = {
            ...this.privateContractTemplate,
            description: 'Business contract between Org1 and Org2',
            doctype: `privatedata_${PRIVATE_CONTRACT_12}`,
        };
        this.devicePrivateContract13 = {
            ...this.privateContractTemplate,
            description: 'Business contract between Org1 and Org3',
            doctype: `privatedata_${PRIVATE_CONTRACT_13}`,
        }
    }

    /**
     * Initate device id record in the ledger
     * @param {Context} ctx the transaction context
    */
    async init(ctx) {
        console.info('============= START : Initialize Device Data Ledger ===========');
        const deviceMax = 4;
        for (let index = 0; index < deviceMax; index++) {
            const device = {
                ...this.deviceDataTemplate,
                Id: index,
            };
            const deviceKey = `DEVICE${index}`;
            await ctx.stub.putState(deviceKey, Buffer.from(JSON.stringify(device)));
            console.info('Added <--> ', device);
        }
        console.info('============= END : Initialize Device Data Ledger ===========');
    }

    // Sample transient data: "{"txid":"12345","timestamp":"dd.mm.yyyy-hh.mm","payload":{"id":1,"damaged":true,"location":["long","latt"]},"signature":"abc123xyz456"}"
    /**
     * Set device data
     * @param {Context} ctx the transaction context
     * @param {String} deviceID requested deviceID
     * @param {String} contract requested contract
    */
    async setDeviceData(ctx, deviceID, contract) {
        console.info('============= START : Change Device Data ===========');
        const helper = new Helper(ctx);
        const deviceKey = `DEVICE${deviceID}`;

        if (!helper.checkFunctionArgs([deviceID, contract])) {
            throw new Error('All args are not provided.');
        }
        const deviceDataAsBytes = await ctx.stub.getState(deviceKey);
        if (!deviceDataAsBytes || deviceDataAsBytes.length === 0) {
            throw new Error(`${deviceKey} does not exist`);
        }

        let tx = helper.getTxPayload();
        let txID = tx.txid;
        if (helper.isTxRedundance(txID)) {
            throw new Error(`Transaction with "${txID}" is recorded.`);
        }
        if (!helper.verifyInputTx(tx)) {
            throw new Error(`Transaction from untrusted device.`)
        }
        let privateData = (contract === PRIVATE_CONTRACT_12) 
            ? { ...this.devicePrivateContract12 }
            : (contract === PRIVATE_CONTRACT_13)
                ? { ...this.devicePrivateContract13 }
                : null;
        if (!privateData) {
            throw new Error(`Private data could not be created. Contract name "${contract}" is unknown.`);
        }
        privateData = {
            ...privateData,
            inputTxID: tx.txid,
            timestamp: tx.timestamp,
            location: tx.payload.location,
        }
        let deviceData = {
            ...this.deviceDataTemplate,
            id: tx.payload.id,
            damaged: tx.payload.damaged,
        }
        await ctx.stub.putState(deviceKey, Buffer.from(JSON.stringify(deviceData)));
        await ctx.stub.putPrivateData(contract, deviceKey,
            Buffer.from(JSON.stringify(privateData)));
        console.info(`Device changed: ${JSON.stringify(deviceData)}`);
        console.info(`Private collection changed: ${JSON.stringify(privateData)}`);
        console.info('============= END : Change Device Data ===========');
    }

    /**
     * Get device data according to requested deviceID
     * @param {Context} ctx the transaction context
     * @param {Number} deviceID requested deviceID
     * @return {string} device data object as json string
    */
    async getDeviceData(ctx, deviceID) {
        console.info('============= START : Get Device Data ===========');
        const helper = new Helper(ctx);
        const deviceKey = `DEVICE${deviceID}`;

        if (!helper.checkFunctionArgs([deviceID])) {
            throw new Error('All args are not provided.');
        }
        const deviceDataAsBytes = await ctx.stub.getState(deviceKey);
        if (!deviceDataAsBytes || deviceDataAsBytes.length === 0) {
            throw new Error(`${deviceKey} does not exist`);
        }
        let deviceData = JSON.parse(deviceDataAsBytes.toString());
        delete deviceData.doctype;

        const contracts = [PRIVATE_CONTRACT_12, PRIVATE_CONTRACT_13];
        for (let i = 0; i < contracts.length; i++) {
            let contract = contracts[i];
            try {
                const devicePrivateDataAsBytes = await ctx.stub.getPrivateData(contract, deviceKey);
                if (devicePrivateDataAsBytes.length !== 0) {
                    let devicePrivateData = JSON.parse(devicePrivateDataAsBytes.toString());
                    console.log(devicePrivateData);
                    delete devicePrivateData.doctype;
                    deviceData[contract] = { ...devicePrivateData };
                }
            } catch (error) {
            }
        }
        console.info(`Return: ${JSON.stringify(deviceData)}`);
        console.info('============= END : Get Device Data ===========');
        return JSON.stringify(deviceData);
    }

    /**
     * Get device data according to requested deviceID
     * @param {Context} ctx the transaction context
     * @param {Number} deviceID requested deviceID
    */
    async addNewDeviceData(ctx, deviceID) {
        console.info('============= START : Add New Device Data ===========');
        const helper = new Helper(ctx);
        const deviceKey = `DEVICE${deviceID}`;

        if (!helper.checkFunctionArgs([deviceID])) {
            throw new Error('All args are not provided.');
        }
        if (!(await helper.queryDeviceKeyChaincode(deviceID))) {
            throw new Error(`Device ID "${deviceKey}" could not be found in device key ledger.`);
        }
        const deviceDataAsBytes = await ctx.stub.getState(deviceKey);
        if (deviceDataAsBytes.length !== 0) {
            throw new Error(`${deviceKey} is already exist`);
        }

        const deviceData = {
            ...this.deviceDataTemplate,
            id: deviceID,
        };
        await ctx.stub.putState(deviceKey, Buffer.from(JSON.stringify(deviceData)));
        await ctx.stub.putPrivateData(PRIVATE_CONTRACT_12, deviceKey,
            Buffer.from(JSON.stringify(this.devicePrivateContract12)));
        await ctx.stub.putPrivateData(PRIVATE_CONTRACT_13, deviceKey,
            Buffer.from(JSON.stringify(this.devicePrivateContract13)));
        console.info(`Device created: ${JSON.stringify(deviceData)}`);
        console.info(`Private collection created: ${JSON.stringify(this.devicePrivateContract12)}`);
        console.info(`Private collection created: ${JSON.stringify(this.devicePrivateContract13)}`);
        console.info('============= END : Add New Device Data ===========');
    }
}

module.exports = DeviceDataCC;
