# DripDrop Storage Formats Explained

## 📦 Two Ways to Store Files

DripDrop offers two storage formats depending on your needs:

### 1. **Raw Storage** (New!) 🌐
**Best for:** Public plain text files, code, simple documents

```
✅ Direct file storage on IPFS
✅ Viewable via any IPFS gateway without DripDrop app
✅ No JSON wrapper - just the raw content
✅ Perfect for sharing plain text/code publicly
```

**How to enable:**
- ✅ Don't check "Encrypt with password"
- ✅ Check "Store as raw file"

**Example:**
- Upload: `hello.txt` containing `"Hello World"`
- IPFS link: `https://ipfs.io/ipfs/QmXyz123...` 
- **Shows:** `Hello World` ✅ (readable!)

---

### 2. **Wrapped Storage** (Default) 📋
**Best for:** Files needing metadata, signatures, encryption

```
✅ Includes metadata (filename, size, timestamp)
✅ Cryptographic signature from wallet
✅ Blockchain verification
✅ App can display file info, uploader, etc.
```

**Example:**
- Upload: `hello.txt` containing `"Hello World"`
- IPFS link: `https://ipfs.io/ipfs/QmAbc456...`
- **Shows:** JSON with metadata ⚙️
```json
{
  "data": {
    "filename": "hello.txt",
    "type": "text/plain",
    "size": 11,
    "data": [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100],
    "uploadedBy": "5GRMx...",
    "signature": "0x8063...",
    "timestamp": 1760035525567
  }
}
```

---

## 🔍 When to Use Each Format

| Use Case | Format | Why? |
|----------|--------|------|
| **Public blog post** | Raw | Direct readable text via IPFS gateway |
| **Share code snippet** | Raw | Copy-paste friendly, no processing needed |
| **Public documentation** | Raw | Standard viewers can display it |
| **Prove authorship** | Wrapped | Need signature & timestamp |
| **Track who uploaded** | Wrapped | Includes wallet address |
| **Encrypted files** | Wrapped (required) | Encryption needs metadata |
| **Files needing recovery info** | Wrapped | Metadata helps find/identify files |

---

## 💾 Decoding Wrapped Storage

If you access a wrapped file via IPFS and see the JSON, the `data` array is the file content encoded as bytes.

**Example decoding:**
```javascript
// Wrapped JSON from IPFS
{
  "data": {
    "data": [84, 104, 105, 115, 32, 105, 115, 32, 97, 32, 116, 101, 115, 116]
  }
}

// Decode in browser console:
const bytes = [84, 104, 105, 115, 32, 105, 115, 32, 97, 32, 116, 101, 115, 116];
const text = new TextDecoder().decode(new Uint8Array(bytes));
console.log(text); // Output: "This is a test"
```

**Or use DripDrop:**
1. Copy the IPFS CID
2. Go to `Browse` page in DripDrop
3. Paste CID and click `Retrieve`
4. App automatically decodes and displays content

---

## 🎯 Quick Decision Guide

```
Do you need encryption?
├─ YES → Use Wrapped Storage (encryption requires it)
└─ NO → Continue...
    
    Do you want anyone with the link to read it immediately?
    ├─ YES → Use Raw Storage ✅
    └─ NO → Use Wrapped Storage (includes signature/metadata)
```

---

## 🔐 Encryption Note

**Encrypted files ALWAYS use Wrapped Storage** because:
- Encryption metadata (salt, IV) must be stored
- App needs to know file is encrypted
- Signature proves encrypted file authenticity

Raw storage is only available for **unencrypted** files.

---

## 📊 Storage Format Comparison

| Feature | Raw Storage | Wrapped Storage |
|---------|-------------|-----------------|
| **IPFS Gateway Readable** | ✅ Yes | ❌ JSON only |
| **Includes Metadata** | ❌ No | ✅ Yes |
| **Cryptographic Signature** | ⚠️ Separate | ✅ Included |
| **Blockchain Record** | ✅ Optional | ✅ Yes |
| **File Size** | Smaller | ~20% larger |
| **Supports Encryption** | ❌ No | ✅ Yes |
| **DripDrop Required** | ❌ No | ⚠️ For display |
| **Best For** | Public text | Verified files |

---

## 💡 Pro Tips

### For Raw Storage:
- ✅ Perfect for sharing code via IPFS gateways
- ✅ Works with standard IPFS tools (ipfs cat, etc.)
- ✅ Can be embedded in websites directly
- ⚠️ No built-in way to track uploader (unless you add to filename)

### For Wrapped Storage:
- ✅ Proof of ownership via signature
- ✅ Timestamp for version tracking
- ✅ Can track who uploaded what
- ⚠️ Requires DripDrop or custom decoder to view content

---

## 🔗 Example URLs

### Raw Storage:
```
https://ipfs.io/ipfs/QmRawFile123...
→ Shows: "Hello World" (direct text)
```

### Wrapped Storage:
```
https://ipfs.io/ipfs/QmWrapped456...
→ Shows: {"data":{"filename":"hello.txt",...}}
```

**To view wrapped content:**
```
https://dripdrop.app/browse?id=QmWrapped456
→ DripDrop decodes and displays "Hello World"
```

---

## 🎬 Summary

- **Raw Storage** = Maximum compatibility, direct access
- **Wrapped Storage** = Maximum features, verification, metadata

Choose based on your use case! 🚀
