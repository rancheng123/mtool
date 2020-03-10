var rp = require('request-promise').defaults({
  simple: false,
  resolveWithFullResponse: true
})
global.rp = rp;
const config = require('./configuration');
const logger = require('./logger');
const rpErrors = require('request-promise/errors');
const mainWindow = require('./main-window');
global.mainWindow = mainWindow;

var createServerPrintJob = require('./printer').createServerPrintJob;
global.createServerPrintJob = createServerPrintJob;


