// Minimal client-side crypto helpers.
// - Uses Web Crypto (AES-GCM) for symmetric encryption.
// - Attempts to dynamically load libsodium-wrappers-sumo to create sealed boxes for recipient x25519 public keys.
// - If libsodium is not available, falls back to returning the raw symmetric key base64 (INSECURE; for demo only).

export async function generateSymmetricKey() {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  return { key, raw } as { key: CryptoKey; raw: Uint8Array };
}

export function bufToBase64(b: Uint8Array) {
  let binary = '';
  const len = b.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(b[i]);
  return btoa(binary);
}

export function base64ToBuf(s: string) {
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export async function encryptWithKeyRaw(rawKey: Uint8Array, plaintext: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const alg = { name: 'AES-GCM', iv };
  const key = await crypto.subtle.importKey('raw', rawKey.buffer as ArrayBuffer, alg, false, ['encrypt']);
  const enc = new TextEncoder().encode(plaintext);
  const ct = new Uint8Array(await crypto.subtle.encrypt(alg, key, enc));
  return {
    ciphertextBase64: bufToBase64(ct),
    ivBase64: bufToBase64(iv)
  };
}

export async function sealKeyForRecipient(rawKey: Uint8Array, recipientPubBase64: string) {
  // Try to use libsodium if available
  try {
    // dynamic import so the dependency is optional
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mod = await import('libsodium-wrappers-sumo');
    await (mod as any).ready;
    const sodiumLib = (mod as any).default || mod;
    if (!recipientPubBase64) {
      console.warn('sealKeyForRecipient called without recipient public key');
      return bufToBase64(rawKey);
    }
    const recipientPub = sodiumLib.from_base64(recipientPubBase64, sodiumLib.base64_variants.ORIGINAL);
    const msg = new Uint8Array(rawKey);
    const sealed = sodiumLib.crypto_box_seal(msg, recipientPub);
    const sealedB64 = sodiumLib.to_base64(sealed, sodiumLib.base64_variants.ORIGINAL);
    return sealedB64;
  } catch (err) {
    // Try tweetnacl sealedbox fallback
    try {
      const sealedbox = await import('tweetnacl-sealedbox-js');
      const nacl = await import('tweetnacl');
      const recipientPub = base64ToBuf(recipientPubBase64);
      const sealed = sealedbox.seal(rawKey, recipientPub);
      return bufToBase64(new Uint8Array(sealed));
    } catch (e2) {
      console.warn('sealedbox fallback not available; returning raw symmetric key as base64 (INSECURE). Error1:', err, 'Error2:', e2);
      return bufToBase64(rawKey);
    }
  }
}

export async function decryptWithKeyRaw(rawKey: Uint8Array, ivBase64: string, ciphertextBase64: string) {
  const iv = base64ToBuf(ivBase64);
  const ct = base64ToBuf(ciphertextBase64);
  const alg = { name: 'AES-GCM', iv };
  const key = await crypto.subtle.importKey('raw', rawKey.buffer as ArrayBuffer, alg, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt(alg, key, ct);
  return new TextDecoder().decode(pt as ArrayBuffer);
}
