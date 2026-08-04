import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Drawer } from './Drawer';

describe('Drawer', () => {
  it('renders nothing (RN Modal returns null content) when closed', () => {
    render(
      <Drawer isOpen={false} onClose={() => undefined} title="Filters">
        <Text>Content</Text>
      </Drawer>,
    );
    expect(screen.queryByText('Content')).toBeNull();
  });

  it('renders the title and children when open', () => {
    render(
      <Drawer isOpen onClose={() => undefined} title="Filters">
        <Text>Content</Text>
      </Drawer>,
    );
    expect(screen.getByText('Filters')).toBeTruthy();
    expect(screen.getByText('Content')).toBeTruthy();
  });
});
