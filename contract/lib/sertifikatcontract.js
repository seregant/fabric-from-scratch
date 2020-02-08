/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// PaperNet specifc classes
const { Akta, AktaList, BukuTanah, BukuTanahList } = require('./sertifikat.js');
const QueryUtils = require('./query.js');

/**
 * A custom context provides easy access to list of all commercial papers
 */
class AktaContext extends Context {

    constructor() {
        super();
        // All papers are held in a list of papers
        this.aktaList = new AktaList(this);
    }

}

/**
 * Define commercial paper smart contract by extending Fabric Contract class
 *
 */
class AktaContract extends Contract {

    constructor() {
        // Unique name when multiple contracts per chaincode file
        super('org.atrbpn.akta');
    }

    /**
     * Define a custom context for commercial paper
    */
    createContext() {
        return new AktaContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract: Akta');
    }

    /**
     * Issue commercial paper
     *
     * @param {Context} ctx the transaction context
     * @param {String} issuer commercial paper issuer
     * @param {Integer} paperNumber paper number for this issuer
     * @param {String} issueDateTime paper issue date
     * @param {String} maturityDateTime paper maturity date
     * @param {Integer} faceValue face value of paper
    */
    async create(ctx, nomorAkta, jenis, nomorHak, nib, penjual, pembeli) {

        // create an instance of the paper
        let paper = Akta.createInstance(nomorAkta, jenis, nomorHak, nib, penjual, pembeli);
        
        // Add the invoking CN, to the Paper state for reporting purposes later on
        let invokingId = await this.getInvoker(ctx);
        paper.setCreator(invokingId);

        // Add the paper to the list of all similar commercial papers in the ledger world state
        await ctx.aktaList.addPaper(paper);

        // Must return a serialized paper to caller of smart contract
        return paper;
    }

    async queryByNomorAkta(ctx, nomorAkta) {

        // Retrieve the current paper using key fields provided
        let paperKey = Akta.makeKey([nomorAkta]);
        let paper = await ctx.aktaList.getPaper(paperKey);

        return paper;
    }
    
    /**
    * grab the invoking CN from the X509 transactor cert
    * @param {Context} ctx the transaction context
    */

    async getInvoker(ctx) {

        // Use the Client Identity object to get the invoker info.
        let cid = ctx.clientIdentity;
        let id = cid.getID(); // X509 Certificate invoker is in CN form
        let CN = id.substring(id.indexOf("CN=") + 3, id.lastIndexOf("::"));
        return CN;
    }

    /**
    * queryHist commercial paper
    * @param {Context} ctx the transaction context
    * @param {String} issuer commercial paper issuer
    * @param {Integer} paperNumber paper number for this issuer
    */
    async queryHist(ctx, nomorAkta) {

        // Get a key to be used for History query
        let cpKey = Akta.makeKey([nomorAkta]);
        let myObj = new QueryUtils(ctx, 'org.atrbpn.aktalist');
        let results = await myObj.getHistory(cpKey);
        //console.log('main: queryHist was called and returned ' + JSON.stringify(results) );
        return results;

    }

}

/**
 * A custom context provides easy access to list of all commercial papers
 */
class BukuTanahContext extends Context {

    constructor() {
        super();
        // All papers are held in a list of papers
        this.bukutanahList = new BukuTanahList(this);
    }

}

/**
 * Define commercial paper smart contract by extending Fabric Contract class
 *
 */
class BukuTanahContract extends Contract {

    constructor() {
        // Unique name when multiple contracts per chaincode file
        super('org.atrbpn.bukutanah');
    }

    /**
     * Define a custom context for commercial paper
    */
    createContext() {
        return new BukuTanahContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract: Buku Tanah');
    }

    /**
     * Issue commercial paper
     *
     * @param {Context} ctx the transaction context
     * @param {String} issuer commercial paper issuer
     * @param {Integer} paperNumber paper number for this issuer
     * @param {String} issueDateTime paper issue date
     * @param {String} maturityDateTime paper maturity date
     * @param {Integer} faceValue face value of paper
    */
    async create(ctx, nomorHak, nib, pemilik) {

        // create an instance of the paper
        let paper = BukuTanah.createInstance(nomorHak, nib, pemilik);

        // Smart contract, rather than paper, moves paper into NORMAL state
        paper.setNormal();

        // Newly issued paper is owned by pemilik
        paper.setPemilik(pemilik);
        
        // Add the invoking CN, to the Paper state for reporting purposes later on
        let invokingId = await this.getInvoker(ctx);
        paper.setCreator(invokingId);

        // Add the paper to the list of all similar commercial papers in the ledger world state
        await ctx.bukutanahList.addPaper(paper);

        // Must return a serialized paper to caller of smart contract
        return paper;
    }

    /**
     * Buy commercial paper
     *
     * @param {Context} ctx the transaction context
     * @param {String} issuer commercial paper issuer
     * @param {Integer} paperNumber paper number for this issuer
     * @param {String} currentOwner current owner of paper
     * @param {String} newOwner new owner of paper
     * @param {Integer} price price paid for this paper
     * @param {String} purchaseDateTime time paper was purchased (i.e. traded)
    */
    async peralihan(ctx, nomorAkta) {

        // Use the stub object to invoke other chaincode
        let cid = ctx.stub;
        let paper = cid.invokeChaincode('aktacontract', ['query', nomorAkta], 'bpnchannel');
        
        // Update the paper
        //await ctx.bukutanahList.updatePaper(paper);
        return paper;
    }

    /**
    * grab the invoking CN from the X509 transactor cert
    * @param {Context} ctx the transaction context
    */

    async getInvoker(ctx) {

        // Use the Client Identity object to get the invoker info.
        let cid = ctx.clientIdentity;
        let id = cid.getID(); // X509 Certificate invoker is in CN form
        let CN = id.substring(id.indexOf("CN=") + 3, id.lastIndexOf("::"));
        return CN;
    }

    /**
    * queryHist commercial paper
    * @param {Context} ctx the transaction context
    * @param {String} issuer commercial paper issuer
    * @param {Integer} paperNumber paper number for this issuer
    */
    async queryHist(ctx, nomorHak, nib) {

        // Get a key to be used for History query
        let cpKey = BukuTanah.makeKey([nomorHak, nib]);
        let myObj = new QueryUtils(ctx, 'org.atrbpn.bukutanahlist');
        let results = await myObj.getHistory(cpKey);
        //console.log('main: queryHist was called and returned ' + JSON.stringify(results) );
        return results;

    }

}

module.exports = [AktaContract, BukuTanahContract];
