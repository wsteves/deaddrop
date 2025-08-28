
import { useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

export default function Wallet() {
  const [endpoint, setEndpoint] = useState(import.meta.env.VITE_WS_ENDPOINT || 'wss://westend-rpc.polkadot.io');
  const [chain, setChain] = useState('');
  const [version, setVersion] = useState('');

  useEffect(() => {
    (async () => {
      const api = await ApiPromise.create({ provider: new WsProvider(endpoint) });
      const [systemChain, nodeVersion] = await Promise.all([api.rpc.system.chain(), api.rpc.system.version()]);
      setChain(systemChain.toString());
      setVersion(nodeVersion.toString());
      await api.disconnect();
    })().catch(e => console.error(e));
  }, [endpoint]);

  return (
    <div className="card space-y-4 max-w-xl">
      <h2 className="font-semibold text-xl">Chain connection</h2>
      <div>
        <div className="label">WS Endpoint</div>
        <input className="input" value={endpoint} onChange={e=>setEndpoint(e.target.value)} />
      </div>
      <div className="text-sm text-gray-600">Chain: {chain || '…'} · Node version: {version || '…'}</div>
      <p className="text-sm text-gray-600">Use the Polkadot browser extension to sign transactions.</p>
    </div>
  );
}
