const { Contract } = require('fabric-contract-api');
const ClientIdentity = require('fabric-shim').ClientIdentity;
const approvalDataModel = {
    Name: "",
    ApprovalStatus: false,
    ApprovalSet: []
}
const MSPID = {
    org1: "Org1MSP",
    org2: "Org2MSP",
    org3: "Org3MSP",
}


class ApprovalCC extends Contract {
    async init(ctx) {
        console.info('============= START : Initialize Approval Ledger ===========');

        let submitterID = new ClientIdentity(ctx.stub)
        if (!submitterID.getMSPID()) {
            throw new Error(`Submitter ID could not be found!`);
        }

        let approval = {}
        switch (submitterID.getMSPID()) {
            case MSPID.org1:
                approval = {
                    ...approvalDataModel,
                    Name: "Org1",
                };
                break;

            case MSPID.org2:
                approval = {
                    ...approvalDataModel,
                    Name: "Org2",
                };
                break;

            case MSPID.org3:
                approval = {
                    ...approvalDataModel,
                    Name: "Org3",
                };
                break;

            default:
                throw new Error(`Submitter ID could not be identified!`)
        }

        approval.docType = 'approval';
        await ctx.stub.putState(`APPROVAL${approval.Name}, ${Buffer.from(JSON.stringify(approval))}`);
        console.info('Added <--> ', approval);

        // const approvals = [
        //     {
        //         Name: "Org1",
        //         ApprovalStatus: false,
        //         ApprovalSet: []
        //     },
        //     {
        //         Name: "Org2",
        //         ApprovalStatus: false,
        //         ApprovalSet: []
        //     },
        //     {
        //         Name: "Org3",
        //         ApprovalStatus: false,
        //         ApprovalSet: []
        //     },
        // ]

        // for (let i = 0; i < approvals.length; i++) {
        //     approvals[i].docType = 'approval';
        //     await ctx.stub.putState('Approval' + i, Buffer.from(JSON.stringify(approvals[i])));
        //     console.info('Added <--> ', approvals[i]);
        // }
        console.info('============= END : Initialize Approval Ledger ===========');
    }

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
                allResults.push({ Key, Record });
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

    async getOrgAppoval(ctx, org) {
        console.info('============= START : get Org Approval ===========');
        const orgKey = `Approval${org}`
        const approvalAsBytes = await ctx.stub.getState(orgKey);
        if (!approvalAsBytes || approvalAsBytes.length === 0) {
            throw new Error(`${orgKey} does not exist`);
        }
        console.info('============= END : get Org Approval ===========');
        return approvalAsBytes.toString();
    }

    async setOrgApproval(ctx, org, status, changingSet) {
        console.info('============= START : set Org Approval ===========');
        const orgKey = `Approval${org}`
        const approvalAsBytes = await ctx.stub.getState(orgKey);
        if (!approvalAsBytes || approvalAsBytes.length === 0) {
            throw new Error(`${orgKey} does not exist`);
        }
        const approval = JSON.parse(approvalAsBytes.toString());
        if (approval.ApprovalStatus === Boolean(status)) {
            approval.ApprovalStatus = Boolean(status)
            let approvalSet = changingSet.split(",")
            approvalSet.forEach(eachApproval => approval.ApprovalSet.push(eachApproval))
        } else {
            approval.ApprovalStatus = Boolean(status)
            approval.ApprovalSet = [];
        }
        await ctx.stub.putState(orgKey, Buffer.from(JSON.stringify(approval)));
        console.info('============= END : set Org Approval ===========');
    }

    async addOrgApproval(ctx, orgName) {
        console.info('============= START : Create Org Approval ===========');

        const approval = {
            Name: orgName,
            docType: 'approval',
            ApprovalStatus: false,
            ApprovalSet: [],
        };

        await ctx.stub.putState(orgName, Buffer.from(JSON.stringify(approval)));
        console.info('============= END : Create Org Approval ===========');
    }
}

module.exports = ApprovalCC;