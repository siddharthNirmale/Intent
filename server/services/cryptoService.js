import crypto from 'crypto';

/**
 * Derives a 32-byte (256-bit) encryption key from the environment secret
 */
function getDerivedKey() {
  const secret =
    process.env.ENCRYPTION_SECRET ||
    process.env.JWT_SECRET ||
    'intent_compiler_fallback_secure_key_32bytes!';
  
  // Use scrypt to derive a uniform 32-byte key with a stable salt
  return crypto.scryptSync(secret, 'intent-compiler-aes-salt', 32);
}

/**
 * Encrypts sensitive text (e.g. API keys) using AES-256-GCM authenticated encryption.
 * @param {string} plaintext - The plain secret string to encrypt
 * @returns {{ encrypted: string, iv: string, authTag: string }} Hex-encoded encryption packet
 */
export function encryptApiKey(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    return { encrypted: '', iv: '', authTag: '' };
  }

  const key = getDerivedKey();
  const iv = crypto.randomBytes(16); // 128-bit random IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted packet back to plaintext.
 * @param {{ encrypted: string, iv: string, authTag: string }} packet
 * @returns {string} Decrypted plaintext string, or empty string on failure
 */
export function decryptApiKey({ encrypted, iv, authTag }) {
  if (!encrypted || !iv || !authTag) {
    return '';
  }

  try {
    const key = getDerivedKey();
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    // Never leak details in error; ciphertext tampering or invalid key
    console.error('[CryptoService] Decryption failed (integrity check mismatch or invalid key).');
    return '';
  }
}

export default {
  encryptApiKey,
  decryptApiKey,
};
