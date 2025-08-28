
import { db } from './db.js';

const listings = [
  {
    id: 'demo-1',
    title: 'IKEA Poäng Armchair',
    description: 'Lightly used, birch veneer with black cushion. Pickup only in Berlin-Friedrichshain.',
    price: 50,
    category: 'furniture',
    region: 'Berlin',
    seller: 'did:example:alice',
    images: ['https://images.unsplash.com/photo-1519710164239-da123dc03ef4'],
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    commitHash: null
  },
  {
    id: 'demo-2',
    title: 'Trek FX 3 Disc Bicycle',
    description: 'Great commuter bike, size M. Minor scratches. Can deliver within the city.',
    price: 420,
    category: 'bikes',
    region: 'Berlin',
    seller: 'did:example:bob',
    images: ['https://images.unsplash.com/photo-1541625602330-2277a4c46182'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    commitHash: null
  }
];

for (const l of listings) {
  db.prepare(`INSERT OR REPLACE INTO listings
    (id, title, description, price, category, region, seller, images, createdAt, commitHash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(l.id, l.title, l.description, l.price, l.category, l.region, l.seller, JSON.stringify(l.images), l.createdAt, l.commitHash);
}

console.log('Seeded demo listings.');
