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



// const network = "https://solana-api.projectserum.com"; // main net
const network = "https://api.devnet.solana.com"; // dev net
// const network = "https://api.testnet.solana.com"; // test net

// const tokenListNetwork = "mainnet-beta";
const tokenListNetwork = "devnet";
        


const Swap: NextPage = () => {
    const __wallet = useWallet();

    const { enqueueSnackbar } = useSnackbar();
    const [isConnected, setIsConnected] = useState(false);
    const [tokenList, setTokenList] = useState<TokenListContainer | null>(null);
    

    useEffect(() => {
      new TokenListProvider().resolve().then((tokens) => {
        const filteredTokens = tokens.filterByClusterSlug(tokenListNetwork);
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
                // Dev net
                // tokenList={tokenList.filterByChainId(103)} 
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
