# Rise Testnet Bot

A command-line tool to automate interactions with the Rise Testnet blockchain. This bot helps users execute various transactions including random transfers, token wrapping/unwrapping, swaps, and Inari Bank deposits/withdrawals.

## 🌟 Features

- **Random Transfers**: Send ETH to randomly generated addresses
- **Gas Pump**: Wrap/unwrap ETH, token approvals, and WETH/USDC swaps
- **Inari Bank**: Supply and withdraw ETH from Inari Bank
- **Proxy Support**: Use proxies for transactions to avoid rate limiting
- **Interactive CLI**: User-friendly command-line interface with colored output

## 📋 Prerequisites

- Node.js (v14+)
- npm or yarn
- Ethereum wallet with Rise Testnet ETH

## 🔧 Installation

Clone the repository:

```bash
git clone https://github.com/Zack914/Rise-Testnet-Bot.git
cd Rise-Testnet-Bot
```

Install the dependencies:

```bash
npm install
```

## ⚙️ Configuration

1. Copy .env file in the project root:

```bash
cp .env.example .env
```

```
PRIVATE_KEY=your_private_key_here
```

2. (Optional) Create a `proxies.txt` file with one proxy per line:

```
http://ip:port
http://ip:port@username:password
```

## 🚀 Usage

Start the bot:

```bash
node index.js
```

### Main Menu

The bot provides an interactive menu with the following options:

1. **Send to Random Addresses**: Automate multiple transfers to random addresses
2. **Gas Pump**: Access token wrap/unwrap and swap functions
3. **Inari Bank**: Supply or withdraw ETH from Inari Bank
4. **Exit**: Close the application

### Gas Pump Menu

1. **Wrap ETH to WETH**: Convert ETH to Wrapped ETH
2. **Unwrap WETH to ETH**: Convert WETH back to ETH
3. **Approve WETH for DODO**: Set token allowances for swaps
4. **Swap WETH to USDC**: Exchange WETH for USDC tokens
5. **Swap USDC to WETH**: Exchange USDC for WETH tokens
6. **Back to main menu**: Return to main options

### Inari Bank Menu

1. **Supply ETH to Inari Bank**: Deposit ETH to Inari Bank
2. **Withdraw ETH from Inari Bank**: Withdraw your ETH from Inari Bank
3. **Back to main menu**: Return to main options

## 📝 Contract Addresses

The bot uses the following contract addresses on Rise Testnet:

- **WrappedTokenGatewayV3**: 0x832e537e88d0e8e5bb4efb735f521a9a0e085e0a
- **WETH**: 0x4200000000000000000000000000000000000006
- **DODOFeeRouteProxy**: 0x8c6DbF95448AcbcBb1c3D6E9b3b9ceF7E6fbAb00
- **USDC**: 0x8A93d247134d91e0de6f96547cB0204e5BE8e5D8

## ⚠️ Disclaimer

This bot is for educational purposes and testing on Rise Testnet only. Do not use it on mainnet or with real funds. Always verify contract addresses and transactions before confirming.
Last updated: Tue Oct 21 12:54:24 UTC 2025