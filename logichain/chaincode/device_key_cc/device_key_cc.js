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
    */
    async queryApprovalCC() {
        const allApproval = await this.ctx.stub.invokeChaincode(APPROVAL_CC_NAME, ['a', 'b']);
        console.log(allApproval);
        console.log(typeof allApproval);
    }

    /**
     * Check all organization approval for changing device ID
     * @param {String} deviceID requested device ID
     * @returns {boolean} got approval to change device?
    */
    checkSetApproval(deviceID) {
        this.queryApprovalCC();
        return true;
    }

    /**
     * Check all organization approval for add new device ID
     * @param {String} deviceID requested device ID
     * @returns {boolean} got approval to add device?
    */
    checkAddApproval(deviceID) {
        this.queryApprovalCC();
        return true;
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
            };
            await ctx.stub.putState(`SENSOR${index}`, Buffer.from(JSON.stringify(device)));
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
        // const helper = new Helper(ctx);
        const deviceKey = `SENSOR${deviceID}`;
        const sensorAsBytes = await ctx.stub.getState(deviceKey);
        if (!sensorAsBytes || sensorAsBytes.length === 0) {
            throw new Error(`${deviceKey} does not exist`);
        }

        const device = JSON.parse(sensorAsBytes.toString());

        let args=['getAllApproval'];
        console.log(typeof args);
        let allApproval = await ctx.stub.invokeChaincode(APPROVAL_CC_NAME, args, "mychannel");
        console.log(allApproval);

        // if (!helper.checkSetApproval(deviceID)) {
        //     throw new Error(`Could not get all approvals, \
        //     or requested device does not belongs to approval set.`)
        // }
        device.publicKey = newPublicKey;
        await ctx.stub.putState(deviceKey, Buffer.from(JSON.stringify(device)));
        console.info('============= END : Set Device ===========');
    }

    /**
     * Get each device id
     * @param {Context} ctx the transaction context
     * @param {String} deviceID device id
    */
    async getDevice(ctx, deviceID) {
        console.info('============= START : Get Device ===========');
        const deviceKey = `SENSOR${deviceID}`;
        const sensorAsBytes = await ctx.stub.getState(deviceKey);
        if (!sensorAsBytes || sensorAsBytes.length === 0) {
            throw new Error(`${deviceKey} does not exist`);
        }
        console.info('============= END : Get Device ===========');
        return sensorAsBytes.toString();
    }

    /**
     * Add new device id
     * @param {Context} ctx the transaction context
     * @param {String} deviceID device id
     * @param {String} publicKey public key of device in hex-string
    */
    async addNewDevice(ctx, deviceID, publicKey) {
        console.info('============= START : Create Device ID ===========');
        // const helper = new Helper(ctx);
        const deviceKey = `SENSOR${deviceID}`;

        // if (!helper.checkAddApproval(deviceID)) {
        //     throw new Error(`Device ID "${deviceID}" is not allowed to be listed.`)
        // }

        const sensorAsBytes = await ctx.stub.getState(deviceKey);
        console.log(sensorAsBytes);
        console.log(sensorAsBytes.length);
        if (sensorAsBytes.length !== 0) {
            throw new Error(`${deviceKey} is already exist`);
        }
        const device = {
            ...this.sensorTemplate,
            id: deviceID,
            publicKey: publicKey,
        };
        await ctx.stub.putState(deviceKey, Buffer.from(JSON.stringify(device)));
        console.info('============= END : Create Device ID ===========');
    }
}

module.exports = DeviceIDCC;
