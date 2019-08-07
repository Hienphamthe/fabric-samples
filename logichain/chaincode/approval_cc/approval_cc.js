const {Contract} = require('fabric-contract-api');
const ClientIdentity = require('fabric-shim').ClientIdentity;

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
        this.submitterID = new ClientIdentity(this.ctx.stub);
        this.approvalDataModel = {
            Name: '',
            ApprovalStatus: false,
            ApprovalSet: [],
        };
        this.MSPID = {
            org1: 'Org1MSP',
            org2: 'Org2MSP',
            org3: 'Org3MSP',
        };
    }

    /**
     * Check MSPID of tx submitter
     * @return {boolean}
    */
    checkSubmiterMSPID() {
        const submitterMSPID = this.submitterID.getMSPID();
        return Boolean(submitterMSPID);
    }

    /**
     * Check ID of tx submitter
     * @return {boolean}
    */
    checkSubmiterID() {
        const submitterID = this.submitterID.getID();
        return Boolean(submitterID);
    }

    /**
     * Authorize submitter MSPID
     * @param {String} target Target MSP to verify
     * @return {boolean}
    */
    verifySubmiterMSPID(target) {
        const submitterMSPID = this.submitterID.getMSPID();
        return submitterMSPID===`${target}MSP`;
    }

    /**
     * Generate data model for specific approval
     * @param {String} orgName Organization name
     * @return {any} approval object
    */
    approvalGenerator(orgName) {
        return {
            ...this.approvalDataModel,
            Name: orgName,
            docType: 'approval',
        };
    }

    /**
     * Get submitter ID and return approval
     * @return {any} approval object
    */
    getApproval() {
        const submitterMSPID = this.submitterID.getMSPID();
        let approval = {};
        switch (submitterMSPID) {
        case this.MSPID.org1:
            approval = this.approvalGenerator('Org1');
            break;
        case this.MSPID.org2:
            approval = this.approvalGenerator('Org2');
            break;
        case this.MSPID.org3:
            approval = this.approvalGenerator('Org3');
            break;
        default:
            approval = null;
            break;
        }
        return approval;
    }
}

/**
 * Define approval chaincode for all organization
*/
class ApprovalCC extends Contract {
    /**
     * Constructor
    */
    constructor() {
        super();
        this.helper = undefined;
    }
    /**
     * Initate approval record in the ledger for each organization
     * @param {Context} ctx the transaction context
    */
    async init(ctx) {
        console.info('============= START : Initialize Approval Ledger ===========');
        this.helper = new Helper(ctx);
        if (!this.helper.checkSubmiterMSPID()) {
            throw new Error('Submitter ID could not be found!');
        }
        const approval = this.helper.getApproval();
        if (!approval) {
            throw new Error('Submitter MSP ID could not be identified!');
        }

        await ctx.stub.putState(`APPROVAL${approval.Name}`, Buffer.from(JSON.stringify(approval)));
        console.info('Added <--> ', approval);
        console.info('============= END : Initialize Approval Ledger ===========');
    }

    /**
     * Get all org approval
     * @param {Context} ctx the transaction context
    */
    async getAllAppoval(ctx) {
        console.info('============= START : get All Org Approval ===========');
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
                allResults.push({Key, Record});
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                console.info('============= END : get All Org Approval ===========');
                return JSON.stringify(allResults);
            }
        }
    }

    /**
     * Get each org approval
     * @param {Context} ctx the transaction context
     * @param {String} org organization name
    */
    async getOrgAppoval(ctx, org) {
        console.info('============= START : get Org Approval ===========');
        const orgKey = `APPROVAL${org}`;
        const approvalAsBytes = await ctx.stub.getState(orgKey);
        if (!approvalAsBytes || approvalAsBytes.length === 0) {
            throw new Error(`${orgKey} does not exist`);
        }
        console.info('============= END : get Org Approval ===========');
        return approvalAsBytes.toString();
    }

    /**
     * Change organization approval
     * @param {Context} ctx the transaction context
     * @param {String} org organization name
     * @param {Boolean} status organization approval status
     * @param {String} changingSet organization set of allowed deviceID
    */
    async setOrgApproval(ctx, org, status, changingSet) {
        console.info('============= START : set Org Approval ===========');

        this.helper = new Helper(ctx);
        if (!this.helper.checkSubmiterMSPID()) {
            throw new Error('Submitter ID could not be found!');
        }

        const orgKey = `APPROVAL${org}`;
        const approvalAsBytes = await ctx.stub.getState(orgKey);
        if (!approvalAsBytes || approvalAsBytes.length === 0) {
            throw new Error(`${orgKey} does not exist`);
        }

        const approval = JSON.parse(approvalAsBytes.toString());
        if (!this.helper.verifySubmiterMSPID(approval.Name)) {
            throw new Error(`Tx submitter is not authorized to change ${orgKey}.`);
        }

        if (Boolean(status)) {
            approval.ApprovalStatus = Boolean(status);
            const approvalSet = changingSet.split(',');
            approval.ApprovalSet = [];
            approvalSet.forEach((eachApproval) => approval.ApprovalSet.push(eachApproval));
        } else {
            approval.ApprovalStatus = Boolean(status);
            approval.ApprovalSet = [];
        }
        await ctx.stub.putState(orgKey, Buffer.from(JSON.stringify(approval)));
        console.info('============= END : set Org Approval ===========');
    }

    /**
     * Change organization approval
     * @param {Context} ctx the transaction context
     * @param {String} org organization name
    */
    async addOrgApproval(ctx, org) {
        console.info('============= START : Create Org Approval ===========');
        this.helper = new Helper(ctx);
        const orgKey = `APPROVAL${org}`;
        const approval = this.helper.approvalGenerator(org);

        await ctx.stub.putState(orgKey, Buffer.from(JSON.stringify(approval)));
        console.info('============= END : Create Org Approval ===========');
    }
}

module.exports = ApprovalCC;
