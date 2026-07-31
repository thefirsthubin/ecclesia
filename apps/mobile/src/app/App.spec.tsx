import { render, screen } from '@testing-library/react-native';

import { App } from './App';

describe('App', () => {
  it('renders the scaffold heading', () => {
    render(<App />);
    expect(screen.getByText('Ecclesia')).toBeTruthy();
  });
});
