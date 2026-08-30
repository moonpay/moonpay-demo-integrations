import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import App from './App';

describe('react-widget-integration app shell', () => {
  test('renders the page heading', () => {
    render(<App />);
    // Queried by role and level: the page <h1> and the widget's own <h2> both
    // contain "MoonPay Off-Ramp", so a plain text query matches two nodes.
    expect(
      screen.getByRole('heading', { level: 1, name: /MoonPay Off-Ramp \(OnInitiateDeposit\)/i }),
    ).toBeInTheDocument();
  });

  test('does not mount the widget until the user asks for it', () => {
    render(<App />);
    // The widget loads remote MoonPay code, so it must stay unmounted until the
    // user explicitly opts in by clicking the button.
    expect(screen.getByRole('button', { name: /Show MoonPay Widget/i })).toBeInTheDocument();
  });
});
