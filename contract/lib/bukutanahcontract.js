/*
SPDX-License-Identifier: Apache-2.0
*/

"use strict";

const ab2str = require("arraybuffer-to-string");

// Fabric smart contract classes
const { Contract, Context } = require("fabric-contract-api");

// PaperNet specifc classes
const Akta = require("./akta.js");
const BukuTanah = require("./bukutanah.js");
const BukuTanahList = require("./bukutanahlist.js");
const QueryUtils = require("./query.js");

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
        super("org.atrbpn.bukutanah");
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
        console.log("Instantiate the contract: Buku Tanah");
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
        var paper = await cid.invokeChaincode(
            "aktacontract",
            ["org.atrbpn.akta:query", nomorAkta],
            "bpnchannel"
        );

        console.log("--- received as Buffer ---");
        console.log(paper);

        console.log("--- JSON.stringify(paper.payload) ---");
        var payload = JSON.stringify(paper.payload);
        console.log(payload);

        var json = JSON.parse(payload);
        var strBuf = JSON.stringify(json.buffer); // strBuf = {"type":"Buffer","data":[]}

        var strDirty = Buffer.from(JSON.parse(strBuf)).toString();
        console.log("---- STR DIRTY---");
        console.log(strDirty);
        var found = [], // an array to collect the strings that are found
            rxp = /{([^}]+)}/g,
            curMatch;

        while ((curMatch = rxp.exec(strDirty))) {
            found.push(curMatch[1]);
        }

        var str = "{" + found[0] + "}";

        console.log("--- after regex cleanup ---");
        console.log(JSON.parse(str));

        var akta = JSON.parse(str);
        // baca bukutanah existing
        // agar bukutanah bisa disimpan maka buku tanah harus di create dulu

        var paperKey = BukuTanah.makeKey([akta.nomorHak, akta.nib]);
        // jika data sumber buku tanah kosong maka return value json error
        paper = await ctx.bukutanahList.getPaper(paperKey);
        paper.setPemilik(akta.pembeli);
        paper.setRef(nomorAkta);
        console.log("-- paper console --");
        console.log(paper);
        
        // Add the invoking CN, to the Paper state for reporting purposes later on
        let invokingId = await this.getInvoker(ctx);
        paper.setCreator(invokingId);
        
        await ctx.bukutanahList.updatePaper(paper);
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
    async pembebanan(ctx, nomorAkta) {
        // Use the stub object to invoke other chaincode
        let cid = ctx.stub;
        var paper = await cid.invokeChaincode(
            "aktacontract",
            ["org.atrbpn.akta:query", nomorAkta],
            "bpnchannel"
        );

        console.log("--- received as Buffer ---");
        console.log(paper);

        console.log("--- JSON.stringify(paper.payload) ---");
        var payload = JSON.stringify(paper.payload);
        console.log(payload);

        var json = JSON.parse(payload);
        var strBuf = JSON.stringify(json.buffer); // strBuf = {"type":"Buffer","data":[]}

        var strDirty = Buffer.from(JSON.parse(strBuf)).toString();
        console.log("---- STR DIRTY---");
        console.log(strDirty);
        var found = [], // an array to collect the strings that are found
            rxp = /{([^}]+)}/g,
            curMatch;

        while ((curMatch = rxp.exec(strDirty))) {
            found.push(curMatch[1]);
        }

        var str = "{" + found[0] + "}";

        console.log("--- after regex cleanup ---");
        console.log(JSON.parse(str));

        var akta = JSON.parse(str);
        
        // baca bukutanah existing
        var paperKey = BukuTanah.makeKey([akta.nomorHak, akta.nib]);
        paper = await ctx.bukutanahList.getPaper(paperKey);
        
        // set bukutanah sbg AGUNAN
        paper.setAgunan();
        paper.setRef(nomorAkta);
        console.log("-- paper console --");
        console.log(paper);        
        let invokingId = await this.getInvoker(ctx); // Add the invoking CN, to the Paper state for reporting purposes later on
        paper.setCreator(invokingId);
        await ctx.bukutanahList.updatePaper(paper);
        
        // invoke chaincode untuk create SHT
        var paperSHT = await cid.invokeChaincode(
            "shtcontract",
            ["org.atrbpn.sht:create", 'SHT-' + akta.nomorHak, akta.nomorHak, akta.nib, akta.kreditur, nomorAkta],
            "bpnchannel"
        );
        
        return paper;
    }

    /**
     * Roya terhadap buku tanah yang berstatus AGUNAN
     *
     * @param {Context} ctx the transaction context
     * @param {String} nomor Hak pada buku tanah
     * @param {String} NIB pada buku tanah
     */
    async roya(ctx, nomorHak, nib) {

        // Use the stub object to invoke other chaincode
        let cid = ctx.stub;
        
        // baca bukutanah existing
        var paperKey = BukuTanah.makeKey([nomorHak, nib]);
        var paper = await ctx.bukutanahList.getPaper(paperKey);
        
        // roya hanya bisa dilakukan terhadap buku tanah berstatus AGUNAN
        if (paper.isAgunan()) {
            paper.setNormal();
        } else {
            throw new Error('Buku Tanah dengan nomor ' + nomorHak + ' dan NIB ' + nib + ' berstatus NORMAL. Tidak dapat dilakukan roya.');
        }
        
        // Add the invoking CN, to the Paper state for reporting purposes later on
        let invokingId = await this.getInvoker(ctx);
        paper.setCreator(invokingId);
        
        await ctx.bukutanahList.updatePaper(paper);
        
        // invoke chaincode untuk revoke SHT
        var paperSHT = await cid.invokeChaincode(
            "shtcontract",
            ["org.atrbpn.sht:revoke", nomorHak, nib],
            "bpnchannel"
        );
        
        return paper;
    }
    
    async query(ctx, nomorHak, nib) {
        // Retrieve the current paper using key fields provided
        let paperKey = BukuTanah.makeKey([nomorHak, nib]);
        let paper = await ctx.bukutanahList.getPaper(paperKey);

        return paper;
        //return Buffer.from(JSON.stringify(paper));
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
        let myObj = new QueryUtils(ctx, "org.atrbpn.bukutanahlist");
        let results = await myObj.getHistory(cpKey);
        //console.log('main: queryHist was called and returned ' + JSON.stringify(results) );
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
        
        console.log('--- queryAll ---');
        console.log(queryResults);
        console.log('');
        
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

module.exports = BukuTanahContract;
