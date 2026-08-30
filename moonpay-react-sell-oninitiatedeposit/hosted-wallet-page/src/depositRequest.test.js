import { describe, expect, test } from 'vitest';

import {
  MAX_AMOUNT_ETH,
  buildReturnUrl,
  parseDepositRequest,
  validateAmount,
  validateCryptoCode,
  validateWalletAddress,
} from './depositRequest';

const VALID_ADDRESS = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';

describe('validateWalletAddress', () => {
  test('accepts a valid address and returns the checksummed form', () => {
    const result = validateWalletAddress(VALID_ADDRESS.toLowerCase());
    expect(result).toEqual({ ok: true, address: VALID_ADDRESS });
  });

  test('rejects a non-address string — the parameter-tampering guard', () => {
    expect(validateWalletAddress('0xnot-an-address').ok).toBe(false);
    expect(validateWalletAddress('vitalik.eth').ok).toBe(false);
  });

  test('rejects a truncated address', () => {
    expect(validateWalletAddress('0x5B38Da6a701c568545dCfcB03FcB875f56bedd').ok).toBe(false);
  });

  test('rejects the zero address, which would burn the funds', () => {
    expect(validateWalletAddress(`0x${'0'.repeat(40)}`).ok).toBe(false);
  });

  test('rejects missing and non-string values', () => {
    for (const value of [null, undefined, '', '   ', 42]) {
      expect(validateWalletAddress(value).ok).toBe(false);
    }
  });
});

describe('validateAmount', () => {
  test('converts a plain decimal to wei without going through a float', () => {
    expect(validateAmount('0.05')).toEqual({ ok: true, amount: '0.05', wei: '50000000000000000' });
  });

  test('preserves precision that Number() would have destroyed', () => {
    // Number('0.0000001').toString() === '1e-7', which web3.utils.toWei rejects.
    // 0.0000001 ETH is 1e-7 * 1e18 = 1e11 wei.
    const result = validateAmount('0.0000001');
    expect(result.ok).toBe(true);
    expect(result.wei).toBe('100000000000');
  });

  test('preserves full 18-decimal precision', () => {
    const result = validateAmount('1.000000000000000001');
    expect(result.ok).toBe(true);
    expect(result.wei).toBe('1000000000000000001');
  });

  test('rejects exponential notation, hex, and non-numeric input', () => {
    for (const value of ['1e-7', '0x10', 'NaN', 'Infinity', '1,5', '--1']) {
      expect(validateAmount(value).ok).toBe(false);
    }
  });

  test('rejects negative and zero amounts', () => {
    expect(validateAmount('-1').ok).toBe(false);
    expect(validateAmount('0').ok).toBe(false);
    expect(validateAmount('0.000000000000000000').ok).toBe(false);
  });

  test('rejects more than 18 decimals', () => {
    expect(validateAmount('1.0000000000000000001').ok).toBe(false);
  });

  test('rejects an amount above the demo cap', () => {
    expect(validateAmount(String(MAX_AMOUNT_ETH + 1)).ok).toBe(false);
    expect(validateAmount(String(MAX_AMOUNT_ETH)).ok).toBe(true);
  });

  test('rejects missing values', () => {
    for (const value of [null, undefined, '', '   ']) {
      expect(validateAmount(value).ok).toBe(false);
    }
  });
});

describe('validateCryptoCode', () => {
  test('accepts eth in any casing', () => {
    expect(validateCryptoCode('ETH')).toEqual({ ok: true, cryptoCode: 'eth' });
  });

  test('rejects a token this page cannot send rather than treating it as ETH', () => {
    expect(validateCryptoCode('usdc').ok).toBe(false);
  });

  test('rejects "[object Object]", the value produced by interpolating the SDK currency object', () => {
    expect(validateCryptoCode('[object Object]').ok).toBe(false);
  });
});

describe('parseDepositRequest', () => {
  const params = (search) => new URLSearchParams(search);

  test('returns a normalised request when every parameter is valid', () => {
    const result = parseDepositRequest(
      params(`cryptoCode=eth&amount=0.05&walletAddress=${VALID_ADDRESS.toLowerCase()}`),
    );
    expect(result).toEqual({
      ok: true,
      request: {
        cryptoCode: 'eth',
        amount: '0.05',
        wei: '50000000000000000',
        walletAddress: VALID_ADDRESS,
      },
    });
  });

  test('reports every problem at once instead of stopping at the first', () => {
    const result = parseDepositRequest(params(''));
    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(3);
  });

  test('rejects an attacker-supplied destination even when the rest looks plausible', () => {
    const result = parseDepositRequest(params('cryptoCode=eth&amount=1&walletAddress=0xdeadbeef'));
    expect(result.ok).toBe(false);
  });
});

describe('buildReturnUrl', () => {
  test('returns to the widget app origin with an encoded hash', () => {
    expect(buildReturnUrl('http://localhost:3000', '0xabc')).toBe('http://localhost:3000/?txHash=0xabc');
  });

  test('encodes a hash containing URL-significant characters', () => {
    expect(buildReturnUrl('http://localhost:3000', 'a&b=c')).toBe(
      'http://localhost:3000/?txHash=a%26b%3Dc',
    );
  });
});
