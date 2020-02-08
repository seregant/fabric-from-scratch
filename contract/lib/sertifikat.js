/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('./../ledger-api/state.js');

// Utility class for collections of ledger states --  a state list
const StateList = require('./../ledger-api/statelist.js');

/**
 * CommercialPaper class extends State class
 * Class will be used by application and smart contract to define a paper
 */

class Akta extends State {

    constructor(obj) {
        super(Akta.getClass(), [obj.nomorAkta]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
    */
    
    setCreator(creator) {
        this.creator = creator;
    }

    /**
     * Useful methods to encapsulate commercial paper states
     */

    static fromBuffer(buffer) {
        return Akta.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to commercial paper
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, Akta);
    }

    /**
     * Factory method to create a commercial paper object
     */
    static createInstance(nomorAkta, jenis, nomorHak, nib, penjual, pembeli) {
        return new Akta({ nomorAkta, jenis, nomorHak, nib, penjual, pembeli });
    }

    static getClass() {
        return 'org.atrbpn.akta';
    }
}

class AktaList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.atrbpn.aktalist');
        this.use(Akta);
    }

    async addPaper(paper) {
        return this.addState(paper);
    }

    async getPaper(paperKey) {
        return this.getState(paperKey);
    }

    async updatePaper(paper) {
        return this.updateState(paper);
    }
}

// Enumerate commercial paper state values
const cpState = {
    NORMAL: 1,
    AGUNAN: 2,
    BLOKIR: 3
};

/**
 * CommercialPaper class extends State class
 * Class will be used by application and smart contract to define a paper
 */
class BukuTanah extends State {

    constructor(obj) {
        super(BukuTanah.getClass(), [obj.nomorHak, obj.nib]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
    */
    getPemilik() {
        return this.pemilik;
    }

    setPemilik(newPemilik) {
        this.pemilik = newPemilik;
    }
    
    setCreator(creator) {
        this.creator = creator;
    }

    /**
     * Useful methods to encapsulate commercial paper states
     */
    setNormal() {
        this.currentState = cpState.NORMAL;
    }

    setAgunan() {
        this.currentState = cpState.AGUNAN;
    }

    setBlokir() {
        this.currentState = cpState.BLOKIR;
    }

    isNormal() {
        return this.currentState === cpState.NORMAL;
    }

    isAgunan() {
        return this.currentState === cpState.AGUNAN;
    }

    isBlokir() {
        return this.currentState === cpState.BLOKIR;
    }

    static fromBuffer(buffer) {
        return BukuTanah.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to commercial paper
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, BukuTanah);
    }

    /**
     * Factory method to create a commercial paper object
     */
    static createInstance(nomorHak, nib, pemilik) {
        return new BukuTanah({ nomorHak, nib, pemilik });
    }

    static getClass() {
        return 'org.atrbpn.bukutanah';
    }
}

class BukuTanahList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.atrbpn.bukutanahlist');
        this.use(BukuTanah);
    }

    async addPaper(paper) {
        return this.addState(paper);
    }

    async getPaper(paperKey) {
        return this.getState(paperKey);
    }

    async updatePaper(paper) {
        return this.updateState(paper);
    }
}

module.exports = [Akta, AktaList, BukuTanah, BukuTanahList];
