/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('./../ledger-api/statelist.js');

const BukuTanah = require('./bukutanah.js');

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


module.exports = BukuTanahList;