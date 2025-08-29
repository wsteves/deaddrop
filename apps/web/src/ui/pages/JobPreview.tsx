import React from 'react';
import { Card, Button } from '../components/DesignSystem';

export default function JobPreview() {
  let p: any = null;
  try { p = JSON.parse(localStorage.getItem('jobPreview') || 'null'); } catch {}
  if (!p) return <div className="p-8 text-center text-slate-400">No preview saved</div>;
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-gray-900 text-white py-12">
      <div className="container mx-auto">
        <Card className="p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold">{p.title}</h1>
              <div className="text-slate-300 mt-2">{p.company} · {p.location} · {p.tags}</div>
              <p className="mt-4 text-slate-300">{p.description}</p>
            </div>
            <aside className="text-right">
              <div className="text-slate-400">Salary</div>
              <div className="text-xl font-semibold mt-2">{p.salary ? `${p.salary} €` : 'TBD'}</div>
              <div className="mt-6"><Button onClick={() => navigator.clipboard?.writeText(window.location.href)}>Share</Button></div>
            </aside>
          </div>
        </Card>
      </div>
    </div>
  );
}
