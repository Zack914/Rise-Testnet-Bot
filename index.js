require('dotenv').config();
const { showMainMenu } = require('./menus');

async function start() {
  console.log('Starting Rise Testnet Auto Bot...');
  await showMainMenu();
}

start().catch(error => {
  console.error('Startup error:', error.message);
  process.exit(1);
});