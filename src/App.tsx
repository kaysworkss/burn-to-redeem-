/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vite/client" />
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TezosToolkit, MichelsonMap } from '@taquito/taquito';
import { BeaconWallet } from '@taquito/beacon-wallet';
import { NetworkType } from '@airgap/beacon-sdk';
import { TempleWallet } from '@temple-wallet/dapp';
import { 
  Flame, 
  Gift, 
  Wallet, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Timer, 
  ArrowRight, 
  Clock, 
  Pause, 
  Play, 
  RefreshCw,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LegacyPage from './LegacyPage';
import { contractCode } from './contract_code';

// --- Constants ---
const DEFAULT_RPC = 'https://mainnet.api.tez.ie';
const NETWORK = NetworkType.MAINNET;
const TZKT_API = 'https://api.tzkt.io';
const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD || 'admin123').trim();

type Page = 'collector' | 'admin' | 'legacy';

interface ContractConfig {
  admin: string;
  burnTokenAddress: string;
  burnTokenId: number;
  burnAmount: number;
  rewardTokenAddress: string;
  rewardTokenId: number;
  rewardAmount: number;
  active: boolean;
  endTimestamp: Date | null;
  totalRedeemed: number;
}

export default function App() {
  const [page, setPage] = useState<Page>('collector');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [isContractLoaded, setIsContractLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  
  const [cfg, setCfg] = useState<ContractConfig>({
    admin: '',
    burnTokenAddress: '',
    burnTokenId: 0,
    burnAmount: 10,
    rewardTokenAddress: '',
    rewardTokenId: 0,
    rewardAmount: 1,
    active: true,
    endTimestamp: null,
    totalRedeemed: 0
  });

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');

  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; title: string; sub?: string }[]>([]);

  const [deployStep, setDeployStep] = useState(1);
  const [deployCode, setDeployCode] = useState(JSON.stringify(contractCode));
  const [deployStorage, setDeployStorage] = useState('{"prim":"Pair","args":[{"prim":"True"}, {"prim":"Pair","args":[{"string":"tz1..."}, {"prim":"Pair","args":[{"int":"10"}, {"prim":"Pair","args":[{"string":"KT1..."}, {"prim":"Pair","args":[{"int":"0"}, {"prim":"Pair","args":[{"prim":"None"}, {"prim":"Pair","args":[{"int":"1"}, {"prim":"Pair","args":[{"string":"KT1..."}, {"prim":"Pair","args":[{"int":"0"}, {"int":"0"}]}]}]}]}]}]}]}]}]}]}]}');

  // --- Tezos Init ---
  const tezos = useMemo(() => new TezosToolkit(DEFAULT_RPC), []);
  const wallet = useMemo(() => new BeaconWallet({
    name: "Tezos Burn -> Redeem",
    preferredNetwork: NETWORK as any,
  }), []);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, sub?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, sub }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // Check for active account on mount
  useEffect(() => {
    const checkActiveAccount = async () => {
      try {
        const activeAccount = await wallet.client.getActiveAccount();
        if (activeAccount) {
          setWalletAddress(activeAccount.address);
          tezos.setWalletProvider(wallet);
          addToast('info', 'Wallet Session Restored', activeAccount.address.slice(0, 8) + '...');
        }
      } catch (err) {
        console.error('Failed to restore wallet session', err);
      }
    };
    checkActiveAccount();
  }, [wallet, tezos, addToast]);

  // --- Wallet Handlers ---
  const connectWithBeacon = async () => {
    try {
      addToast('info', 'Connecting Beacon...', 'Opening selector...');
      // Request permissions with network object
      await wallet.requestPermissions({
        network: { type: NETWORK as any, rpcUrl: DEFAULT_RPC }
      });
      const address = await wallet.getPKH();
      setWalletAddress(address);
      tezos.setWalletProvider(wallet);
      addToast('success', 'Beacon Connected', `${address.slice(0, 8)}...`);
    } catch (e: any) {
      console.error('Beacon error:', e);
      // Fallback: if network property is rejected, try without
      try {
        await wallet.requestPermissions();
        const address = await wallet.getPKH();
        setWalletAddress(address);
        tezos.setWalletProvider(wallet);
        addToast('success', 'Beacon Connected', `${address.slice(0, 8)}...`);
      } catch (innerE: any) {
        addToast('error', 'Connection failed', innerE.message || String(innerE));
      }
    }
  };

  const connectWithTemple = async () => {
    try {
      addToast('info', 'Connecting Temple...', 'Checking extension...');
      const available = await TempleWallet.isAvailable();
      if (!available) {
        window.open('https://templewallet.com/', '_blank');
        throw new Error('Temple Wallet extension not found');
      }

      const temple = new TempleWallet("Tezos Burn -> Redeem");
      await temple.connect('mainnet' as any);
      const address = await temple.getPKH();
      setWalletAddress(address);
      tezos.setWalletProvider(temple as any);
      addToast('success', 'Temple Connected', `${address.slice(0, 8)}...`);
    } catch (e: any) {
      addToast('error', 'Temple failed', e.message || String(e));
    }
  };

  const connectWallet = async () => {
    setShowWalletSelector(true);
  };

  const disconnectWallet = async () => {
    await wallet.clearActiveAccount();
    setWalletAddress(null);
    addToast('info', 'Wallet disconnected');
  };

  // --- Contract Handlers ---
  const loadContract = async (addr?: string) => {
    const targetAddr = addr || contractAddress;
    if (!targetAddr.startsWith('KT1') || targetAddr.length < 10) {
      addToast('error', 'Invalid address', 'Please enter a valid KT1 address');
      return;
    }

    setIsLoading(true);
    try {
      // Porting storage fetch logic
      const storage: any = await tezos.contract.getStorage(targetAddr);
      
      const newCfg: ContractConfig = {
        admin: storage.admin,
        burnTokenAddress: storage.burn_token_address,
        burnTokenId: storage.burn_token_id.toNumber(),
        burnAmount: storage.burn_amount.toNumber(),
        rewardTokenAddress: storage.reward_token_address,
        rewardTokenId: storage.reward_token_id.toNumber(),
        rewardAmount: storage.reward_amount.toNumber(),
        active: storage.active,
        endTimestamp: storage.end_timestamp ? new Date(storage.end_timestamp) : null,
        totalRedeemed: storage.total_redeemed.toNumber()
      };

      setCfg(newCfg);
      setContractAddress(targetAddr);
      setIsContractLoaded(true);
      addToast('success', 'Contract loaded', `${targetAddr.slice(0, 10)}...`);
    } catch (e: any) {
      addToast('error', 'Failed to load contract', e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const redeem = async () => {
    if (!walletAddress) {
      connectWallet();
      return;
    }
    if (!isContractLoaded) {
      addToast('error', 'No contract', 'Please load a contract in the Admin section first');
      return;
    }

    setIsRedeeming(true);
    addToast('info', 'Redeeming...', 'Approve the transaction in your wallet');
    
    try {
      const contract = await tezos.wallet.at(contractAddress);
      const op = await contract.methods.redeem().send();
      addToast('info', 'Processing...', 'Waiting for block confirmation');
      await op.confirmation();
      
      // Update local state after success
      setCfg(prev => ({ ...prev, totalRedeemed: prev.totalRedeemed + 1 }));
      addToast('success', 'Redeemed!', `Burned ${cfg.burnAmount} tokens for reward`);
    } catch (e: any) {
      addToast('error', 'Redeem failed', e.message || String(e));
    } finally {
      setIsRedeeming(false);
    }
  };

  // --- Admin Handlers ---
  const handleAdminUpdate = async (method: string, params: any[], successMsg: string) => {
    if (!walletAddress) {
      addToast('error', 'Wallet not connected');
      return;
    }
    try {
      const contract = await tezos.wallet.at(contractAddress);
      const op = await contract.methods[method](...params).send();
      addToast('info', 'Broadcasting...', 'Waiting for confirmation');
      await op.confirmation();
      addToast('success', 'Updated', successMsg);
      loadContract(); // Refresh state
    } catch (e: any) {
      addToast('error', 'Update failed', e.message || String(e));
    }
  };

  // --- Navigation Logic ---
  const navigate = (p: Page) => {
    setPage(p);
    setIsMobileMenuOpen(false);
  };

  const deploy = async () => {
    if (!walletAddress) {
      addToast('error', 'Wallet not connected');
      return;
    }
    setDeployStep(3);
    addToast('info', 'Deploying contract...', 'Please approve in your wallet');
    try {
      const code = JSON.parse(deployCode);
      const storage = JSON.parse(deployStorage);
      const op = await tezos.wallet.originate({ code, storage }).send();
      addToast('info', 'Submitted', 'Confirming origination...');
      const contract = await op.contract();
      setContractAddress(contract.address);
      addToast('success', 'Deployed!', contract.address);
      setDeployStep(1);
      loadContract(contract.address);
    } catch (e: any) {
      setDeployStep(2);
      addToast('error', 'Deployment failed', e.message || String(e));
    }
  };

  const generateDefaultStorage = () => {
    if (!walletAddress) {
      addToast('error', 'Connect wallet first');
      return;
    }
    // Storage structure: (pair %active (pair %admin (pair %burn_amount (pair %burn_token_address (pair %burn_token_id (pair %end_timestamp (pair %reward_amount (pair %reward_token_address (pair %reward_token_id %total_redeemed)))))))))
    const storage = JSON.stringify({
      prim: "Pair",
      args: [
        { prim: "True" },
        {
          prim: "Pair",
          args: [
            { string: walletAddress },
            {
              prim: "Pair",
              args: [
                { int: "1000000" }, // 1 Token (assuming 6 decimals)
                {
                  prim: "Pair",
                  args: [
                    { string: "KT1PWx2mnDueob7fCqc38CSp1V8pxPNE1S58" }, // Placeholder: tzBTC
                    {
                      prim: "Pair",
                      args: [
                        { int: "0" },
                        {
                          prim: "Pair",
                          args: [
                            { prim: "None" }, // No end timestamp
                            {
                              prim: "Pair",
                              args: [
                                { int: "1000000" },
                                {
                                  prim: "Pair",
                                  args: [
                                    { string: "KT1PWx2mnDueob7fCqc38CSp1V8pxPNE1S58" },
                                    {
                                      prim: "Pair",
                                      args: [
                                        { int: "0" },
                                        { int: "0" }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }, null, 2);
    
    setDeployStorage(storage);
    addToast('success', 'Storage Injected', 'Connected wallet set as Admin');
  };

  // Timer logic
  const [timeLeft, setTimeLeft] = useState<{ d: string, h: string, m: string, s: string } | null>(null);
  
  useEffect(() => {
    if (!cfg.endTimestamp || !cfg.active) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const diff = cfg.endTimestamp!.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }
      const d = Math.floor(diff / 86400000).toString().padStart(2, '0');
      const h = Math.floor((diff % 86400000) / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimeLeft({ d, h, m, s });
    }, 1000);

    return () => clearInterval(timer);
  }, [cfg.endTimestamp, cfg.active]);

  const isExpired = cfg.endTimestamp && new Date() > cfg.endTimestamp;
  const isActionable = cfg.active && !isExpired;

  return (
    <div id="app-root" className="min-h-screen bg-[#fdfdfb] text-[#1a1a1a] font-sans selection:bg-[#e8573c]/10 selection:text-[#e8573c]">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-20 border-b border-[#1a1a1a]/5 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="font-serif italic text-2xl tracking-tight leading-none">Kay's Works</span>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 mt-1">Burn → Redeem Portal</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('collector')} className={`text-[11px] uppercase tracking-widest font-bold transition-all ${page === 'collector' ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]'}`}>Exchange</button>
          <button onClick={() => navigate('legacy')} className={`text-[11px] uppercase tracking-widest font-bold transition-all ${page === 'legacy' ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]'}`}>Portfolio</button>
          <div className="h-4 w-px bg-[#1a1a1a]/10" />
          <button onClick={() => navigate('admin')} className={`text-[11px] uppercase tracking-widest font-bold px-4 py-2 rounded-full transition-all border ${page === 'admin' ? 'bg-[#e8573c] text-white border-[#e8573c]' : 'text-[#1a1a1a]/60 border-[#1a1a1a]/10 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'}`}>Admin Portal</button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={walletAddress ? disconnectWallet : connectWallet}
            className={`hidden sm:flex items-center gap-2 px-5 py-2.5 border rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${walletAddress ? 'border-[#1a1a1a] text-[#1a1a1a] bg-[#1a1a1a]/5' : 'border-[#1a1a1a]/20 text-[#1a1a1a]/60 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'}`}
          >
            {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
          </button>
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-0 w-full bg-white border-b border-[#1a1a1a]/5 p-6 md:hidden flex flex-col gap-4 shadow-xl z-40"
            >
              <button onClick={() => navigate('collector')} className={`text-[11px] uppercase tracking-widest font-bold py-3 text-left ${page === 'collector' ? 'text-[#e8573c]' : 'text-[#1a1a1a]/40'}`}>Exchange</button>
              <button onClick={() => navigate('legacy')} className={`text-[11px] uppercase tracking-widest font-bold py-3 text-left ${page === 'legacy' ? 'text-[#e8573c]' : 'text-[#1a1a1a]/40'}`}>Portfolio</button>
              <button onClick={() => navigate('admin')} className={`text-[11px] uppercase tracking-widest font-bold py-3 text-left ${page === 'admin' ? 'text-[#e8573c]' : 'text-[#1a1a1a]/40'}`}>Admin Portal</button>
              <div className="pt-4 border-t border-[#1a1a1a]/5">
                <button 
                  onClick={walletAddress ? disconnectWallet : connectWallet}
                  className="w-full py-4 bg-[#1a1a1a] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
                >
                   {walletAddress ? `Disconnect (${walletAddress.slice(0, 6)}...)` : 'Connect Wallet'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Wallet Selector Modal */}
        <AnimatePresence>
          {showWalletSelector && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1a1a1a]/40 backdrop-blur-sm"
              onClick={() => setShowWalletSelector(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-center space-y-2">
                  <h3 className="font-serif italic text-2xl">Select Provider</h3>
                  <p className="text-xs text-[#1a1a1a]/40">Choose your preferred Tezos connection</p>
                </div>

                <div className="grid gap-3">
                  <button 
                    onClick={() => {
                      setShowWalletSelector(false);
                      connectWithTemple();
                    }}
                    className="flex items-center justify-between p-4 bg-[#1a1a1a]/5 hover:bg-[#1a1a1a]/10 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-[#1a1a1a]/5">
                        <img src="https://templewallet.com/logo.png" alt="Temple" className="w-6 h-6 object-contain" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold">Temple Wallet</div>
                        <div className="text-[10px] opacity-40 uppercase tracking-wider font-medium">Native Extension</div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>

                  <button 
                    onClick={() => {
                      setShowWalletSelector(false);
                      connectWithBeacon();
                    }}
                    className="flex items-center justify-between p-4 bg-[#1a1a1a]/5 hover:bg-[#1a1a1a]/10 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-[#1a1a1a]/5">
                         <div className="w-6 h-6 bg-[#e8573c] rounded-full flex items-center justify-center text-white text-[8px] font-bold">B</div>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold">Beacon / Kukai</div>
                        <div className="text-[10px] opacity-40 uppercase tracking-wider font-medium">Multi-Wallet Support</div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                </div>

                <button 
                  onClick={() => setShowWalletSelector(false)}
                  className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-all"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-24">
        <AnimatePresence mode="wait">
          {page === 'collector' ? (
            <motion.div 
              key="collector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-16 items-center"
            >
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className={`px-2.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border ${
                    !cfg.active || isExpired ? 'bg-red-50 border-red-200 text-red-500' : 'bg-green-50 border-green-200 text-green-600'
                  }`}>
                    { !cfg.active ? 'Suspended' : isExpired ? 'Campaign Concluded' : 'Active Collection' }
                  </div>
                </div>

                <h1 className="font-serif text-6xl md:text-8xl leading-[0.95] tracking-tight">
                  Exchange <span className="italic text-[#e8573c]">Art</span> for <span className="italic opacity-30">Art</span>.
                </h1>

                <p className="text-base text-[#1a1a1a]/60 font-medium leading-relaxed max-w-md">
                  A decentralized portal to burn special edition Tezos tokens in exchange for exclusive rewards. Every transaction is artist-verified and on-chain.
                </p>

                {timeLeft && (
                  <div className="flex gap-8 py-6 border-y border-[#1a1a1a]/5">
                    {[
                      { val: timeLeft.d, label: 'Days' },
                      { val: timeLeft.h, label: 'Hours' },
                      { val: timeLeft.m, label: 'Mins' },
                      { val: timeLeft.s, label: 'Secs' }
                    ].map((seg) => (
                      <div key={seg.label}>
                        <span className="block text-3xl font-serif leading-none mb-1">{seg.val}</span>
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-30">{seg.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#1a1a1a]/5 rounded-[40px] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#e8573c]" />
                
                <div className="space-y-12">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">Requirement</span>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#e8573c]/10 rounded-full flex items-center justify-center text-[#e8573c]">
                          <Flame size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold truncate max-w-[140px] leading-tight">Edition #{cfg.burnTokenId}</p>
                          <p className="text-[10px] opacity-40">{cfg.burnTokenAddress.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-4xl font-serif italic">{cfg.burnAmount}</span>
                       <span className="text-[10px] font-bold opacity-30 ml-2">PCS</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-2">
                    <div className="w-full h-px bg-[#1a1a1a]/5 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white px-4">
                          <ArrowRight size={14} className="opacity-20 translate-y-[0px]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-2">Reward</span>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1a1a1a]/5 rounded-full flex items-center justify-center text-[#1a1a1a]">
                          <Gift size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold truncate max-w-[140px] leading-tight">Reward #{cfg.rewardTokenId}</p>
                          <p className="text-[10px] opacity-40">{cfg.rewardTokenAddress.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-4xl font-serif italic text-[#e8573c]">{cfg.rewardAmount}</span>
                       <span className="text-[10px] font-bold opacity-30 ml-2">PCS</span>
                    </div>
                  </div>

                  <button 
                    onClick={redeem}
                    disabled={!isActionable || isRedeeming}
                    className={`w-full py-5 rounded-full text-sm font-bold uppercase tracking-widest transition-all ${
                      !isActionable ? 'bg-[#1a1a1a]/5 text-[#1a1a1a]/20 cursor-not-allowed' : 
                      'bg-[#1a1a1a] text-white hover:bg-[#e8573c] active:scale-[0.98] shadow-lg shadow-[#1a1a1a]/10'
                    }`}
                  >
                    {isRedeeming ? 'Witnessing Swap...' : walletAddress ? 'Initiate Exchange' : 'Connect to Exchange'}
                  </button>

                  <div className="flex justify-between items-center pt-4 border-t border-[#1a1a1a]/5 text-[10px] font-bold tracking-widest opacity-30 uppercase">
                    <span>Total Redeemed: {cfg.totalRedeemed}</span>
                    <span>Verified On-Chain</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : page === 'legacy' ? (
            <motion.div 
              key="legacy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex justify-center"
            >
              <LegacyPage />
            </motion.div>
          ) : (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto"
            >
              <AnimatePresence mode="wait">
                {!isAdminAuthenticated ? (
                  <motion.div 
                    key="admin-auth"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md mx-auto py-24 px-12 bg-white border border-[#1a1a1a]/5 rounded-[40px] shadow-sm text-center space-y-8"
                  >
                    <div className="w-20 h-20 bg-[#1a1a1a]/5 rounded-full flex items-center justify-center mx-auto">
                      <LogOut size={32} className="opacity-20" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-serif tracking-tight">Identity Required</h2>
                      <p className="text-xs text-[#1a1a1a]/40 font-medium leading-relaxed italic">Access to the administrative portal is strictly restricted to project custodians.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="relative">
                        <input 
                          type="password" 
                          placeholder="Custodian Key"
                          value={adminPasswordInput}
                          onChange={(e) => setAdminPasswordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const trimmedInput = adminPasswordInput.trim();
                              if (trimmedInput === ADMIN_PASSWORD) {
                                setIsAdminAuthenticated(true);
                                addToast('success', 'Access Granted');
                              } else {
                                addToast('error', 'Authentication Failure', 'Check your Custodian Key');
                              }
                            }
                          }}
                          className="w-full bg-[#1a1a1a]/5 border-none rounded-2xl px-6 py-4 text-center text-sm focus:ring-1 focus:ring-[#1a1a1a]/20 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-center opacity-20 uppercase font-bold tracking-tighter">
                          {import.meta.env.VITE_ADMIN_PASSWORD ? "Using Custom Security Key" : "Using Default Security Key"}
                        </p>
                        <p className="text-[8px] text-center opacity-30 italic">
                          Note: In Vercel, ensure the variable is named <span className="font-bold">VITE_ADMIN_PASSWORD</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          const trimmedInput = adminPasswordInput.trim();
                          if (trimmedInput === ADMIN_PASSWORD) {
                            setIsAdminAuthenticated(true);
                            addToast('success', 'Access Granted');
                          } else {
                            addToast('error', 'Authentication Failure', 'Check your Custodian Key');
                          }
                        }}
                        className="w-full py-4 bg-[#1a1a1a] text-white font-bold uppercase text-[11px] tracking-widest rounded-2xl shadow-lg hover:bg-[#e8573c] active:scale-[0.98] transition-all"
                      >
                        Authenticate
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="admin-interface"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-12"
                  >
                    <div className="flex justify-between items-end pb-8 border-b border-[#1a1a1a]/5">
                      <div>
                        <h1 className="text-5xl font-serif tracking-tight">Admin <span className="italic opacity-30">Portal</span></h1>
                        <p className="text-xs text-[#1a1a1a]/40 mt-2 font-medium">Manage campaign parameters, deploy instances, and control liquidity.</p>
                      </div>
                      <button 
                        onClick={() => setIsAdminAuthenticated(false)}
                        className="text-[10px] font-bold text-[#1a1a1a]/40 hover:text-red-500 flex items-center gap-2 uppercase transition-all"
                      >
                        <LogOut size={12} /> Sign Out
                      </button>
                    </div>

                    <div className="grid gap-12">
                      {/* Section 1: Activation */}
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest opacity-30">
                          <Settings size={14} /> 01. Connect Management Interface
                        </div>
                        <div className="bg-white border border-[#1a1a1a]/5 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-6 items-end">
                          <div className="flex-1 w-full space-y-2">
                            <label className="text-[9px] uppercase tracking-widest font-bold opacity-30">Contract Address</label>
                            <input 
                              id="contract-address-input"
                              type="text" 
                              value={contractAddress}
                              onChange={(e) => setContractAddress(e.target.value)}
                              placeholder="KT1..."
                              className="w-full bg-[#1a1a1a]/5 border-none rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-[#e8573c]/20 outline-none transition-all font-mono"
                            />
                          </div>
                          <button 
                            id="load-contract-btn"
                            onClick={() => loadContract()}
                            disabled={isLoading}
                            className="h-12 px-10 bg-[#1a1a1a] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#e8573c] transition-all disabled:opacity-20"
                          >
                            {isLoading ? 'Fetching...' : 'Load Interface'}
                          </button>
                        </div>
                      </section>

                      {isContractLoaded && (
                        <div className="grid gap-8 md:grid-cols-2">
                          <div className="bg-white border border-[#1a1a1a]/5 rounded-3xl p-8 space-y-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-30 mb-2">
                              <Flame size={14} /> Burn Mechanism
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold opacity-20">Address</label>
                                <div className="text-[10px] p-4 bg-[#1a1a1a]/5 rounded-xl font-mono text-[#1a1a1a]/60 truncate">
                                  {cfg.burnTokenAddress}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase font-bold opacity-20">ID</label>
                                  <div className="p-3 bg-[#1a1a1a]/5 rounded-xl text-xs font-mono">{cfg.burnTokenId}</div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase font-bold opacity-20">Amount</label>
                                  <input 
                                    type="number" 
                                    value={cfg.burnAmount} 
                                    onChange={(e) => setCfg(prev => ({ ...prev, burnAmount: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-[#1a1a1a]/5 border-none rounded-xl px-4 py-3 text-sm font-mono" 
                                  />
                                </div>
                              </div>
                              <button onClick={() => handleAdminUpdate('set_burn_amount', [cfg.burnAmount], 'Burn amount updated')} className="w-full py-3 border border-[#1a1a1a]/10 rounded-xl text-[10px] font-bold uppercase hover:bg-[#1a1a1a] hover:text-white transition-all">Apply Change</button>
                            </div>
                          </div>

                          <div className="bg-white border border-[#1a1a1a]/5 rounded-3xl p-8 space-y-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-30 mb-2">
                              <Gift size={14} /> Reward Mechanism
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold opacity-20">Address</label>
                                <div className="text-[10px] p-4 bg-[#1a1a1a]/5 rounded-xl font-mono text-[#1a1a1a]/60 truncate">
                                  {cfg.rewardTokenAddress}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase font-bold opacity-20">ID</label>
                                  <div className="p-3 bg-[#1a1a1a]/5 rounded-xl text-xs font-mono">{cfg.rewardTokenId}</div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase font-bold opacity-20">Amount</label>
                                  <input 
                                    type="number" 
                                    value={cfg.rewardAmount} 
                                    onChange={(e) => setCfg(prev => ({ ...prev, rewardAmount: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-[#1a1a1a]/5 border-none rounded-xl px-4 py-3 text-sm font-mono" 
                                  />
                                </div>
                              </div>
                              <button onClick={() => handleAdminUpdate('set_reward_amount', [cfg.rewardAmount], 'Reward amount updated')} className="w-full py-3 border border-[#1a1a1a]/10 rounded-xl text-[10px] font-bold uppercase hover:bg-[#1a1a1a] hover:text-white transition-all">Apply Change</button>
                            </div>
                          </div>

                          <div className="md:col-span-2 bg-[#1a1a1a] text-white rounded-[40px] p-10 space-y-10">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5 p-8 rounded-3xl border border-white/5">
                               <div className="text-center md:text-left">
                                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">System State</p>
                                  <p className="text-2xl font-serif italic mt-1">{cfg.active ? 'Operational' : 'Suspended'}</p>
                               </div>
                               <button 
                                onClick={() => handleAdminUpdate('set_active', [!cfg.active], 'State Toggled')}
                                className={`px-12 py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${cfg.active ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                               >
                                {cfg.active ? 'Suspend Campaign' : 'Resume Campaign'}
                               </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-16">
                               <div className="space-y-4">
                                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Campaign Deadline</label>
                                  <div className="flex gap-4">
                                    <input 
                                      id="date-input"
                                      type="datetime-local" 
                                      value={targetEndDate} 
                                      onChange={(e) => setTargetEndDate(e.target.value)} 
                                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs focus:ring-1 focus:ring-white/20 outline-none" 
                                    />
                                    <button onClick={() => handleAdminUpdate('set_duration', [new Date(targetEndDate).toISOString()], 'Deadline updated')} className="px-8 bg-white text-[#1a1a1a] text-[10px] font-bold uppercase rounded-xl hover:bg-[#e8573c] hover:text-white transition-all">Update</button>
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Liquidity Retrieval</label>
                                  <div className="flex gap-4">
                                    <input 
                                      id="withdraw-input"
                                      type="number" 
                                      placeholder="Volume" 
                                      value={withdrawAmount} 
                                      onChange={(e) => setWithdrawAmount(e.target.value)} 
                                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs outline-none" 
                                    />
                                    <button onClick={() => handleAdminUpdate('withdraw_rewards', [parseInt(withdrawAmount)], 'Assets retrieved')} className="px-8 border border-white/20 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-white hover:text-[#1a1a1a] transition-all">Withdraw</button>
                                  </div>
                               </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-white border border-[#1a1a1a]/5 rounded-3xl p-10 space-y-10">
                         <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest opacity-30">
                          <Play size={14} /> 02. Originate New Instance
                        </div>
                        
                        {deployStep === 1 ? (
                          <div className="grid md:grid-cols-2 gap-10">
                             <div className="space-y-3">
                                <label className="text-[10px] uppercase font-bold opacity-30">Michelson Manifest</label>
                                <textarea value={deployCode} onChange={(e) => setDeployCode(e.target.value)} className="w-full h-48 bg-[#1a1a1a]/5 border-none rounded-2xl p-6 text-[10px] font-mono outline-none focus:ring-1 focus:ring-[#1a1a1a]/10" />
                             </div>
                             <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] uppercase font-bold opacity-30">Storage Manifest</label>
                                  <button onClick={generateDefaultStorage} className="text-[9px] font-bold text-[#e8573c] italic hover:underline">Inject Identity</button>
                                </div>
                                <textarea value={deployStorage} onChange={(e) => setDeployStorage(e.target.value)} className="w-full h-48 bg-[#1a1a1a]/5 border-none rounded-2xl p-6 text-[10px] font-mono outline-none focus:ring-1 focus:ring-[#1a1a1a]/10" />
                             </div>
                             <div className="md:col-span-2 text-center md:text-right">
                                <button onClick={() => setDeployStep(2)} className="h-16 px-16 bg-[#1a1a1a] text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl hover:bg-[#e8573c] transition-all">Originate Instance</button>
                             </div>
                          </div>
                        ) : deployStep === 2 ? (
                          <div className="text-center py-12 space-y-8">
                             <div className="max-w-md mx-auto space-y-3">
                               <h3 className="text-3xl font-serif tracking-tight italic">Final Verification</h3>
                               <p className="text-xs text-[#1a1a1a]/40 leading-relaxed font-medium">Verify your JSON manifests match the intended smart contract logic before final commitment to the network.</p>
                             </div>
                             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={() => setDeployStep(1)} className="px-10 py-4 border border-[#1a1a1a]/10 rounded-2xl text-[10px] font-bold uppercase hover:bg-[#1a1a1a]/5 transition-all">Adjust Manifest</button>
                                <button onClick={deploy} className="px-14 py-4 bg-green-500 text-white rounded-2xl text-[10px] font-bold uppercase hover:brightness-110 shadow-lg shadow-green-500/20 transition-all">Commit to Chain</button>
                             </div>
                          </div>
                        ) : (
                          <div className="text-center py-32 space-y-6">
                             <RefreshCw size={56} className="animate-spin text-[#e8573c] mx-auto opacity-20" />
                             <p className="text-[11px] uppercase tracking-widest font-bold opacity-40">Awaiting Chain Synchronization...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
              className={`p-5 rounded-2xl bg-white border border-[#1a1a1a]/5 shadow-[0_20px_40px_rgba(0,0,0,0.1)] min-w-[280px] max-w-sm pointer-events-auto flex items-center gap-4`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                t.type === 'success' ? 'bg-green-50 text-green-500' : 
                t.type === 'error' ? 'bg-red-50 text-red-500' : 
                'bg-blue-50 text-blue-500'
              }`}>
                {t.type === 'success' ? <CheckCircle2 size={18} /> : 
                 t.type === 'error' ? <AlertCircle size={18} /> : 
                 <RefreshCw size={18} className="animate-spin" />}
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#1a1a1a]">{t.title}</div>
                {t.sub && <div className="text-[10px] text-[#1a1a1a]/40 font-medium leading-tight mt-0.5">{t.sub}</div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
