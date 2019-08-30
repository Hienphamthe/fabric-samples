const {APPROVAL_CC_NAME} = require('./constants.js');

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
        allApprovalStatus = allApprovalStatusArray.every(approval => approval);
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

module.exports = Helper;
