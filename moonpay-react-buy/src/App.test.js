import { render, screen } from '@testing-library/react';
import App from './App';

test('renders MoonPay On-Ramp heading', () => {
  render(<App />);
  expect(screen.getByText(/MoonPay On-Ramp/i)).toBeInTheDocument();
});
