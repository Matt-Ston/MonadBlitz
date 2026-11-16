// Live addresses and token list, read from Person 1's deployment file.
import deployment from '../../contracts/deployments/monad-testnet.json';
import type { Hex, Rarity } from './types';

export interface DeployedToken {
  index: number;
  symbol: string;
  name: string;
  rarity: Rarity;
  address: Hex;
  color: string;
}

export const PACK_VAULT = deployment.packVault.toLowerCase() as Hex;
export const PRICE_ORACLE = deployment.priceOracle.toLowerCase() as Hex;
/** IR-4: the vault has the deposit bank (`deposit`, `withdrawBank`, `openPacksFromBank`). Set by Person 1 in the deployment file. */
export const BANK_SUPPORTED: boolean = (deployment as { bank?: boolean }).bank === true;

export const TOKENS: DeployedToken[] = deployment.tokens.map((t) => ({
  index: t.index,
  symbol: t.symbol,
  name: t.name,
  rarity: t.rarity as Rarity,
  address: t.address.toLowerCase() as Hex,
  color: t.color,
}));

const BY_ADDRESS = new Map(TOKENS.map((t) => [t.address as string, t]));
export const tokenByAddress = (address: string): DeployedToken | undefined => BY_ADDRESS.get(address.toLowerCase());
