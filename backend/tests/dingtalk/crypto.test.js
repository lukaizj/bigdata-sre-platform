// Set a test encryption key BEFORE importing crypto module
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.NODE_ENV = 'test';

const { encrypt, decrypt, resetKey } = require('../../src/utils/crypto');

describe('Crypto Utils', () => {
  beforeEach(() => {
    // Reset key cache before each test
    resetKey();
  });

  describe('encrypt', () => {
    it('should encrypt a non-empty string', () => {
      const plaintext = 'my secret message';
      const ciphertext = encrypt(plaintext);

      expect(ciphertext).toBeDefined();
      expect(typeof ciphertext).toBe('string');
      expect(ciphertext.length).toBeGreaterThan(0);
      expect(ciphertext).not.toBe(plaintext);
    });

    it('should return empty string for empty input', () => {
      expect(encrypt('')).toBe('');
      expect(encrypt(null)).toBe('');
      expect(encrypt(undefined)).toBe('');
    });

    it('should produce different ciphertexts for same plaintext (random IV)', () => {
      const plaintext = 'same message';
      const cipher1 = encrypt(plaintext);
      const cipher2 = encrypt(plaintext);

      expect(cipher1).toBeDefined();
      expect(cipher2).toBeDefined();
      // Different IVs should produce different ciphertexts
      expect(cipher1).not.toBe(cipher2);
    });

    it('should produce valid format (iv:authTag:encryptedData)', () => {
      const plaintext = 'test message';
      const ciphertext = encrypt(plaintext);

      const parts = ciphertext.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toMatch(/^[0-9a-f]{32}$/); // IV: 16 bytes = 32 hex chars
      expect(parts[1]).toMatch(/^[0-9a-f]{32}$/); // AuthTag: 16 bytes = 32 hex chars
      expect(parts[2]).toMatch(/^[0-9a-f]+$/);   // Encrypted data
    });

    it('should encrypt long strings', () => {
      const plaintext = 'a'.repeat(10000);
      const ciphertext = encrypt(plaintext);

      expect(ciphertext).toBeDefined();
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it('should encrypt unicode characters', () => {
      const plaintext = '你好世界 🎉 Hello';
      const ciphertext = encrypt(plaintext);

      expect(ciphertext).toBeDefined();
      expect(decrypt(ciphertext)).toBe(plaintext);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text back to original', () => {
      const plaintext = 'my secret message';
      const ciphertext = encrypt(plaintext);
      const decrypted = decrypt(ciphertext);

      expect(decrypted).toBe(plaintext);
    });

    it('should return empty string for empty input', () => {
      expect(decrypt('')).toBe('');
      expect(decrypt(null)).toBe('');
      expect(decrypt(undefined)).toBe('');
    });

    it('should return empty string for invalid format', () => {
      expect(decrypt('invalid')).toBe('');
      expect(decrypt('invalid:format')).toBe('');
      expect(decrypt('invalid:format:here:extra')).toBe('');
    });

    it('should return empty string for invalid ciphertext', () => {
      // Valid format but invalid hex values
      expect(decrypt('0123456789abcdef0123456789abcdef:0123456789abcdef0123456789abcdef:invalid')).toBe('');
    });

    it('should return empty string for corrupted auth tag', () => {
      const plaintext = 'test message';
      const ciphertext = encrypt(plaintext);

      // Corrupt the auth tag
      const parts = ciphertext.split(':');
      const corruptedAuthTag = parts[1].replace(/a/g, 'b');
      const corrupted = `${parts[0]}:${corruptedAuthTag}:${parts[2]}`;

      expect(decrypt(corrupted)).toBe('');
    });

    it('should return empty string for corrupted IV', () => {
      const plaintext = 'test message';
      const ciphertext = encrypt(plaintext);

      // Corrupt the IV
      const parts = ciphertext.split(':');
      const corruptedIV = parts[0].replace(/a/g, 'b');
      const corrupted = `${corruptedIV}:${parts[1]}:${parts[2]}`;

      expect(decrypt(corrupted)).toBe('');
    });

    it('should return empty string for corrupted encrypted data', () => {
      const plaintext = 'test message';
      const ciphertext = encrypt(plaintext);

      // Corrupt the encrypted data by changing a character
      const parts = ciphertext.split(':');
      // Ensure we actually change something
      const data = parts[2];
      const corruptedData = data.length > 0 ? data.slice(0, -2) + 'ff' : 'ff';
      const corrupted = `${parts[0]}:${parts[1]}:${corruptedData}`;

      expect(decrypt(corrupted)).toBe('');
    });
  });

  describe('encrypt/decrypt roundtrip', () => {
    it('should handle multiple encrypt/decrypt cycles', () => {
      const messages = [
        'Hello, World!',
        '12345',
        'Special chars: !@#$%^&*()',
        'Multi\nline\ntext',
        '{"json": "data"}',
      ];

      for (const msg of messages) {
        const encrypted = encrypt(msg);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(msg);
      }
    });
  });
});