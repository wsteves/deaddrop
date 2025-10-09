# DripDrop IPFS Storage Format

## Overview
DripDrop stores files on IPFS with additional metadata for authentication, encryption status, and timestamping. This means the raw IPFS content includes a JSON wrapper around your file data.

## Why Use a JSON Wrapper?

### Benefits:
1. **Authentication**: Cryptographic signatures prove who uploaded the file
2. **Timestamping**: On-chain and off-chain timestamps for verification
3. **Encryption Status**: Clear indication if file is encrypted
4. **Metadata**: Filename, size, type preserved
5. **Compatibility**: Works with Polkadot wallet signing

### Trade-offs:
- Raw IPFS links show JSON instead of direct file content
- Slightly larger file sizes (metadata overhead)
- Requires DripDrop to properly parse and display

## Storage Format

When you upload a file to DripDrop, it's stored on IPFS as:

```json
{
  "data": {
    "filename": "message.txt",
    "type": "text/plain",
    "size": 28,
    "data": [84, 104, 105, 115, ...],  // File bytes as array
    "uploadedBy": "5GRMx56sJdDK...",   // Polkadot address
    "timestamp": 1760035525567,
    "encrypted": false,
    "signature": "0x8063...",           // Wallet signature
    "signedMessage": "DripDrop Upload: ..."
  },
  "timestamp": 1760035532280,
  "version": "1.0",
  "network": "crust-rocky",
  "stored_by": "5Esy5NaR8UUM..."
}
```

## How to Access Files

### ✅ **Recommended: Use DripDrop**
DripDrop automatically:
- Parses the JSON wrapper
- Extracts the file data
- Displays content correctly
- Shows metadata (signature, timestamp, etc.)
- Allows downloading the raw file

### 🔧 **Alternative: Manual Extraction**

If you access raw IPFS links, you'll see the JSON. To extract the file:

#### 1. Via Browser Console:
```javascript
// Fetch the JSON from IPFS
const response = await fetch('https://ipfs.io/ipfs/YOUR_CID');
const json = await response.json();

// Extract file data
const fileBytes = new Uint8Array(json.data.data);
const blob = new Blob([fileBytes], { type: json.data.type });

// Download or view
const url = URL.createObjectURL(blob);
window.open(url);
```

#### 2. Via Command Line:
```bash
# Download the JSON
curl -o wrapped.json https://ipfs.io/ipfs/YOUR_CID

# Extract with jq (for text files)
cat wrapped.json | jq -r '.data.data | map([.] | implode) | add'

# For binary files, use a script to convert the byte array
```

#### 3. Via Python:
```python
import requests
import json

# Fetch from IPFS
response = requests.get('https://ipfs.io/ipfs/YOUR_CID')
data = response.json()

# Extract file bytes
file_bytes = bytes(data['data']['data'])

# Save to file
with open(data['data']['filename'], 'wb') as f:
    f.write(file_bytes)
```

## Why Not Store Raw Files?

**We considered storing raw files on IPFS, but chose the wrapper approach for:**

### Security & Trust:
- **Provenance**: Signature proves who uploaded the file
- **Integrity**: Timestamp proves when it was uploaded
- **Verification**: On-chain records link to off-chain storage

### Functionality:
- **Encryption Awareness**: Apps know if file needs decryption
- **Metadata Preservation**: Original filename and type maintained
- **Compatibility**: Works with Polkadot ecosystem

### Future Features:
- Version history
- Access control lists
- Collaborative editing
- Content updates with signature chains

## Best Practices

### 📤 **When Uploading:**
- Use descriptive filenames
- Check encryption option for sensitive data
- Connect wallet for signatures
- Note the CID for future reference

### 📥 **When Sharing:**
- Share DripDrop links (`https://dripdrop.app/browse?id=CID`)
- If sharing raw IPFS links, explain they need DripDrop to view properly
- For encrypted files, share password separately (Signal, in person, etc.)

### 🔍 **When Accessing:**
- Use DripDrop Browse page for best experience
- Download files to get raw content without JSON wrapper
- Check signature and timestamp for authenticity
- Verify encryption status before sharing

## Raw File Access in DripDrop

DripDrop provides multiple ways to access raw content:

### 1. **Download Button**
- Extracts file bytes from JSON
- Creates blob with correct MIME type
- Downloads as original filename
- ✅ **No JSON wrapper in downloaded file**

### 2. **"Open Raw Text" Button** (text files only)
- Decodes file bytes to text
- Opens in new tab as plain text
- ✅ **Shows just the text content**

### 3. **Preview Section**
- Images: Displays directly
- Text: Shows decoded content
- Other: Shows metadata summary

## Example Use Cases

### Public Announcement
```
Upload: Plain text message, no encryption
Share: IPFS gateway link
Result: Anyone can read via DripDrop
```

### Private Document
```
Upload: PDF with password encryption
Share: IPFS link + password separately
Result: Only password holders can decrypt
```

### Verified Upload
```
Upload: Any file with wallet signature
Share: IPFS link + blockchain proof
Result: Cryptographic proof of authenticity
```

## Technical Details

### File Data Encoding
- Files converted to `Uint8Array`
- Stored as JSON array of integers (0-255)
- Example: `"Hello"` becomes `[72, 101, 108, 108, 111]`

### Signature Format
- Uses Polkadot sr25519 signing
- Signs: `"DripDrop Upload: {filename} ({size} bytes) at {timestamp}"`
- Signature stored as hex string with `0x` prefix

### Encryption Format (when enabled)
- Algorithm: AES-GCM-256
- Key derivation: PBKDF2 (100,000 iterations)
- Format: `[salt(16) + iv(12) + encrypted_data]`
- Encrypted bytes replace original file data

## Future Improvements

We're considering:
1. **Optional raw storage**: Toggle for direct file storage
2. **Sidecar metadata**: Store JSON separately, link via filename
3. **Custom IPFS gateway**: DripDrop-aware gateway that auto-extracts
4. **Browser extension**: Automatically handle JSON wrapper in any gateway

## Questions?

- **Q: Can I upload files without the JSON wrapper?**
  - A: Not currently, but it's on the roadmap

- **Q: Does the wrapper make files larger?**
  - A: Yes, typically 200-500 bytes of metadata overhead

- **Q: Can other apps read my files?**
  - A: Yes, if they understand the DripDrop JSON format

- **Q: Are signatures required?**
  - A: No, but recommended for authenticity verification

- **Q: What if I lose the password?**
  - A: Encrypted files are permanently inaccessible without the password

---

**Built with ❤️ on Polkadot & IPFS**
