/*
SPDX-License-Identifier: Apache-2.0
*/

"use strict";

// Fabric smart contract classes
const { Contract, Context } = require("fabric-contract-api");

// PaperNet specifc classes
const SHT = require("./sht.js");
const SHTList = require("./shtlist.js");
const QueryUtils = require("./query.js");

/**
 * A custom context provides easy access to list of all commercial papers
 */
class SHTContext extends Context {
    constructor() {
        super();
        // All papers are held in a list of papers
        this.shtList = new SHTList(this);
    }
}

/**
 * Define commercial paper smart contract by extending Fabric Contract class
 *
 */
class SHTContract extends Contract {
    constructor() {
        // Unique name when multiple contracts per chaincode file
        super("org.atrbpn.sht");
    }

    /**
     * Define a custom context for commercial paper
     */
    createContext() {
        return new SHTContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log("Instantiate the contract: SHT");
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
    async create(ctx, nomorSHT, nomorHak, nib, pemegangHT, refNomorAkta) {
        // create an instance of the paper
        let paper = SHT.createInstance(nomorSHT, nomorHak, nib, pemegangHT);
        paper.setRef(refNomorAkta);
        paper.setNormal();

        // Add the invoking CN, to the Paper state for reporting purposes later on
        let invokingId = await this.getInvoker(ctx);
        paper.setCreator(invokingId);

        // Add the paper to the list of all similar commercial papers in the ledger world state
        await ctx.shtList.addPaper(paper);

        // Must return a serialized paper to caller of smart contract
        return paper;
    }
    
    /**
     * Revoke status SHT menjadi VOID
     *
     * @param {Context} ctx the transaction context
     * @param {String} nomor SHT
     */
    async revoke(ctx, nomorHak, nib) {

        // dapatkan SHT sesuai nomorHak dan nib
        var queryString = {
            "selector": {
                "nomorHak": nomorHak,
                "nib": nib,
        }};
        var q = await this.queryWithQueryString(ctx, JSON.stringify(queryString));    
        console.log('--- query by nomorHak dan nib ---');
        var json = JSON.parse(q);
        console.log(json);
        console.log(json[0]);
        console.log(json[0].Record.nomorSHT);
        
        var nomorSHT = json[0].Record.nomorSHT;
        
        // ambil records dg cara yang benar
        var paperKey = SHT.makeKey([nomorSHT]);
        var paper = await ctx.shtList.getPaper(paperKey);
        
        // revoke hanya bisa dilakukan jika status SHT == NORMAL
        if (paper.isNormal()) {
            paper.setVoid();
        } else {
            throw new Error('SHT ' + q.nomorSHT + ' sudah berstatus VOID');
        }
        
        // Add the invoking CN, to the Paper state for reporting purposes later on
        let invokingId = await this.getInvoker(ctx);
        paper.creator = invokingId;
        
        // Update the paper
        await ctx.shtList.updatePaper(paper);
        return paper;
    }

    async query(ctx, nomorSHT) {
        // Retrieve the current paper using key fields provided
        let paperKey = SHT.makeKey([nomorSHT]);
        let paper = await ctx.shtList.getPaper(paperKey);

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
    async queryHist(ctx, nomorSHT) {
        // Get a key to be used for History query
        let cpKey = SHT.makeKey([nomorSHT]);
        let myObj = new QueryUtils(ctx, "org.atrbpn.shtlist");
        let results = await myObj.getHistory(cpKey);
        //console.log('main: queryHist was called and returned ' + JSON.stringify(results) );
        return results;
    }

    /**
     * queryOwner commercial paper
     * @param {Context} ctx the transaction context
     * @param {String} issuer commercial paper issuer
     * @param {Integer} paperNumber paper number for this issuer
     */
    async queryNomorHak(ctx, nomorHak) {
        let myObj = new QueryUtils(ctx, "org.atrbpn.shtlist");
        let results = await myObj.queryKeyByNomorHak(nomorHak);

        return results;
    }
    
    /**
     * Query all records from world state
     *
     * @param {Context} ctx the transaction context
    */
    async queryAll(ctx) {

        let queryString = {
            "selector": {}
        };

        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;

    }    

    /**
     * Evaluate a queryString
     *
     * @param {Context} ctx the transaction context
     * @param {String} queryString the query string to be evaluated
    */    
    async queryWithQueryString(ctx, queryString) {

        console.log("query String");
        console.log(JSON.stringify(queryString));

        let resultsIterator = await ctx.stub.getQueryResult(queryString);
        
        let allResults = [];

        while (true) {
            let res = await resultsIterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};

                console.log(res.value.value.toString('utf8'));

                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }

                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                console.log(JSON.stringify(allResults));
                return JSON.stringify(allResults);
            }
        }

    }    
    
}

module.exports = SHTContract;
