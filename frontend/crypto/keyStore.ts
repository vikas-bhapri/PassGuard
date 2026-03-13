// In-memory storage for sensitive CryptoKey objects
// These keys are kept in memory only and never persisted

let vaultKey: CryptoKey | null = null;

export const setVaultKey = (key: CryptoKey | null): void => {
  vaultKey = key;
};

export const getVaultKey = (): CryptoKey | null => {
  return vaultKey;
};

export const clearVaultKey = (): void => {
  vaultKey = null;
};

export const hasVaultKey = (): boolean => {
  return vaultKey !== null;
};
