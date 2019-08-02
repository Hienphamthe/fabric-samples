'use strict';

const { Contract } = require('fabric-contract-api');

class ApprovalCC extends Contract {
    async init(ctx) {
        console.info('============= START : Initialize Approval Ledger ===========');
        const approvals = [
            {
                Name: "Org1",
                ApprovalStatus: false,
                ApprovalSet: []
            },
            {
                Name: "Org2",
                ApprovalStatus: false,
                ApprovalSet: []
            },
            {
                Name: "Org3",
                ApprovalStatus: false,
                ApprovalSet: []
            },
        ]

        for (let i = 0; i < approvals.length; i++) {
            approvals[i].docType = 'approval';
            await ctx.stub.putState('Approval' + i, Buffer.from(JSON.stringify(approvals[i])));
            console.info('Added <--> ', approvals[i]);
        }
        console.info('============= END : Initialize Approval Ledger ===========');
    }

    async getAllAppoval(ctx) {
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
                return JSON.stringify(allResults);
            }
        }
    }

    async getOrgAppoval(ctx, org) {
        const orgKey = `Approval${org}`
        const approvalAsBytes = await ctx.stub.getState(orgKey);
        if (!approvalAsBytes || approvalAsBytes.length === 0) {
            throw new Error(`${orgKey} does not exist`);
        }
        console.log(approvalAsBytes.toString());
        return approvalAsBytes.toString();
    }

    async setOrgApproval(ctx, org, status, changingSet) {
        console.info('============= START : set Org pproval ===========');

        const orgKey = `Approval${org}`
        const approvalAsBytes = await ctx.stub.getState(orgKey);
        if (!approvalAsBytes || approvalAsBytes.length === 0) {
            throw new Error(`${orgKey} does not exist`);
        }
        const approval = JSON.parse(approvalAsBytes.toString());
        if (approval.ApprovalStatus == status) {
            approval.ApprovalStatus = Boolean(status)
            let approvalSet = changingSet.split(",")
            approvalSet.forEach(eachApproval => approval.ApprovalSet.push(eachApproval))
        } else {
            approval.ApprovalStatus = Boolean(status)
            approval.ApprovalSet = [];
        }
        
        console.log(`Approval changed: ${JSON.stringify(approval)}`)
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