
import { useEffect, useState } from 'react';
import { web3Enable, web3Accounts, isWeb3Injected } from '@polkadot/extension-dapp';
import { ApiPromise, WsProvider } from '@polkadot/api';

export default function Wallet() {
  const [endpoint, setEndpoint] = useState(import.meta.env.VITE_WS_ENDPOINT || 'wss://westend-rpc.polkadot.io');
  const [chain, setChain] = useState('');
  const [version, setVersion] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [extStatus, setExtStatus] = useState('');

  useEffect(() => {
    (async () => {
      const api = await ApiPromise.create({ provider: new WsProvider(endpoint) });
      const [systemChain, nodeVersion] = await Promise.all([api.rpc.system.chain(), api.rpc.system.version()]);
      setChain(systemChain.toString());
      setVersion(nodeVersion.toString());
      await api.disconnect();
    })().catch(e => console.error(e));
  }, [endpoint]);

  useEffect(() => {
    (async () => {
      if (!isWeb3Injected) {
        setExtStatus('No Polkadot wallet extension found. Install Talisman or Polkadot.js.');
        setAccounts([]);
        return;
      }
      setExtStatus('Wallet extension detected.');
      await web3Enable('Polka Kleinanzeigen');
      const accs = await web3Accounts();
      setAccounts(accs);
      if (accs.length) setSelected(accs[0].address);
    })();
  }, []);

  return (
    <div className="card space-y-6 max-w-xl bg-white shadow-lg rounded-xl p-6">
      <h2 className="font-bold text-2xl mb-2 flex items-center gap-2">
        <span className="text-yellow-600">🛒</span> Wallet & Chain Connection
      </h2>
      <div className="flex flex-col gap-2">
        <label className="label">WS Endpoint</label>
        <input className="input" value={endpoint} onChange={e=>setEndpoint(e.target.value)} />
        <div className="text-sm text-gray-600">Chain: {chain || '…'} · Node version: {version || '…'}</div>
      </div>
      <div className="mt-4">
        <div className="font-semibold mb-1">Wallet Extension Status:</div>
        <div className="text-sm text-gray-700 mb-2">{extStatus}</div>
        {accounts.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="label">Select Account</label>
            <select className="input" value={selected} onChange={e=>setSelected(e.target.value)}>
              {accounts.map(acc => (
                <option key={acc.address} value={acc.address}>{acc.meta.name || 'Account'} - {acc.address}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500">Connected: {selected}</div>
          </div>
        )}
        {accounts.length === 0 && (
          <div className="text-xs text-red-500">No accounts found. Open your wallet extension and authorize this app.</div>
        )}
      </div>
      <p className="text-sm text-gray-600 mt-4">Use Talisman or Polkadot.js browser extension to sign transactions and interact with the chain.</p>
    </div>
  );
}
