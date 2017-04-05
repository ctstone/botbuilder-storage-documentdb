const path = require('path');
const jasmineReporters = require('jasmine-reporters');

jasmine.getEnv().addReporter(new jasmineReporters.NUnitXmlReporter({
  savePath: process.env.COMMON_TESTRESULTSDIRECTORY || path.resolve(__dirname, '..', '..'),
}));