import { render, screen } from '@testing-library/react';
import App from './App';

test('renders MoonPay Off-Ramp heading', () => {
  render(<App />);
  expect(screen.getByText(/MoonPay Off-Ramp/i)).toBeInTheDocument();
});
