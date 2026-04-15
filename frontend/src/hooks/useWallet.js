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
        // 4902 = chain not added yet; other codes can occur when chain exists but switch fails
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: NETWORK.chainId, chainName: NETWORK.name, nativeCurrency: { name: NETWORK.currency, symbol: NETWORK.currency, decimals: 18 }, rpcUrls: [NETWORK.rpc], blockExplorerUrls: [NETWORK.explorer] }],
          });
        } catch (addErr) {
          // If adding also fails, the network already exists — ignore and proceed
          if (switchErr.code === 4001 || addErr.code === 4001) throw switchErr; // user rejected
        }
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 92533n) {
        alert('Please switch to WireFluid Testnet (chain 92533) in MetaMask.');
        return;
      }
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

  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accs) => { if (accs.length === 0) { setWallet(null); setSigner(null); setContracts(getReadOnlyContracts()); } else connect(); };
    const onChain = () => { if (wallet) connect(); };
    window.ethereum.on('accountsChanged', onAccounts);
    window.ethereum.on('chainChanged', onChain);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccounts);
      window.ethereum.removeListener('chainChanged', onChain);
    };
  }, [connect, wallet]);

  return { wallet, copied, connect, copyAddress, contracts, signer };
}
