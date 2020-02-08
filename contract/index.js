/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const contractBukuTanah = require('./lib/bukutanahcontract.js');
const contractAkta = require('./lib/aktacontract.js');
const contractSHT = require('./lib/shtcontract.js');

module.exports.contracts = [contractBukuTanah, contractAkta, contractSHT];

// end of file