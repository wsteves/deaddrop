
import { ApiPromise, WsProvider } from '@polkadot/api';
import { blake2AsHex } from '@polkadot/util-crypto';

export async function getApi(endpoint?: string) {
  const url = endpoint || 'wss://westend-rpc.polkadot.io';
  const provider = new WsProvider(url);
  const api = await ApiPromise.create({ provider });
  return api;
}

/**
 * Create a compact commitment string for a listing, then hash it.
 * We only anchor the hash on-chain via system.remark to keep data minimal.
 */
export function listingCommitString(listing: {
  id: string;
  title: string;
  price: number;
  region: string;
  seller: string;
}) {
  const compact = `LISTING|${listing.id}|${listing.title}|${listing.price}|${listing.region}|${listing.seller}`;
  return compact;
}

export function commitmentHash(compact: string) {
  return blake2AsHex(compact);
}

/**
 * Returns the calldata (remark) you should sign with an injected signer.
 * Use api.tx.system.remark(commitHash).signAndSend(...)
 */
export function buildRemark(api: any, commitHex: string) {
  return api.tx.system.remark(commitHex);
}
