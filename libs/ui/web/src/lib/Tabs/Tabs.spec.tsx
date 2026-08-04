import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from './Tabs';

const TABS = [
  { id: 'pledges', label: 'Pledges', content: <p>Pledge list</p> },
  { id: 'deposits', label: 'Deposits', content: <p>Deposit list</p> },
  { id: 'reports', label: 'Reports', content: <p>Report list</p>, disabled: true },
];

describe('Tabs', () => {
  it('renders a tablist with the correct roles and only the active panel content', () => {
    render(<Tabs tabs={TABS} activeTabId="pledges" onChange={() => undefined} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pledges' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Deposits' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('Pledge list')).toBeInTheDocument();
    expect(screen.queryByText('Deposit list')).not.toBeInTheDocument();
  });

  it('calls onChange when a tab is clicked', () => {
    const onChange = jest.fn();
    render(<Tabs tabs={TABS} activeTabId="pledges" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Deposits' }));
    expect(onChange).toHaveBeenCalledWith('deposits');
  });

  it('moves to the next enabled tab on ArrowRight, skipping disabled tabs', () => {
    const onChange = jest.fn();
    render(<Tabs tabs={TABS} activeTabId="deposits" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('pledges');
  });

  it('disables the Reports tab', () => {
    render(<Tabs tabs={TABS} activeTabId="pledges" onChange={() => undefined} />);
    expect(screen.getByRole('tab', { name: 'Reports' })).toBeDisabled();
  });
});
