const IS_DEV = process.env.NODE_ENV !== 'production';

const findUp = require('find-up');

if (IS_DEV) {
  require('dotenv').config({ path: findUp.sync('.env') });
}

const { version: VERSION } = require(findUp.sync('package.json'));

////////////// CONFIG VARIABLES //////////////
const SERVER_PORT = process.env.PORT || 3000;
const WEBPACK_PORT = 8080; // For dev environment only
const SLACK_TOKEN = process.env.SLACK_TOKEN;
const ORBS_END_POINTS = JSON.parse(process.env.ORBS_END_POINTS || '[]');

module.exports = {
  IS_DEV,
  VERSION,
  SERVER_PORT,
  WEBPACK_PORT,
  ORBS_END_POINTS,
  SLACK_TOKEN,
};
