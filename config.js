const network = {
    name: 'Rise Testnet',
    rpc: 'https://testnet.riselabs.xyz/',
    chainId: 11155931,
    symbol: 'ETH',
    explorer: 'https://explorer.testnet.riselabs.xyz/'
  };
  
  const CONTRACT_ADDRESSES = {
    WrappedTokenGatewayV3: '0x832e537e88d0e8e5bb4efb735f521a9a0e085e0a',
    WETH: '0x4200000000000000000000000000000000000006',
    DODOFeeRouteProxy: '0x8c6DbF95448AcbcBb1c3D6E9b3b9ceF7E6fbAb00',
    USDC: '0x8A93d247134d91e0de6f96547cB0204e5BE8e5D8'
  };
  
  const WrappedTokenGatewayV3ABI = [
    'function depositETH(address arg0, address onBehalfOf, uint16 referralCode) payable',
    'function withdrawETH(address arg0, uint256 amount, address to)'
  ];
  
  const WETH_ABI = [
    'function deposit() payable',
    'function withdraw(uint256 amount)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)'
  ];
  
  const USDC_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
  ];
  
  const DODOFeeRouteProxyABI = [
    'function mixSwap(address fromToken, address toToken, uint256 fromTokenAmount, uint256 expReturnAmount, uint256 minReturnAmount, address[] mixAdapters, address[] mixPairs, address[] assetTo, uint256 directions, bytes[] moreInfos, bytes feeData, uint256 deadLine) returns (uint256)'
  ];
  
  module.exports = {
    network,
    CONTRACT_ADDRESSES,
    WrappedTokenGatewayV3ABI,
    WETH_ABI,
    USDC_ABI,
    DODOFeeRouteProxyABI
  };