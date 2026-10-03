import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PushResolver } from './push.resolver';
import { PushService } from './push.service';
import PushDeviceSchema from '../../shemas/PushDevice.model';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'PushDevice', schema: PushDeviceSchema }]), AuthModule],
	providers: [PushResolver, PushService],
	exports: [PushService],
})
export class PushModule {}
