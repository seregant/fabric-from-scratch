/*
SPDX-License-Identifier: Apache-2.0
*/

"use strict";

// Utility class for ledger state
const State = require("./../ledger-api/state.js");

// Enumerate commercial paper state values
const shtState = {
    NORMAL: 1,
    VOID: 9
};

/**
 * CommercialPaper class extends State class
 * Class will be used by application and smart contract to define a paper
 */
class SHT extends State {
    constructor(obj) {
        super(SHT.getClass(), [obj.nomorSHT]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
     */

    setCreator(creator) {
        this.creator = creator;
    }
    
    setRef(nomorAkta) {
        this.refNomorAkta = nomorAkta;
    }

    /**
     * Useful methods to encapsulate commercial paper states
     */

    setNormal() {
        this.currentState = shtState.NORMAL;
    }

    setVoid() {
        this.currentState = shtState.VOID;
    }

    isNormal() {
        return this.currentState === shtState.NORMAL;
    }

    isVoid() {
        return this.currentState === shtState.VOID;
    }

    static fromBuffer(buffer) {
        return SHT.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to commercial paper
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, SHT);
    }

    /**
     * Factory method to create a commercial paper object
     */
    static createInstance(nomorSHT, nomorHak, nib, pemegangHT) {
        return new SHT({ nomorSHT, nomorHak, nib, pemegangHT });
    }

    static getClass() {
        return "org.atrbpn.sht";
    }
}

module.exports = SHT;
