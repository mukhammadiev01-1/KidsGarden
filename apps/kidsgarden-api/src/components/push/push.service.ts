import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { EXPO_PUSH_TOKEN_PATTERN, PushDeviceInput } from '../../libs/dto/push/push.input';

interface PushDevice {
	_id: ObjectId;
	memberId: ObjectId;
	token: string;
	platform: string;
	lastSeenAt: Date;
}

export interface PushMessage {
	title: string;
	body: string;
	/** Small JSON payload the app uses to open the right screen. */
	data?: Record<string, unknown>;
	/** App-icon badge (iOS); usually the member's unread count. */
	badge?: number;
}

interface ExpoPushTicket {
	status: 'ok' | 'error';
	message?: string;
	details?: { error?: string };
}

/**
 * Sends push notifications through Expo's push service, which relays to APNs
 * and FCM. Delivery is best effort: a failure here must never fail the request
 * that produced the notification, so nothing in this class throws to callers.
 */
@Injectable()
export class PushService {
	private readonly logger = new Logger(PushService.name);
	private readonly sendUrl = 'https://exp.host/--/api/v2/push/send';
	private readonly maxDevicesPerMember = 10;
	private readonly requestTimeoutMs = 8000;

	constructor(@InjectModel('PushDevice') private readonly pushDeviceModel: Model<PushDevice>) {}

	private get enabled(): boolean {
		return String(process.env.PUSH_ENABLED ?? 'true').toLowerCase() !== 'false';
	}

	public async registerDevice(authMember: Member, input: PushDeviceInput): Promise<boolean> {
		// Upsert on the token: the same install signing in as someone else moves over.
		await this.pushDeviceModel
			.findOneAndUpdate(
				{ token: input.token },
				{ $set: { memberId: authMember._id, platform: input.platform, lastSeenAt: new Date() } },
				{ upsert: true, new: true, setDefaultsOnInsert: true },
			)
			.exec();

		// Keep the newest few; a member cycling through installs should not grow without bound.
		const stale = await this.pushDeviceModel
			.find({ memberId: authMember._id })
			.sort({ lastSeenAt: -1 })
			.skip(this.maxDevicesPerMember)
			.select('_id')
			.exec();
		if (stale.length) {
			await this.pushDeviceModel.deleteMany({ _id: { $in: stale.map((device) => device._id) } }).exec();
		}

		return true;
	}

	/** Called on sign-out. Only removes the caller's own registration. */
	public async unregisterDevice(authMember: Member, token: string): Promise<boolean> {
		if (!EXPO_PUSH_TOKEN_PATTERN.test(token ?? '')) return true;
		await this.pushDeviceModel.deleteOne({ token, memberId: authMember._id }).exec();
		return true;
	}

	public async sendToMember(memberId: ObjectId | string, message: PushMessage): Promise<void> {
		if (!this.enabled) return;

		try {
			const devices = await this.pushDeviceModel.find({ memberId }).select('token').lean().exec();
			if (!devices.length) return;

			const tokens = devices.map((device) => device.token);
			const tickets = await this.postToExpo(
				tokens.map((to) => ({
					to,
					title: message.title,
					body: message.body,
					data: message.data ?? {},
					sound: 'default',
					channelId: 'default',
					priority: 'high',
					...(typeof message.badge === 'number' ? { badge: message.badge } : {}),
				})),
			);

			// Expo answers one ticket per message, in order. An uninstalled app comes
			// back as DeviceNotRegistered and must stop being sent to.
			const dead = tokens.filter((_, index) => tickets[index]?.details?.error === 'DeviceNotRegistered');
			if (dead.length) await this.pushDeviceModel.deleteMany({ token: { $in: dead } }).exec();

			const failed = tickets.filter((ticket) => ticket?.status === 'error' && ticket.details?.error !== 'DeviceNotRegistered');
			if (failed.length) this.logger.warn(`Push rejected for ${failed.length} device(s): ${failed[0].message ?? 'unknown'}`);
		} catch (err) {
			this.logger.warn(`Push send failed: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	private async postToExpo(messages: Record<string, unknown>[]): Promise<ExpoPushTicket[]> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);
		try {
			const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
			const response = await fetch(this.sendUrl, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
				},
				body: JSON.stringify(messages),
				signal: controller.signal,
			});
			if (!response.ok) throw new Error(`Expo push service answered ${response.status}`);

			const payload = (await response.json()) as { data?: ExpoPushTicket[] };
			return Array.isArray(payload?.data) ? payload.data : [];
		} finally {
			clearTimeout(timer);
		}
	}
}
