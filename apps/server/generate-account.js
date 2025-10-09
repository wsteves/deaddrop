// Generate a new Crust Rocky Network account
const crypto = require('crypto');

// Generate a simple demo mnemonic for Rocky testnet
const words = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident'];
const mnemonic = words.slice(0, 12).join(' ') + '//rocky-' + crypto.randomBytes(4).toString('hex');

console.log('🆕 Rocky Network Test Account:');
console.log('=================================');
console.log('Mnemonic:', mnemonic);
console.log('');
console.log('📝 To use this account:');
console.log('1. Set environment variable: export CRUST_SEEDS="' + mnemonic + '"');
console.log('2. Restart the server');
console.log('3. Get test tokens from Rocky faucet using the new address');
console.log('');
console.log('💡 Current demo account: 5Esy5NaR8UUMyjw6UPrTpANZbkr4va3nUC3xCijGa6sVz5UZ');
console.log('   You can request tokens for this address or generate a new one.');
