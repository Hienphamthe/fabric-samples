const {Contract} = require('fabric-contract-api');

/**
 * Define chaincode for managing device id ledger
*/
class SensorIDCC extends Contract {
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
        const deviceKey = `SENSOR${deviceID}`;
        const sensorAsBytes = await ctx.stub.getState(deviceKey);
        if (!sensorAsBytes || sensorAsBytes.length === 0) {
            throw new Error(`${deviceKey} does not exist`);
        }

        const device = JSON.parse(sensorAsBytes.toString());
        // query approval for this sensorID
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
        const deviceKey = `SENSOR${deviceID}`;

        // query approval chaincode
        const sensorAsBytes = await ctx.stub.getState(deviceKey);
        if (sensorAsBytes || sensorAsBytes.length !== 0) {
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

module.exports = SensorIDCC;
