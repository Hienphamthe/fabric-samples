const {Contract} = require('fabric-contract-api');
const APPROVAL_CC_NAME = 'approvalcc';


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
     * @return {Array} list of all approvals
    */
    async queryApprovalCC() {
        console.info('Check approval chaincode.');
        const invokeArgs= ['getAllApproval'];
        const txObj = await this.ctx.stub.invokeChaincode(APPROVAL_CC_NAME, invokeArgs);
        const allApprovalasByteBuffer = new Buffer(txObj.payload.toArrayBuffer());
        const allApprovalasJSON = JSON.parse(allApprovalasByteBuffer.toString());
        console.log(allApprovalasByteBuffer.toString());
        return allApprovalasJSON;
    }

    /**
     * Check all organization approval for changing or adding device ID
     * @param {String} deviceID requested device ID
     * @return {boolean} got approval to change device?
    */
    async checkApproval(deviceID) {
        const allApproval = await this.queryApprovalCC();
        if (allApproval.length===0) return false;
        let allApprovalStatus = false;
        let deviceKeyApprovalStatus = false;
        let allApprovalStatusArray = [];
        let allAllowedDeviceKey = [];
        for (let index = 0; index < allApproval.length; index++) {
            const approval = allApproval[index];
            allApprovalStatusArray.push(approval.Record.ApprovalStatus);
            approval.Record.ApprovalSet.forEach((deviceKey) => allAllowedDeviceKey.push(deviceKey));
        }
        const allAllowedDeviceKeySet = new Set(allAllowedDeviceKey);
        const allApprovalStatusSet = new Set(allApprovalStatusArray);
        allApprovalStatus = allApprovalStatusSet.has(true);
        deviceKeyApprovalStatus = allAllowedDeviceKeySet.has(Number(deviceID));
        return allApprovalStatus&&deviceKeyApprovalStatus;
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
 * Define chaincode for managing device id ledger
*/
class DeviceIDCC extends Contract {
    /**
     * Constructor
    */
    constructor() {
        super();
        this.sensorTemplate = {
            id: 0,
            publicKey: 'hex format',
        };
    }

    /**
     * Initate device id record in the ledger
     * @param {Context} ctx the transaction context
    */
    async init(ctx) {
        console.info('============= START : Initialize Device ID Ledger ===========');
        const sensorMax = 5;
        for (let index = 0; index < sensorMax; index++) {
            const device = {
                ...this.sensorTemplate,
                id: index,
                doctype: 'deviceID',
            };
            await ctx.stub.putState(`DEVICE${index}`, Buffer.from(JSON.stringify(device)));
            console.info('Added <--> ', device);
        }
        console.info('============= END : Initialize Device ID Ledger ===========');
    }

    /**
     * Change publicKey of a device
     * @param {Context} ctx the transaction context
     * @param {String} deviceID device id
     * @param {String} newPublicKey new public key of device in hex-string
    */
    async setDevice(ctx, deviceID, newPublicKey) {
        console.info('============= START : Set Device ===========');
        const helper = new Helper(ctx);
        const deviceKey = `DEVICE${deviceID}`;

        if (!helper.checkFunctionArgs([deviceID, newPublicKey])) {
            throw new Error('All args are not provided.');
        }

        const deviceAsBytes = await ctx.stub.getState(deviceKey);
        if (!deviceAsBytes || deviceAsBytes.length === 0) {
            throw new Error(`${deviceKey} does not exist`);
        }

        const device = JSON.parse(deviceAsBytes.toString());
        if (!(await helper.checkApproval(deviceID))) {
            throw new Error('Could not get all approvals, or requested device does not belongs to approval set.');
        }
        device.publicKey = newPublicKey;
        await ctx.stub.putState(deviceKey, Buffer.from(JSON.stringify(device)));
        console.info('============= END : Set Device ===========');
    }

    /**
     * Get each device id
     * @param {Context} ctx the transaction context
     * @param {String} deviceID device id
     * @return {String} device key as string
    */
    async getDevice(ctx, deviceID) {
        console.info('============= START : Get Device ===========');
        const helper = new Helper();
        if (!helper.checkFunctionArgs([deviceID])) {
            throw new Error('DeviceID is not provided.');
        }
        const deviceKey = `DEVICE${deviceID}`;
        const deviceAsBytes = await ctx.stub.getState(deviceKey);
        if (!deviceAsBytes || deviceAsBytes.length === 0) {
            throw new Error(`${deviceKey} does not exist`);
        }
        console.info('============= END : Get Device ===========');
        return deviceAsBytes.toString();
    }

    /**
     * Add new device id
     * @param {Context} ctx the transaction context
     * @param {String} deviceID device id
     * @param {String} publicKey public key of device in hex-string
    */
    async addNewDevice(ctx, deviceID, publicKey) {
        console.info('============= START : Create Device ID ===========');
        const helper = new Helper(ctx);
        const deviceKey = `DEVICE${deviceID}`;

        if (!helper.checkFunctionArgs([deviceID, publicKey])) {
            throw new Error('All args are not provided.');
        }
        if (!(await helper.checkApproval(deviceID))) {
            throw new Error(`Device ID "${deviceID}" is not allowed to be listed.`)
        }

        const deviceAsBytes = await ctx.stub.getState(deviceKey);
        if (deviceAsBytes.length !== 0) {
            throw new Error(`${deviceKey} is already exist`);
        }
        const device = {
            ...this.sensorTemplate,
            id: deviceID,
            publicKey: publicKey,
        };
        await ctx.stub.putState(deviceKey, Buffer.from(JSON.stringify(device)));
        console.info(`Device created: ${JSON.stringify(device)}`);
        console.info('============= END : Create Device ID ===========');
    }
}

module.exports = DeviceIDCC;
