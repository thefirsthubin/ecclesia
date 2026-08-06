import { Module } from '@nestjs/common';

import { AttendanceCompletenessSweepJob } from './attendance-completeness-sweep.job';
import { AttendanceCompletenessSweepRepository } from './attendance-completeness-sweep.repository';
import { EventsModule } from '../../platform/events/events.module';

@Module({
  imports: [EventsModule],
  providers: [AttendanceCompletenessSweepRepository, AttendanceCompletenessSweepJob],
  exports: [AttendanceCompletenessSweepJob],
})
export class AttendanceCompletenessSweepModule {}
