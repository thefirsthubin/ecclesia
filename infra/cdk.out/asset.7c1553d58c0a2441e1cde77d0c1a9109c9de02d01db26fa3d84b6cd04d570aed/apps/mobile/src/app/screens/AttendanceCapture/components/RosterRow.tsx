import { View } from 'react-native';
import { Avatar, Card, Text, useTheme } from '@ecclesia/ui-native';
import type { AttendanceStatusDto, PersonResponseDto } from '@ecclesia/contracts';

import { AttendanceStatusToggle } from './AttendanceStatusToggle';

export interface RosterRowProps {
  person: PersonResponseDto;
  status: AttendanceStatusDto | undefined;
  onChangeStatus: (status: AttendanceStatusDto) => void;
}

/** One roster member's name + `AttendanceStatusToggle` (NFR-PERF-01: this
 * row is what a Shepherd repeats up to 30 times per Gathering in under a
 * minute, so it stays to one name line + one tap target row - no
 * secondary detail that would slow scanning). */
export function RosterRow({ person, status, onChangeStatus }: RosterRowProps) {
  const theme = useTheme();
  const fullName = `${person.firstName} ${person.lastName}`;

  return (
    <Card padding={3} testId={`roster-row-${person.id}`}>
      <View style={{ gap: theme.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
          <Avatar name={fullName} size="sm" />
          <Text variant="body">{fullName}</Text>
        </View>
        <AttendanceStatusToggle
          value={status}
          onChange={onChangeStatus}
          accessibilityLabelPrefix={fullName}
          testId={`roster-row-${person.id}-toggle`}
        />
      </View>
    </Card>
  );
}
