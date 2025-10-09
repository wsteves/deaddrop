(async () => {
  try {
  const sealedbox = await import('tweetnacl-sealedbox-js');
  const nacl = await import('tweetnacl');
  const kp = nacl.box.keyPair();
  const msg = new Uint8Array([1,2,3,4,5]);
  const sealed = sealedbox.seal(msg, kp.publicKey);
  const opened = sealedbox.open(sealed, kp.publicKey, kp.secretKey);
  console.log('sealed length', sealed.length, 'opened equals original:', opened && opened.length === msg.length);
  } catch (e) {
    console.error('libsodium test failed:', e);
    process.exit(2);
  }
})();
