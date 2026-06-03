import { registerEnumType } from '@nestjs/graphql';

export enum AttendanceStatus {
	PRESENT = 'PRESENT',
	ABSENT = 'ABSENT',
	LATE = 'LATE',
	EXCUSED = 'EXCUSED',
}

registerEnumType(AttendanceStatus, {
	name: 'AttendanceStatus',
});
