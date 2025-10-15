# DripDrop Encryption Model Explained

## 🔐 How Encryption Works

### **WITHOUT Password Protection (Default)**
When you upload a file **without checking "Password protect this file"**:

1. ✅ **File is uploaded to IPFS in PLAIN TEXT**
2. ✅ **Anyone with the IPFS link CAN read the file**
3. ✅ **File is publicly accessible via IPFS gateways**
4. ✅ **You sign the upload with your wallet** (proves who uploaded it)
5. ✅ **Metadata is stored on Westend blockchain** (CID, filename, size, timestamp)

**Example:**
- You upload `vacation-photo.jpg` without password
- IPFS CID: `QmXyz123...`
- Anyone with `https://ipfs.io/ipfs/QmXyz123...` can view the photo
- The blockchain proves YOU uploaded it (via wallet signature)

---

### **WITH Password Protection** 
When you upload a file **with "Password protect this file" checked**:

1. 🔒 **File is encrypted BEFORE uploading to IPFS**
2. 🔒 **IPFS stores the ENCRYPTED version only**
3. 🔒 **Anyone with the link sees ENCRYPTED DATA (gibberish)**
4. 🔒 **Only people with the password can decrypt it**
5. 🔒 **You sign the encrypted file with your wallet**
6. 🔒 **Metadata shows `encrypted: true` on blockchain**

**Encryption Details:**
- **Algorithm**: AES-GCM-256 
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Random Salt**: 16 bytes (prevents rainbow table attacks)
- **Random IV**: 12 bytes (ensures unique encryption each time)
- **Format**: `[salt(16) + iv(12) + encrypted_data]`

**Example:**
- You upload `confidential-report.pdf` with password "SecurePass123"
- File is encrypted in your browser
- IPFS stores: `�²�k��ñ�...` (encrypted gibberish)
- IPFS CID: `QmAbc456...`
- Anyone visiting `https://ipfs.io/ipfs/QmAbc456...` sees encrypted data
- Only with password "SecurePass123" can someone decrypt it

---

## 🌐 Public Link Security

### If Someone Has Your IPFS Link:

| Scenario | Can They Read It? |
|----------|-------------------|
| **No password** | ✅ YES - File is public |
| **With password** | ❌ NO - They see encrypted data |
| **With password + they guess password** | ✅ YES - Password unlocks file |

### Important Notes:

1. **IPFS is Content-Addressed Storage**
   - Files are stored by their content hash (CID)
   - Same file always gets same CID
   - If file changes, CID changes

2. **IPFS Gateways Are Public**
   - Anyone can access IPFS content via public gateways
   - `ipfs.io`, `cloudflare-ipfs.com`, `dweb.link`, etc.
   - This is by design - IPFS is for sharing!

3. **Encryption Happens Client-Side**
   - Your browser encrypts the file BEFORE upload
   - Server never sees the password
   - Password never leaves your computer
   - Server never sees unencrypted data

4. **Wallet Signature is NOT Encryption**
   - Signing with wallet proves WHO uploaded it
   - Does NOT encrypt the content
   - Think of it as a "digital signature" or "seal of authenticity"

---

## 🎯 When to Use Password Protection

### ✅ **Use Password Protection For:**
- Confidential documents
- Private photos/videos
- Sensitive data
- Files you want to share only with specific people who know the password

### ❌ **Don't Use Password Protection For:**
- Public files you want to share widely
- Files you want searchable/indexable
- Content you want easily accessible
- When you might forget the password (NO RECOVERY POSSIBLE!)

---

## 🔑 Password Best Practices

### **Strong Password Example:**
```
MySecret2025!DripDrop#FileShare
```

### **Weak Password (DON'T USE):**
```
password123
```

### **Important Warnings:**
⚠️ **NO PASSWORD RECOVERY** - If you forget the password, the file is permanently lost  
⚠️ **SHARE PASSWORD SEPARATELY** - Send password via different channel (Signal, phone, etc.)  
⚠️ **PASSWORD IS THE KEY** - Anyone with the password can decrypt the file  

---

## 📊 Current System Limits

| Component | Limit | Notes |
|-----------|-------|-------|
| **File Size** | 100 MB | Configurable on server |
| **IPFS Network** | ~2 GB | Practical limit for single file |
| **Browser Memory** | Varies | Modern browsers handle several GB |
| **Encryption Speed** | ~50-100 MB/s | Depends on device |
| **Blockchain Metadata** | ~10 KB | Only stores CID + metadata, not file |

---

## 🛡️ Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR BROWSER                             │
│  ┌────────────┐      ┌──────────────┐      ┌─────────────┐ │
│  │   Select   │──────│   Encrypt    │──────│    Upload   │ │
│  │    File    │      │ (if password)│      │   to IPFS   │ │
│  └────────────┘      └──────────────┘      └─────────────┘ │
│         │                    │                      │        │
│         │                    │                      │        │
│    Password entered?         │              Encrypted bytes  │
│         │                    │                      │        │
│         ▼                    ▼                      ▼        │
│    Plain bytes ────NO─────> IPFS          Encrypted bytes   │
│                                                      │        │
└──────────────────────────────────────────────────────┼───────┘
                                                       │
                                                       ▼
                                        ┌─────────────────────────┐
                                        │   IPFS (Public Storage) │
                                        │  Anyone can download    │
                                        │  encrypted blob         │
                                        └─────────────────────────┘
                                                       │
                                                       ▼
                                        ┌─────────────────────────┐
                                        │  Westend Blockchain     │
                                        │  Stores: CID, filename, │
                                        │  size, encrypted flag   │
                                        └─────────────────────────┘
```

---

## 💡 Example Use Cases

### **Public File Sharing (No Password)**
```
Scenario: Share open-source code, public documents, memes
Upload: No password checkbox
Result: Anyone with link can access immediately
Security: Wallet signature proves authenticity
```

### **Private File Sharing (With Password)**
```
Scenario: Share confidential contract with business partner
Upload: Check password checkbox, enter "Acme2025Contract!"
Share: Send IPFS link via email, send password via Signal
Result: Only person with password can decrypt and read
Security: Even if link leaks, file remains encrypted
```

### **Proof of Upload (Blockchain Record)**
```
Scenario: Prove you had a document on specific date
Upload: With or without password
Result: Blockchain has immutable record of:
  - File hash (CID)
  - Upload timestamp
  - Your wallet address (signature)
  - File size and name
Use: Legal proof, timestamp verification, authenticity
```

---

## 🔍 How to Verify Encryption Status

1. **Upload a file with password**
2. Copy the IPFS link (e.g., `https://ipfs.io/ipfs/QmXyz...`)
3. Open link in private/incognito browser
4. **See encrypted gibberish?** ✅ File is encrypted
5. **See readable content?** ❌ File was uploaded without encryption

---

## ⚡ Quick Summary

| Feature | What It Does | Security Level |
|---------|--------------|----------------|
| **No Password** | Public file on IPFS | 🔓 Anyone can read |
| **With Password** | Encrypted file on IPFS | 🔒 Only password holders can read |
| **Wallet Signature** | Proves who uploaded | ✍️ Authenticity verification |
| **Blockchain Record** | Immutable upload proof | 📜 Timestamp + metadata |

**Bottom Line:**  
- Want it public? → Don't use password
- Want it private? → Use strong password
- Want proof you uploaded it? → Connect wallet and sign

Password = Privacy 🔐
