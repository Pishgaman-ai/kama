import crypto from 'crypto';

// This key should be stored in environment variables in production
const ENCRYPTION_KEY = process.env.PASSWORD_ENCRYPTION_KEY || 'your-32-char-secret-key-change-this!!'; // Must be 32 characters
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts a password for storage
 * @param password - The plain text password to encrypt
 * @returns The encrypted password as a string (iv:encrypted)
 */
export function encryptPassword(password: string): string {
  // Ensure the key is 32 bytes (256 bits)
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32), 'utf8');

  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the password
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return iv:encrypted format
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a password from storage
 * @param encryptedPassword - The encrypted password string (iv:encrypted)
 * @returns The decrypted plain text password
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    // Ensure the key is 32 bytes (256 bits)
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32), 'utf8');

    // Split the iv and encrypted data
    const parts = encryptedPassword.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted password format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Decrypt the password
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error decrypting password:', error);
    throw new Error('Failed to decrypt password');
  }
}
