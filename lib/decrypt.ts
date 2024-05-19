// lib/decrypt.ts

import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');

interface EncryptedData {
  iv: string;
  encryptedData: string;
}

function decrypt(encryptedData: EncryptedData): string {
  try {
    const ivBuffer = Buffer.from(encryptedData.iv, 'hex');
    const encryptedTextBuffer = Buffer.from(encryptedData.encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
    let decrypted = decipher.update(encryptedTextBuffer, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Unable to decrypt data");
  }
}

export default decrypt;
