import { render, screen } from '@testing-library/react';

import { App } from './app';

describe('App', () => {
  it('renders the scaffold heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /ecclesia admin console/i })).toBeInTheDocument();
  });
});
