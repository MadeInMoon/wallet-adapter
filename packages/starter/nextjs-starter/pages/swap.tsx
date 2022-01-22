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
import { ConfirmOptions, Connection } from '@solana/web3.js';
import { useSnackbar } from 'notistack';
import NotifyingProvider from './NotificationProvider';
import Wallet from "@project-serum/sol-wallet-adapter"; // see next.config.js 






const Swap: NextPage = () => {
    const __wallet = useWallet();
    // console.log("__wallet");
    // console.log(__wallet);

    const { enqueueSnackbar } = useSnackbar();
    const [isConnected, setIsConnected] = useState(false);
    const [tokenList, setTokenList] = useState<TokenListContainer | null>(null);
    
    useEffect(() => {
        new TokenListProvider().resolve().then(setTokenList);
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
        const network = "https://solana-api.projectserum.com";

        // const wallet = new Wallet("https://www.sollet.io", network); // OROGINAL
        // const walletBis = __wallet;

        // @ts-ignore
        const walletBis = __wallet.wallet.adapter._wallet;

        // console.log('walletBis');
        // console.log(walletBis);

        // Avoid error that happens right after "disconnect"
        if (!walletBis) {
          return [];
        }

        const connection = new Connection(network, opts.preflightCommitment);
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
        if (!isEventSet && wallet) {
          setIsEventSet(true);
          wallet.on("connect", () => {
            enqueueSnackbar("Wallet connected", { variant: "success" });
            setIsConnected(true);
          });
          wallet.on("disconnect", () => {
            enqueueSnackbar("Wallet disconnected", { variant: "info" });
            setIsConnected(false);
          });
        }
        else if (!wallet && !isEventSet) {
          setIsEventSet(false);
        }
      }, [wallet, enqueueSnackbar, isEventSet]);

  
      console.log("provider");
      console.log(provider);
      


    return (
        <div className={styles.container}>
            {tokenList && provider && (
              <SwapUI
                provider={provider}
                tokenList={tokenList} 
                fromAmount={1000}
                toAmount={2000}
              />
            )}
            {/* <button onClick={() => {
              wallet?.disconnect()
            }}>TEST</button> */}

        </div>
    );
};

export default Swap;
