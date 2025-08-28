
import { web3Enable, web3FromAddress, isWeb3Injected } from '@polkadot/extension-dapp';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { listingCommitString, commitmentHash, buildRemark } from '@polka-kleinanzeigen/chain';

export async function initApi() {
  const endpoint = import.meta.env.VITE_WS_ENDPOINT || 'wss://westend-rpc.polkadot.io';
  const provider = new WsProvider(endpoint);
  const api = await ApiPromise.create({ provider });
  return api;
}

export async function ensureExtension(appName='Polka Kleinanzeigen') {
  const exts = await web3Enable(appName);
  if (!exts.length) throw new Error('No Polkadot extension found/authorized.');
  return exts;
}

export function computeCommit(listing: { id: string; title: string; price: number; region: string; seller: string }) {
  const s = listingCommitString(listing);
  const hex = commitmentHash(s);
  return { compact: s, hex };
}

export async function signRemark(api: ApiPromise, fromAddress: string, hex: string): Promise<string> {
  const injector = await web3FromAddress(fromAddress);
  const tx = buildRemark(api, hex);
  return new Promise((resolve, reject) => {
    tx.signAndSend(fromAddress, { signer: injector.signer }, ({ status, dispatchError }) => {
      if (dispatchError) reject(dispatchError.toString());
      if (status.isInBlock) {
        resolve(status.asInBlock.toString());
      }
    }).catch(reject);
  });
}
