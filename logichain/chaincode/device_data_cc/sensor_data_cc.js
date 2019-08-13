const {Contract} = require('fabric-contract-api');
const DEVICEKEY_CC_NAME = 'devicekeycc';
const QUERY_FUNCTION_NAME = 'getDevice';
const PRIVATE_CONTRACT_12 = 'contractOf12';
const PRIVATE_CONTRACT_13 = 'contractOf13';


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
    async queryChaincode(deviceID) {
        console.info(`Check ${DEVICEKEY_CC_NAME} chaincode.`);

        const invokeArgs = [QUERY_FUNCTION_NAME, String(deviceID)];
        const txObj = await this.ctx.stub.invokeChaincode(DEVICEKEY_CC_NAME, invokeArgs);

        const txPayloadasByteBuffer = new Buffer(txObj.payload.toArrayBuffer());
        const payloadasJSON = JSON.parse(txPayloadasByteBuffer.toString());
        console.log(txPayloadasByteBuffer.toString());
        return payloadasJSON;
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
            locationState: 'sample text',
            contents: ['door1', 'door2', 'door3'],
            doctype: 'privatedata',
        };
        this.deviceDataTemplate = {
            Id: 0,
            Damaged: false,
            doctype: 'shareddata',
        };
    }

    /**
     * Initate device id record in the ledger
     * @param {Context} ctx the transaction context
    */
    async init(ctx) {
        console.info('============= START : Initialize Device Data Ledger ===========');
        const deviceMax = 5;
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

    /**
     * Set device data
     * @param {Context} ctx the transaction context
     * @param {string} deviceID requested deviceID
     * @param {string} cyphertext encrypted payload
    */
    async setDeviceData(ctx, deviceID, cyphertext) {
        console.info('============= START : Change Device Data ===========');
        // const helper = new Helper(ctx);
        // const deviceKey = `DEVICE${deviceID}`;

        // if (!helper.checkFunctionArgs([deviceID, contract, location])) {
        //     throw new Error('All args are not provided.');
        // }
        // const deviceDataAsBytes = await ctx.stub.getState(deviceKey);
        // if (!deviceDataAsBytes || deviceDataAsBytes.length === 0) {
        //     throw new Error(`${deviceKey} does not exist`);
        // }

        // let transientDataasByte = ctx.stub.getTransient();


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

        if (!helper.checkFunctionArgs([deviceID, contract])) {
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
            const devicePrivateDataAsBytes = await ctx.stub.getPrivateData(contract, deviceKey);
            if (devicePrivateDataAsBytes.length !== 0) {
                let devicePrivateData = JSON.parse(devicePrivateDataAsBytes.toString());
                delete devicePrivateData.doctype;
                deviceData[contract] = {...devicePrivateData};
            }
        }

        console.info(`Return: ${deviceData}`);
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
        if (!(await helper.queryChaincode(deviceID))) {
            throw new Error(`Device ID "${deviceKey}" could not be found in device key ledger.`);
        }
        const deviceDataAsBytes = await ctx.stub.getState(deviceKey);
        if (deviceDataAsBytes.length !== 0) {
            throw new Error(`${deviceKey} is already exist`);
        }

        const deviceData = {
            ...this.deviceDataTemplate,
            Id: deviceID,
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
