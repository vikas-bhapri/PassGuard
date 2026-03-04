// In-memory storage for sensitive CryptoKey objects
// These keys are kept in memory only and never persisted

let vaultKey: CryptoKey | null = null;

export const setVaultKey = (key: CryptoKey | null): void => {
  vaultKey = key;
  console.log("Vault key stored in memory:", key ? "✓" : "✗", key);
};

export const getVaultKey = (): CryptoKey | null => {
  return vaultKey;
};

export const clearVaultKey = (): void => {
  vaultKey = null;
  console.log("Vault key cleared from memory");
};

export const hasVaultKey = (): boolean => {
  return vaultKey !== null;
};
