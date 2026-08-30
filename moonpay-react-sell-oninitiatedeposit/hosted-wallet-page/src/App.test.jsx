import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import App from './App';

/**
 * Renders the page with a given query string, the way a real deposit link would.
 *
 * @param {string} search e.g. '?cryptoCode=eth&amount=0.05&walletAddress=0x…'
 */
const renderWithQuery = (search) =>
  render(
    <MemoryRouter initialEntries={[`/${search}`]}>
      <App />
    </MemoryRouter>,
  );

// A well-known, non-zero checksummed address used purely as a fixture.
const VALID_ADDRESS = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';
const VALID_QUERY = `?cryptoCode=eth&amount=0.05&walletAddress=${VALID_ADDRESS}`;

describe('hosted wallet page', () => {
  test('renders the signing screen for a valid deposit request', () => {
    renderWithQuery(VALID_QUERY);
    // Queried by role: "Sign Transaction" is both the heading and the button label,
    // so a plain text query matches two nodes and throws.
    expect(screen.getByRole('heading', { name: /Sign Transaction/i })).toBeInTheDocument();
    expect(screen.getByText(VALID_ADDRESS)).toBeInTheDocument();
  });

  test('requires the address acknowledgement before the button is usable', () => {
    renderWithQuery(VALID_QUERY);
    expect(screen.getByRole('button', { name: /Sign Transaction/i })).toBeDisabled();
  });

  test('refuses a request with no parameters instead of showing a live sign button', () => {
    renderWithQuery('');
    expect(screen.getByText(/Invalid deposit request/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sign Transaction/i })).not.toBeInTheDocument();
  });

  test('refuses a malformed destination address', () => {
    renderWithQuery('?cryptoCode=eth&amount=0.05&walletAddress=not-an-address');
    expect(screen.getByText(/not a valid EVM address/i)).toBeInTheDocument();
  });

  test('refuses a currency this page cannot actually send', () => {
    renderWithQuery(`?cryptoCode=usdc&amount=50&walletAddress=${VALID_ADDRESS}`);
    expect(screen.getByText(/can only send ETH/i)).toBeInTheDocument();
  });
});
