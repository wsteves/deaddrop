// Lightweight wrapper that lazily imports heavy polkadot modules.
export async function initApi() {
  const [{ ApiPromise, WsProvider }] = await Promise.all([import('@polkadot/api')]);
  const endpoint = (import.meta as any).env?.VITE_WS_ENDPOINT || 'wss://westend-rpc.polkadot.io';
  const provider = new WsProvider(endpoint);
  const api = await ApiPromise.create({ provider });
  return api;
}

export async function ensureExtension(appName='Polka Kleinanzeigen') {
  const { web3Enable } = await import('@polkadot/extension-dapp');
  const exts = await web3Enable(appName);
  if (!exts.length) throw new Error('No Polkadot extension found/authorized.');
  return exts;
}

export async function connectExtension(appName='Polka Kleinanzeigen') {
  // Calls web3Enable and returns web3Accounts list
  await ensureExtension(appName);
  const { web3Accounts } = await import('@polkadot/extension-dapp');
  const accs = await web3Accounts();
  return accs;
}

export async function computeCommit(listing: any) {
  // accept both legacy listing shape and new job shape; normalize into the chain's listing shape
  const adapted: any = {
    id: listing.id,
    title: listing.title,
    price: listing.price ?? (listing.salary ?? 0),
    region: listing.region ?? (listing.location ?? ''),
    seller: listing.seller ?? (listing.contact ?? ''),
    salaryMin: listing.salaryMin ?? null,
    salaryMax: listing.salaryMax ?? null,
    employmentType: listing.employmentType ?? null,
    level: listing.level ?? null,
    remote: listing.remote ?? false,
    tags: listing.tags ?? null,
    benefits: listing.benefits ?? null,
  };
  // lazy import chain helpers in a browser-safe way
  const mod = await import('@polka-kleinanzeigen/chain');
  const { listingCommitString, commitmentHash } = mod as any;
  const s = listingCommitString(adapted as any);
  const hex = commitmentHash(s);
  return { compact: s, hex };
}

export async function signRemark(api: any, fromAddress: string, hex: string): Promise<string> {
  const { web3FromAddress } = await import('@polkadot/extension-dapp');
  const injector = await web3FromAddress(fromAddress);
  const { buildRemark } = require('@polka-kleinanzeigen/chain');
  const tx = buildRemark(api, hex);
  return new Promise((resolve, reject) => {
    tx.signAndSend(fromAddress, { signer: injector.signer }, (result: any) => {
      const { status, dispatchError } = result;
      if (dispatchError) return reject(String(dispatchError));
      if (status && status.isInBlock) {
        return resolve(status.asInBlock.toString());
      }
    }).catch(reject);
  });
}
