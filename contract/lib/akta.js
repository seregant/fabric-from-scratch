/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('./../ledger-api/state.js');

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
    static createInstance(nomorAkta, jenis, nomorHak, nib, penjual, pembeli, kreditur) {
        return new Akta({ nomorAkta, jenis, nomorHak, nib, penjual, pembeli, kreditur });
    }

    static getClass() {
        return 'org.atrbpn.akta';
    }
}

module.exports = Akta;
