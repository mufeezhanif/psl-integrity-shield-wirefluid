import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { NETWORK } from '../config/constants.js';
import { getContracts, getReadOnlyContracts } from '../config/contracts.js';

export default function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [copied, setCopied] = useState(false);
  const [contracts, setContracts] = useState(() => getReadOnlyContracts());
  const [signer, setSigner] = useState(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask not detected. Please install it first.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: NETWORK.chainId }] });
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: NETWORK.chainId, chainName: NETWORK.name, nativeCurrency: { name: NETWORK.currency, symbol: NETWORK.currency, decimals: 18 }, rpcUrls: [NETWORK.rpc], blockExplorerUrls: [NETWORK.explorer] }],
          });
        } else throw switchErr;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const s = await provider.getSigner();
      setSigner(s);
      setContracts(getContracts(s));
      setWallet(accounts[0]);
    } catch (err) {
      console.error('Wallet connection failed:', err);
      alert(`Could not connect wallet: ${err.message ?? err}`);
    }
  }, []);

  const copyAddress = useCallback(() => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, [wallet]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accs => { if (accs.length > 0) connect(); });
    }
  }, [connect]);

  return { wallet, copied, connect, copyAddress, contracts, signer };
}
