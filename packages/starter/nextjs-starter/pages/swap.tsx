import type { NextPage } from 'next';
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { TokenListContainer, TokenListProvider } from '@solana/spl-token-registry';
import { useEffect, useMemo, useState } from 'react';
import SwapUI from "@project-serum/swap-ui";
import { Provider } from '@project-serum/anchor';
import { ConfirmOptions, Connection, PublicKey } from '@solana/web3.js';
import { useSnackbar } from 'notistack';
import NotifyingProvider from './NotificationProvider';
import Wallet from "@project-serum/sol-wallet-adapter"; // see next.config.js 


/**
 * To earn referral fees, one can also pass in a referral property, which is the PublicKey 
 * of the Solana wallet that owns the associated token accounts in which referral fees are
 * paid (i.e., USDC and USDT).
 */
const referralPubliKey = new PublicKey('26H2btPLD5i6w18VBGYabDAjEo6nCKXZR5q6FytvLJm3');

// const currentEnv = 'mainnet';
// const currentEnv = 'devnet';
const currentEnv = 'testnet';

const configs = {
  mainnet: {
    network: "https://solana-api.projectserum.com",
    tokenListNetwork: "mainnet-beta",
  },
  devnet: {
    network: "https://api.devnet.solana.com",
    tokenListNetwork: "devnet",
  },
  testnet: {
    network: "https://api.testnet.solana.com",
    tokenListNetwork: 'testnet',
  },
}

const config = configs[currentEnv];
        


const Swap: NextPage = () => {
    const __wallet = useWallet();

    const { enqueueSnackbar } = useSnackbar();
    const [isConnected, setIsConnected] = useState(false);
    const [tokenList, setTokenList] = useState<TokenListContainer | null>(null);
    

    useEffect(() => {
      new TokenListProvider().resolve().then((tokens) => {
        const filteredTokens = tokens.filterByClusterSlug(config.tokenListNetwork);
        setTokenList(filteredTokens);
      });
    }, [setTokenList]);

      
      // @ts-ignore
      const [provider, wallet] = useMemo(() => {
        // Avoid SSR errors
        if (typeof window === "undefined" || !__wallet?.wallet) {
          return [];
        }
        const opts: ConfirmOptions = {
            preflightCommitment: "recent",
            commitment: "recent",
        };

        // const wallet = new Wallet("https://www.sollet.io", network); // OROGINAL
        // const walletBis = __wallet;

        // const walletBis = __wallet;
        // @ts-ignore
        const walletBis = __wallet.wallet.adapter._wallet;

        // Avoid error that happens right after "disconnect"
        if (!walletBis) {
          return [];
        }

        const connection = new Connection(config.network, opts.preflightCommitment);
        const provider = new NotifyingProvider(
          connection,
          walletBis,
          opts,
          (tx, err) => {
            if (err) {
              enqueueSnackbar(`Error: ${err.toString()}`, {
                variant: "error",
              });
            } else {
              enqueueSnackbar("Transaction sent", {
                variant: "success",
                action: (
                  <a
                    color="inherit"
                    target="_blank"
                    rel="noopener"
                    href={`https://explorer.solana.com/tx/${tx}`}
                  >
                    View on Solana Explorer
                  </a>
                ),
              });
            }
          }
        );
        
        return [provider, walletBis];
      }, [enqueueSnackbar, __wallet]);


      const [isEventSet, setIsEventSet] = useState(false);

      // Connect to the wallet.
      useEffect(() => {
        // @ts-ignore
        if (!isEventSet && wallet && wallet?.on) {
          setIsEventSet(true);
          // @ts-ignore
          wallet.on("connect", () => {
            enqueueSnackbar("Wallet connected", { variant: "success" });
            setIsConnected(true);
          });
          // @ts-ignore
          wallet.on("disconnect", () => {
            enqueueSnackbar("Wallet disconnected", { variant: "info" });
            setIsConnected(false);
          });
        }
        else if (!wallet && !isEventSet) {
          setIsEventSet(false);
        }
      }, [wallet, enqueueSnackbar, isEventSet]);      

    return (
        <div className={styles.container}>
            {tokenList && provider && (
              <SwapUI
                provider={provider}
                tokenList={tokenList} 
                referral={referralPubliKey}
                // fromAmount={1000}
                // toAmount={2000}
              />
            )}
            {/* <button onClick={() => {
              wallet?.disconnect()
            }}>TEST</button> */}

        </div>
    );
};

export default Swap;
