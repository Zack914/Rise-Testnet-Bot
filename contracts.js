const ethers = require('ethers');
const chalk = require('chalk');
const { network, CONTRACT_ADDRESSES, WrappedTokenGatewayV3ABI, WETH_ABI, USDC_ABI, DODOFeeRouteProxyABI } = require('./config');
const { showSpinner, confirmTransaction, rl } = require('./utils');

function generateRandomAddress() {
  const wallet = ethers.Wallet.createRandom();
  return wallet.address;
}

async function sendToRandomAddress(wallet, amount, skipConfirmation = false) {
  try {
    const toAddress = generateRandomAddress();
    const amountWei = ethers.utils.parseEther(amount.toString());
    const gasPrice = await wallet.provider.getGasPrice();
    const estimatedGas = 21000;
    const gasCost = ethers.utils.formatEther(gasPrice.mul(estimatedGas));
    
    if (!skipConfirmation) {
      const confirmed = await confirmTransaction({
        Action: 'Transfer',
        Amount: `${amount} ${network.symbol}`,
        To: toAddress.slice(0, 6) + '...' + toAddress.slice(-4),
        'Est. Gas': `${gasCost} ${network.symbol}`
      });
      
      if (!confirmed) {
        console.log(chalk.red('Transaction canceled. 🚫'));
        return null;
      }
    }
    
    console.log(chalk.yellow(`Sending ${amount} ${network.symbol} to random address: ${chalk.cyan(toAddress)} 📤`));
    
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountWei,
      gasLimit: estimatedGas
    });
    
    console.log(chalk.white(`Transaction sent! Hash: ${chalk.cyan(tx.hash)} 🚀`));
    console.log(chalk.gray(`View on explorer: ${network.explorer}/tx/${tx.hash} 🔗`));
    
    const stopSpinner = showSpinner('Waiting for confirmation...');
    const receipt = await tx.wait();
    stopSpinner();
    
    console.log(chalk.green(`Transaction confirmed in block ${receipt.blockNumber} ✅`));
    
    return { receipt, toAddress };
  } catch (error) {
    console.error(chalk.red(`Error sending ${network.symbol}:`, error.message, '❌'));
    return null;
  }
}

async function executeRandomTransfers(wallet, returnMenuCallback) {
  try {
    console.log(chalk.white('\n===== RANDOM TRANSFERS ====='));
    rl.question(chalk.yellow(`Enter amount of ${network.symbol} to send in each transfer: `), async (amountStr) => {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        console.log(chalk.red('Invalid amount. Please enter a positive number. ⚠️'));
        return executeRandomTransfers(wallet, returnMenuCallback);
      }
      rl.question(chalk.yellow('Enter number of transfers to make: '), async (countStr) => {
        const count = parseInt(countStr);
        if (isNaN(count) || count <= 0) {
          console.log(chalk.red('Invalid count. Please enter a positive integer. ⚠️'));
          return executeRandomTransfers(wallet, returnMenuCallback);
        }

        console.log(chalk.yellow(`Preparing ${count} random transfers of ${amount} ${network.symbol} each... 🚀`));
        
        const gasPrice = await wallet.provider.getGasPrice();
        const estimatedGas = 21000;
        const gasCost = ethers.utils.formatEther(gasPrice.mul(estimatedGas).mul(count));
        
        const confirmed = await confirmTransaction({
          Action: 'Batch Transfer',
          'Total Amount': `${(amount * count).toFixed(4)} ${network.symbol}`,
          Transfers: count,
          'Est. Gas': `${gasCost} ${network.symbol}`
        });
        
        if (!confirmed) {
          console.log(chalk.red('Transaction canceled. 🚫'));
          console.log(chalk.white('===== BATCH TRANSFER CANCELED =====\n'));
          rl.question(chalk.yellow('Press Enter to return to the main menu...'), async () => {
            console.clear();
            await returnMenuCallback();
          });
          return;
        }
        
        console.log(chalk.yellow(`Starting ${count} transfers...\n`));
        
        const results = [];
        
        for (let i = 0; i < count; i++) {
          console.log(chalk.white(`\nTransfer ${i + 1}/${count}`));
          const result = await sendToRandomAddress(wallet, amount, true);
          
          if (result) {
            results.push(result);
          }
          
          if (i < count - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        console.log(chalk.green(`\nCompleted ${results.length}/${count} transfers successfully. 🎉`));
        console.log(chalk.white('===== BATCH TRANSFER COMPLETED =====\n'));
        
        rl.question(chalk.yellow('Press Enter to return to the main menu...'), async () => {
          console.clear();
          await returnMenuCallback();
        });
      });
    });
  } catch (error) {
    console.error(chalk.red('Error in batch transfer:', error.message, '❌'));
    console.log(chalk.white('===== BATCH TRANSFER FAILED =====\n'));
    rl.question(chalk.yellow('Press Enter to return to the main menu...'), async () => {
      console.clear();
      await returnMenuCallback();
    });
  }
}

async function depositETHToGateway(wallet, returnMenuCallback) {
  try {
    console.log(chalk.yellow('WARNING: Verify WrappedTokenGatewayV3 address for Rise Testnet before proceeding.'));
    console.log(chalk.white('\n===== SUPPLY ETH TO INARI BANK ====='));
    rl.question(chalk.yellow('Enter amount of ETH to supply: '), async (amountStr) => {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        console.log(chalk.red('Invalid amount. Please enter a positive number. ⚠️'));
        return depositETHToGateway(wallet, returnMenuCallback);
      }

      const amountWei = ethers.utils.parseEther(amount.toString());
      const gasPrice = await wallet.provider.getGasPrice();
      const estimatedGas = 310079;
      const gasCost = ethers.utils.formatEther(gasPrice.mul(estimatedGas));
      
      const confirmed = await confirmTransaction({
        Action: 'Supply ETH',
        Amount: `${amount} ETH`,
        'Est. Gas': `${gasCost} ETH`
      });
      
      if (!confirmed) {
        console.log(chalk.red('Transaction canceled. 🚫'));
        console.log(chalk.white('===== SUPPLY CANCELED =====\n'));
        return;
      }
      
      const gatewayContract = new ethers.Contract(
        CONTRACT_ADDRESSES.WrappedTokenGatewayV3,
        WrappedTokenGatewayV3ABI,
        wallet
      );
      
      console.log(chalk.yellow(`Supplying ${amount} ETH to Inari Bank...`));
      
      const tx = await gatewayContract.depositETH(
        '0x81edb206Fd1FB9dC517B61793AaA0325c8d11A23',
        wallet.address,
        0,
        {
          value: amountWei,
          gasLimit: estimatedGas,
          maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei'),
          maxFeePerGas: ethers.utils.parseUnits('1.500000008', 'gwei')
        }
      );
      
      console.log(chalk.white(`Transaction sent! Hash: ${chalk.cyan(tx.hash)} 📤`));
      console.log(chalk.gray(`View on explorer: ${network.explorer}/tx/${tx.hash} 🔗`));
      
      const stopSpinner = showSpinner('Waiting for confirmation...');
      const receipt = await tx.wait();
      stopSpinner();
      
      console.log(chalk.green(`Transaction confirmed in block ${receipt.blockNumber} ✅`));
      console.log(chalk.green(`Successfully supplied ${amount} ETH! 🎉`));
      console.log(chalk.white('===== SUPPLY COMPLETED =====\n'));
      
      rl.question(chalk.yellow('Press Enter to return to the Inari Bank menu...'), async () => {
        console.clear();
        await returnMenuCallback();
      });
    });
  } catch (error) {
    console.error(chalk.red('Error supplying ETH:', error.message, '❌'));
    console.log(chalk.white('===== SUPPLY FAILED =====\n'));
    rl.question(chalk.yellow('Press Enter to return to the Inari Bank menu...'), async () => {
      console.clear();
      await returnMenuCallback();
    });
  }
}

async function withdrawETHFromGateway(wallet, returnMenuCallback) {
  try {
    console.log(chalk.yellow('WARNING: Verify WrappedTokenGatewayV3 address for Rise Testnet before proceeding.'));
    console.log(chalk.white('\n===== WITHDRAW ETH FROM INARI BANK ====='));
    rl.question(chalk.yellow('Enter amount of ETH to withdraw: '), async (amountStr) => {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        console.log(chalk.red('Invalid amount. Please enter a positive number. ⚠️'));
        return withdrawETHFromGateway(wallet, returnMenuCallback);
      }

      const amountWei = ethers.utils.parseEther(amount.toString());
      const gasPrice = await wallet.provider.getGasPrice();
      const estimatedGas = 310079;
      const gasCost = ethers.utils.formatEther(gasPrice.mul(estimatedGas));
      
      const confirmed = await confirmTransaction({
        Action: 'Withdraw ETH',
        Amount: `${amount} ETH`,
        'Est. Gas': `${gasCost} ETH`
      });
      
      if (!confirmed) {
        console.log(chalk.red('Transaction canceled. 🚫'));
        console.log(chalk.white('===== WITHDRAW CANCELED =====\n'));
        return;
      }
      
      const gatewayContract = new ethers.Contract(
        CONTRACT_ADDRESSES.WrappedTokenGatewayV3,
        WrappedTokenGatewayV3ABI,
        wallet
      );
      
      console.log(chalk.yellow(`Withdrawing ${amount} ETH from Inari Bank...`));
      
      const tx = await gatewayContract.withdrawETH(
        '0x81edb206Fd1FB9dC517B61793AaA0325c8d11A23',
        amountWei,
        wallet.address,
        {
          gasLimit: estimatedGas,
          maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei'),
          maxFeePerGas: ethers.utils.parseUnits('1.500000008', 'gwei')
        }
      );
      
      console.log(chalk.white(`Transaction sent! Hash: ${chalk.cyan(tx.hash)} 📤`));
      console.log(chalk.gray(`View on explorer: ${network.explorer}/tx/${tx.hash} 🔗`));
      
      const stopSpinner = showSpinner('Waiting for confirmation...');
      const receipt = await tx.wait();
      stopSpinner();
      
      console.log(chalk.green(`Transaction confirmed in block ${receipt.blockNumber} ✅`));
      console.log(chalk.green(`Successfully withdrew ${amount} ETH! 🎉`));
      console.log(chalk.white('===== WITHDRAW COMPLETED =====\n'));
      
      rl.question(chalk.yellow('Press Enter to return to the Inari Bank menu...'), async () => {
        console.clear();
        await returnMenuCallback();
      });
    });
  } catch (error) {
    console.error(chalk.red('Error withdrawing ETH:', error.message, '❌'));
    console.log(chalk.white('===== WITHDRAW FAILED =====\n'));
    rl.question(chalk.yellow('Press Enter to return to the Inari Bank menu...'), async () => {
      console.clear();
      await returnMenuCallback();
    });
  }
}

async function wrapETH(wallet, returnMenuCallback) {
  try {
    console.log(chalk.white('\n===== WRAP ETH TO WETH ====='));
    rl.question(chalk.yellow('Enter amount of ETH to wrap: '), async (amountStr) => {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        console.log(chalk.red('Invalid amount. Please enter a positive number. ⚠️'));
        return wrapETH(wallet, returnMenuCallback);
      }

      const amountWei = ethers.utils.parseEther(amount.toString());
      const gasPrice = await wallet.provider.getGasPrice();
      const estimatedGas = 95312;
      const gasCost = ethers.utils.formatEther(gasPrice.mul(estimatedGas));
      
      const confirmed = await confirmTransaction({
        Action: 'Wrap ETH',
        Amount: `${amount} ETH`,
        'Est. Gas': `${gasCost} ETH`
      });
      
      if (!confirmed) {
        console.log(chalk.red('Transaction canceled. 🚫'));
        console.log(chalk.white('===== WRAP CANCELED =====\n'));
        return;
      }
      
      const wethContract = new ethers.Contract(
        CONTRACT_ADDRESSES.WETH,
        WETH_ABI,
        wallet
      );
      
      console.log(chalk.yellow(`Wrapping ${amount} ETH to WETH...`));
      
      const tx = await wethContract.deposit({
        value: amountWei,
        gasLimit: estimatedGas,
        maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('1.500000008', 'gwei')
      });
      
      console.log(chalk.white(`Transaction sent! Hash: ${chalk.cyan(tx.hash)} 📤`));
      console.log(chalk.gray(`View on explorer: ${network.explorer}/tx/${tx.hash} 🔗`));
      
      const stopSpinner = showSpinner('Waiting for confirmation...');
      const receipt = await tx.wait();
      stopSpinner();
      
      console.log(chalk.green(`Transaction confirmed in block ${receipt.blockNumber} ✅`));
      console.log(chalk.green(`Successfully wrapped ${amount} ETH to WETH! 🎉`));
      console.log(chalk.white('===== WRAP COMPLETED =====\n'));
      
      rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
        console.clear();
        await returnMenuCallback();
      });
    });
  } catch (error) {
    console.error(chalk.red('Error wrapping ETH:', error.message, '❌'));
    console.log(chalk.white('===== WRAP FAILED =====\n'));
    rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
      console.clear();
      await returnMenuCallback();
    });
  }
}

async function unwrapWETH(wallet, returnMenuCallback) {
  try {
    console.log(chalk.white('\n===== UNWRAP WETH TO ETH ====='));
    rl.question(chalk.yellow('Enter amount of WETH to unwrap: '), async (amountStr) => {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        console.log(chalk.red('Invalid amount. Please enter a positive number. ⚠️'));
        return unwrapWETH(wallet, returnMenuCallback);
      }

      const amountWei = ethers.utils.parseEther(amount.toString());
      const gasPrice = await wallet.provider.getGasPrice();
      const estimatedGas = 95312;
      const gasCost = ethers.utils.formatEther(gasPrice.mul(estimatedGas));
      
      const wethContract = new ethers.Contract(CONTRACT_ADDRESSES.WETH, WETH_ABI, wallet);
      const wethBalance = await wethContract.balanceOf(wallet.address);
      if (wethBalance.lt(amountWei)) {
        console.log(chalk.red(`Insufficient WETH balance. Available: ${ethers.utils.formatEther(wethBalance)}, Required: ${amount} WETH`));
        rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
          console.clear();
          await returnMenuCallback();
        });
        return;
      }
      
      const confirmed = await confirmTransaction({
        Action: 'Unwrap WETH',
        Amount: `${amount} WETH`,
        'Est. Gas': `${gasCost} ETH`
      });
      
      if (!confirmed) {
        console.log(chalk.red('Transaction canceled. 🚫'));
        console.log(chalk.white('===== UNWRAP CANCELED =====\n'));
        return;
      }
      
      console.log(chalk.yellow(`Unwrapping ${amount} WETH to ETH...`));
      
      const tx = await wethContract.withdraw(amountWei, {
        gasLimit: estimatedGas,
        maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('1.500000008', 'gwei')
      });
      
      console.log(chalk.white(`Transaction sent! Hash: ${chalk.cyan(tx.hash)} 📤`));
      console.log(chalk.gray(`View on explorer: ${network.explorer}/tx/${tx.hash} 🔗`));
      
      const stopSpinner = showSpinner('Waiting for confirmation...');
      const receipt = await tx.wait();
      stopSpinner();
      
      console.log(chalk.green(`Transaction confirmed in block ${receipt.blockNumber} ✅`));
      console.log(chalk.green(`Successfully unwwrapped ${amount} WETH to ETH! 🎉`));
      console.log(chalk.white('===== UNWRAP COMPLETED =====\n'));
      
      rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
        console.clear();
        await returnMenuCallback();
      });
    });
  } catch (error) {
    console.error(chalk.red('Error unwrapping WETH:', error.message, '❌'));
    console.log(chalk.white('===== UNWRAP FAILED =====\n'));
    rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
      console.clear();
      await returnMenuCallback();
    });
  }
}

async function ensureTokenAllowance(wallet, tokenAddress, tokenABI, amountWei, spender, tokenSymbol) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
    const allowance = await tokenContract.allowance(wallet.address, spender);
    
    if (allowance.lt(amountWei)) {
      console.log(chalk.yellow(`Insufficient ${tokenSymbol} allowance. Current: ${ethers.utils.formatUnits(allowance, tokenSymbol === 'WETH' ? 18 : 6)}, Required: ${ethers.utils.formatUnits(amountWei, tokenSymbol === 'WETH' ? 18 : 6)}`));
      const gasPrice = await wallet.provider.getGasPrice();
      const estimatedGas = 100000;
      const gasCost = ethers.utils.formatEther(gasPrice.mul(estimatedGas));
      
      const confirmed = await confirmTransaction({
        Action: `Approve ${tokenSymbol}`,
        Amount: `${ethers.utils.formatUnits(amountWei, tokenSymbol === 'WETH' ? 18 : 6)} ${tokenSymbol}`,
        Spender: spender,
        'Est. Gas': `${gasCost} ETH`
      });
      
      if (!confirmed) {
        console.log(chalk.red('Approval canceled. 🚫'));
        return false;
      }
      
      console.log(chalk.yellow(`Approving ${ethers.utils.formatUnits(amountWei, tokenSymbol === 'WETH' ? 18 : 6)} ${tokenSymbol} for ${spender}...`));
      const tx = await tokenContract.approve(spender, amountWei, {
        gasLimit: estimatedGas,
        maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('1.500000008', 'gwei')
      });
      
      console.log(chalk.white(`Approval tx sent! Hash: ${chalk.cyan(tx.hash)} 📤`));
      const stopSpinner = showSpinner('Waiting for approval confirmation...');
      const receipt = await tx.wait();
      stopSpinner();
      
      console.log(chalk.green(`Approval confirmed in block ${receipt.blockNumber} ✅`));
    }
    return true;
  } catch (error) {
    console.error(chalk.red(`Error checking/approving ${tokenSymbol} allowance:`, error.message, '❌'));
    return false;
  }
}

async function approveWETH(wallet, returnMenuCallback) {
  try {
    console.log(chalk.white('\n===== APPROVE WETH ====='));
    rl.question(chalk.yellow('Enter amount of WETH to approve for DODO: '), async (amountStr) => {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        console.log(chalk.red('Invalid amount. Please enter a positive number. ⚠️'));
        return approveWETH(wallet, returnMenuCallback);
      }

      const amountWei = ethers.utils.parseEther(amount.toString());
      const gasPrice = await wallet.provider.getGasPrice();
      const estimatedGas = 100000;
      const gasCost = ethers.utils.formatEther(gasPrice.mul(estimatedGas));
      
      const confirmed = await confirmTransaction({
        Action: 'Approve WETH',
        Amount: `${amount} WETH`,
        'Est. Gas': `${gasCost} ETH`
      });
      
      if (!confirmed) {
        console.log(chalk.red('Transaction canceled. 🚫'));
        console.log(chalk.white('===== APPROVE CANCELED =====\n'));
        return;
      }
      
      const wethContract = new ethers.Contract(
        CONTRACT_ADDRESSES.WETH,
        WETH_ABI,
        wallet
      );
      
      console.log(chalk.yellow(`Approving ${amount} WETH for DODOFeeRouteProxy...`));
      
      const tx = await wethContract.approve(
        CONTRACT_ADDRESSES.DODOFeeRouteProxy,
        amountWei,
        {
          gasLimit: estimatedGas,
          maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei'),
          maxFeePerGas: ethers.utils.parseUnits('1.500000008', 'gwei')
        }
      );
      
      console.log(chalk.white(`Transaction sent! Hash: ${chalk.cyan(tx.hash)} 📤`));
      console.log(chalk.gray(`View on explorer: ${network.explorer}/tx/${tx.hash} 🔗`));
      
      const stopSpinner = showSpinner('Waiting for confirmation...');
      const receipt = await tx.wait();
      stopSpinner();
      
      console.log(chalk.green(`Transaction confirmed in block ${receipt.blockNumber} ✅`));
      console.log(chalk.green(`Successfully approved ${amount} WETH! 🎉`));
      console.log(chalk.white('===== APPROVE COMPLETED =====\n'));
      
      rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
        console.clear();
        await returnMenuCallback();
      });
    });
  } catch (error) {
    console.error(chalk.red('Error approving WETH:', error.message, '❌'));
    console.log(chalk.white('===== APPROVE FAILED =====\n'));
    rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
      console.clear();
      await returnMenuCallback();
    });
  }
}

async function swapWETHtoUSDC(wallet, returnMenuCallback) {
  try {
    console.log(chalk.white('\n===== SWAP WETH TO USDC ====='));
    rl.question(chalk.yellow('Enter amount of WETH to swap: '), async (amountStr) => {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        console.log(chalk.red('Invalid amount. Please enter a positive number. ⚠️'));
        return swapWETHtoUSDC(wallet, returnMenuCallback);
      }

      const amountWei = ethers.utils.parseEther(amount.toString());
      const gasPrice = await wallet.provider.getGasPrice();
      const estimatedGas = 300000;
      const gasCost = ethers.utils.formatEther(gasPrice.mul(estimatedGas));
      
      const wethContract = new ethers.Contract(CONTRACT_ADDRESSES.WETH, WETH_ABI, wallet);
      const wethBalance = await wethContract.balanceOf(wallet.address);
      if (wethBalance.lt(amountWei)) {
        console.log(chalk.red(`Insufficient WETH balance. Available: ${ethers.utils.formatEther(wethBalance)}, Required: ${amount} WETH`));
        rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
          console.clear();
          await returnMenuCallback();
        });
        return;
      }
      
      const usdcPerWeth = 1071.568;
      const expReturnAmount = ethers.utils.parseUnits((amount * usdcPerWeth).toFixed(6), 6);
      const minReturnAmount = ethers.utils.parseUnits((amount * usdcPerWeth * 0.968).toFixed(6), 6);
      
      const confirmed = await confirmTransaction({
        Action: 'Swap WETH to USDC',
        'WETH Amount': `${amount} WETH`,
        'Exp. USDC': `${ethers.utils.formatUnits(expReturnAmount, 6)} USDC`,
        'Min. USDC': `${ethers.utils.formatUnits(minReturnAmount, 6)} USDC`,
        'Est. Gas': `${gasCost} ETH`
      });
      
      if (!confirmed) {
        console.log(chalk.red('Transaction canceled. 🚫'));
        console.log(chalk.white('===== SWAP CANCELED =====\n'));
        rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
          console.clear();
          await returnMenuCallback();
        });
        return;
      }
      
      const allowanceOk = await ensureTokenAllowance(
        wallet,
        CONTRACT_ADDRESSES.WETH,
        WETH_ABI,
        amountWei,
        CONTRACT_ADDRESSES.DODOFeeRouteProxy,
        'WETH'
      );
      if (!allowanceOk) {
        console.log(chalk.red('Cannot proceed with swap due to allowance issue. 🚫'));
        rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
          console.clear();
          await returnMenuCallback();
        });
        return;
      }
      
      const dodoContract = new ethers.Contract(
        CONTRACT_ADDRESSES.DODOFeeRouteProxy,
        DODOFeeRouteProxyABI,
        wallet
      );
      
      console.log(chalk.yellow(`Swapping ${amount} WETH to USDC...`));
      
      const mixAdapters = ['0x0f9053E174c123098C17e60A2B1FAb3b303f9e29'];
      const mixPairs = ['0xc7E2B7C2519bB911bA4a1eeE246Cb05ACb0b1df1'];
      const assetTo = [
        '0xc7E2B7C2519bB911bA4a1eeE246Cb05ACb0b1df1',
        CONTRACT_ADDRESSES.DODOFeeRouteProxy
      ];
      const directions = 0;
      const moreInfos = ['0x00'];
      const feeData = '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      try {
        const tx = await dodoContract.mixSwap(
          CONTRACT_ADDRESSES.WETH,
          CONTRACT_ADDRESSES.USDC,
          amountWei,
          expReturnAmount,
          minReturnAmount,
          mixAdapters,
          mixPairs,
          assetTo,
          directions,
          moreInfos,
          feeData,
          deadline,
          {
            gasLimit: estimatedGas,
            maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei'),
            maxFeePerGas: ethers.utils.parseUnits('1.500000008', 'gwei')
          }
        );
        
        console.log(chalk.white(`Transaction sent! Hash: ${chalk.cyan(tx.hash)} 📤`));
        console.log(chalk.gray(`View on explorer: ${network.explorer}/tx/${tx.hash} 🔗`));
        
        const stopSpinner = showSpinner('Waiting for confirmation...');
        const receipt = await tx.wait();
        stopSpinner();
        
        console.log(chalk.green(`Transaction confirmed in block ${receipt.blockNumber} ✅`));
        console.log(chalk.green(`Successfully swapped ${amount} WETH to USDC! 🎉`));
        console.log(chalk.white('===== SWAP COMPLETED =====\n'));
      } catch (error) {
        console.error(chalk.red('Swap execution failed:', error.message, '❌'));
        if (error.reason) {
          console.log(chalk.red(`Revert reason: ${error.reason}`));
        }
        if (error.data) {
          console.log(chalk.red(`Revert data: ${error.data}`));
        }
        console.log(chalk.white('===== SWAP FAILED =====\n'));
      }
      
      rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
        console.clear();
        await returnMenuCallback();
      });
    });
  } catch (error) {
    console.error(chalk.red('Error in swap process:', error.message, '❌'));
    console.log(chalk.white('===== SWAP FAILED =====\n'));
    rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
      console.clear();
      await returnMenuCallback();
    });
  }
}

async function swapUSDCtoWETH(wallet, returnMenuCallback) {
  try {
    console.log(chalk.white('\n===== SWAP USDC TO WETH ====='));
    rl.question(chalk.yellow('Enter amount of USDC to swap: '), async (amountStr) => {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        console.log(chalk.red('Invalid amount. Please enter a positive number. ⚠️'));
        return swapUSDCtoWETH(wallet, returnMenuCallback);
      }

      const amountWei = ethers.utils.parseUnits(amount.toString(), 6);
      const gasPrice = await wallet.provider.getGasPrice();
      const estimatedGas = 300000;
      const gasCost = ethers.utils.formatEther(gasPrice.mul(estimatedGas));
      
      const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.USDC, USDC_ABI, wallet);
      const usdcBalance = await usdcContract.balanceOf(wallet.address);
      if (usdcBalance.lt(amountWei)) {
        console.log(chalk.red(`Insufficient USDC balance. Available: ${ethers.utils.formatUnits(usdcBalance, 6)}, Required: ${amount} USDC`));
        rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
          console.clear();
          await returnMenuCallback();
        });
        return;
      }
      
      const wethPerUsdc = 1 / 1071.568;
      const expReturnAmount = ethers.utils.parseUnits((amount * wethPerUsdc).toFixed(18), 18);
      const minReturnAmount = ethers.utils.parseUnits((amount * wethPerUsdc * 0.968).toFixed(18), 18);
      
      const confirmed = await confirmTransaction({
        Action: 'Swap USDC to WETH',
        'USDC Amount': `${amount} USDC`,
        'Exp. WETH': `${ethers.utils.formatEther(expReturnAmount)} WETH`,
        'Min. WETH': `${ethers.utils.formatEther(minReturnAmount)} WETH`,
        'Est. Gas': `${gasCost} ETH`
      });
      
      if (!confirmed) {
        console.log(chalk.red('Transaction canceled. 🚫'));
        console.log(chalk.white('===== SWAP CANCELED =====\n'));
        rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
          console.clear();
          await returnMenuCallback();
        });
        return;
      }
      
      const allowanceOk = await ensureTokenAllowance(
        wallet,
        CONTRACT_ADDRESSES.USDC,
        USDC_ABI,
        amountWei,
        CONTRACT_ADDRESSES.DODOFeeRouteProxy,
        'USDC'
      );
      if (!allowanceOk) {
        console.log(chalk.red('Cannot proceed with swap due to allowance issue. 🚫'));
        rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
          console.clear();
          await returnMenuCallback();
        });
        return;
      }
      
      const dodoContract = new ethers.Contract(
        CONTRACT_ADDRESSES.DODOFeeRouteProxy,
        DODOFeeRouteProxyABI,
        wallet
      );
      
      console.log(chalk.yellow(`Swapping ${amount} USDC to WETH...`));
      
      const mixAdapters = ['0x0f9053E174c123098C17e60A2B1FAb3b303f9e29'];
      const mixPairs = ['0xc7E2B7C2519bB911bA4a1eeE246Cb05ACb0b1df1'];
      const assetTo = [
        '0xc7E2B7C2519bB911bA4a1eeE246Cb05ACb0b1df1',
        CONTRACT_ADDRESSES.DODOFeeRouteProxy
      ];
      const moreInfos = ['0x00'];
      const feeData = '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      for (const directions of [1, 0]) {
        try {
          console.log(chalk.gray(`Attempting swap with directions=${directions}...`));
          const tx = await dodoContract.mixSwap(
            CONTRACT_ADDRESSES.USDC,
            CONTRACT_ADDRESSES.WETH,
            amountWei,
            expReturnAmount,
            minReturnAmount,
            mixAdapters,
            mixPairs,
            assetTo,
            directions,
            moreInfos,
            feeData,
            deadline,
            {
              gasLimit: estimatedGas,
              maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei'),
              maxFeePerGas: ethers.utils.parseUnits('1.500000008', 'gwei')
            }
          );
          
          console.log(chalk.white(`Transaction sent! Hash: ${chalk.cyan(tx.hash)} 📤`));
          console.log(chalk.gray(`View on explorer: ${network.explorer}/tx/${tx.hash} 🔗`));
          
          const stopSpinner = showSpinner('Waiting for confirmation...');
          const receipt = await tx.wait();
          stopSpinner();
          
          console.log(chalk.green(`Transaction confirmed in block ${receipt.blockNumber} ✅`));
          console.log(chalk.green(`Successfully swapped ${amount} USDC to WETH! 🎉`));
          console.log(chalk.white('===== SWAP COMPLETED =====\n'));
          break;
        } catch (error) {
          console.error(chalk.red(`Swap with directions=${directions} failed:`, error.message, '❌'));
          if (error.reason) {
            console.log(chalk.red(`Revert reason: ${error.reason}`));
          }
          if (error.data) {
            console.log(chalk.red(`Revert data: ${error.data}`));
          }
          if (directions === 0) {
            console.log(chalk.red('Both directions failed. Please verify pool parameters.'));
            console.log(chalk.white('===== SWAP FAILED =====\n'));
          } else {
            console.log(chalk.yellow('Retrying with directions=0...'));
            continue;
          }
        }
      }
      
      rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
        console.clear();
        await returnMenuCallback();
      });
    });
  } catch (error) {
    console.error(chalk.red('Error in swap process:', error.message, '❌'));
    console.log(chalk.white('===== SWAP FAILED =====\n'));
    rl.question(chalk.yellow('Press Enter to return to the Gas Pump menu...'), async () => {
      console.clear();
      await returnMenuCallback();
    });
  }
}

module.exports = {
  executeRandomTransfers,
  depositETHToGateway,
  withdrawETHFromGateway,
  wrapETH,
  unwrapWETH,
  approveWETH,
  swapWETHtoUSDC,
  swapUSDCtoWETH
};