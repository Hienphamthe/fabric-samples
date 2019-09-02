const {Contract} = require('fabric-contract-api');
const fs = require('fs');
const keyFilePath = `${__dirname}/keystore.json`
const Helper = require('./utils.js');


/**
 * Define chaincode for managing device id ledger
*/
class DeviceIDCC extends Contract {
    /**
     * Constructor
    */
    constructor() {
        super();
        this.keypairList = JSON.parse(fs.readFileSync(keyFilePath));
        this.sensorTemplate = {
            id: 0,
            publicKey: '',
        };
    }

    /**
     * Initate device id record in the ledger
     * @param {Context} ctx the transaction context
    */
    async init(ctx) {
        console.info('============= START : Initialize Device ID Ledger ===========');
        const sensorMax = this.keypairList.length;
        for (let index = 0; index < sensorMax; index++) {
            const device = {
                ...this.sensorTemplate,
                id: index,
                publicKey: this.keypairList[index].pubKey,
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
    async setDeviceKey(ctx, deviceID, newPublicKey) {
        console.info('============= START : Set Device Key ===========');
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
        console.info('============= END : Set Device Key ===========');
    }

    /**
     * Get each device id
     * @param {Context} ctx the transaction context
     * @param {String} deviceID device id
     * @return {String} device key as string
    */
    async getDeviceKey(ctx, deviceID) {
        console.info('============= START : Get Device Key ===========');
        const helper = new Helper();
        if (!helper.checkFunctionArgs([deviceID])) {
            throw new Error('DeviceID is not provided.');
        }
        const deviceKey = `DEVICE${deviceID}`;
        const deviceAsBytes = await ctx.stub.getState(deviceKey);
        if (!deviceAsBytes || deviceAsBytes.length === 0) {
            throw new Error(`${deviceKey} does not exist`);
        }
        console.info('============= END : Get Device Key ===========');
        return deviceAsBytes.toString();
    }

    /**
     * Get all device key
     * @param {Context} ctx the transaction context
     * @returns {String} array of all device key in JSON String
    */
    async getAllDeviceKey(ctx) {
        console.info('============= START : get All Device Key ===========');
        const startKey = '';
        const endKey = '';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                delete Record.doctype;
                allResults.push({Key, Record});
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                console.info('============= END : get All Device Key ===========');
                return JSON.stringify(allResults);
            }
        }
    }

    /**
     * Add new device id
     * @param {Context} ctx the transaction context
     * @param {String} deviceID device id
     * @param {String} publicKey public key of device in hex-string
    */
    async addNewDeviceKey(ctx, deviceID, publicKey) {
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
