import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as WebSocket from 'ws';
import type { ObjectId } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { RedisService } from '../redis/redis.service';

interface RealtimeEnvelope {
	event: string;
	payload?: unknown;
}

interface RealtimeUserEvent {
	memberId?: string;
	memberIds?: string[];
	eventName?: string;
	payload?: unknown;
}

@Injectable()
export class RealtimeService implements OnModuleInit {
	public static readonly USER_CHANNEL = 'realtime:user';
	private readonly logger = new Logger(RealtimeService.name);
	private readonly userSockets = new Map<string, Set<WebSocket>>();
	private readonly socketUsers = new Map<WebSocket, string>();

	constructor(private readonly redisService: RedisService) {}

	public async onModuleInit(): Promise<void> {
		const subscribed = await this.redisService.subscribe(RealtimeService.USER_CHANNEL, (payload) =>
			this.handleRedisUserEvent(payload),
		);

		if (subscribed) {
			this.logger.log(`Subscribed to Redis channel ${RealtimeService.USER_CHANNEL}.`);
		} else {
			this.logger.warn(`Redis channel ${RealtimeService.USER_CHANNEL} is not subscribed yet.`);
		}
	}

	public registerConnection(member: Member, socket: WebSocket): void {
		const memberId = member._id.toString();
		const sockets = this.userSockets.get(memberId) ?? new Set<WebSocket>();

		sockets.add(socket);
		this.userSockets.set(memberId, sockets);
		this.socketUsers.set(socket, memberId);
	}

	public unregisterConnection(socket: WebSocket): string | null {
		const memberId = this.socketUsers.get(socket);
		if (!memberId) return null;

		this.socketUsers.delete(socket);
		const sockets = this.userSockets.get(memberId);
		if (!sockets) return memberId;

		sockets.delete(socket);
		if (sockets.size === 0) this.userSockets.delete(memberId);

		return memberId;
	}

	public emitToUser(memberId: ObjectId | string, eventName: string, payload: unknown): boolean {
		const targetMemberId = memberId.toString();
		const sockets = this.userSockets.get(targetMemberId);
		if (!sockets?.size || !this.isValidEventName(eventName)) return false;

		const message = this.serialize({ event: eventName, payload });
		let emitted = false;

		for (const socket of sockets) {
			if (socket.readyState !== WebSocket.OPEN) continue;
			socket.send(message);
			emitted = true;
		}

		return emitted;
	}

	public emitToUsers(memberIds: Array<ObjectId | string>, eventName: string, payload: unknown): number {
		const uniqueMemberIds = [...new Set(memberIds.map((memberId) => memberId.toString()))];

		return uniqueMemberIds.reduce((count, memberId) => {
			return this.emitToUser(memberId, eventName, payload) ? count + 1 : count;
		}, 0);
	}

	public getConnectedUserCount(): number {
		return this.userSockets.size;
	}

	public getUserConnectionCount(memberId: ObjectId | string): number {
		return this.userSockets.get(memberId.toString())?.size ?? 0;
	}

	private async handleRedisUserEvent(payload: unknown): Promise<void> {
		if (!this.isRealtimeUserEvent(payload) || !this.isValidEventName(payload.eventName)) {
			this.logger.warn('Ignored invalid Redis realtime user payload.');
			return;
		}

		if (payload.memberIds?.length) {
			this.emitToUsers(payload.memberIds, payload.eventName, payload.payload);
			return;
		}

		if (payload.memberId) this.emitToUser(payload.memberId, payload.eventName, payload.payload);
	}

	private isRealtimeUserEvent(payload: unknown): payload is RealtimeUserEvent {
		return typeof payload === 'object' && payload !== null;
	}

	private isValidEventName(eventName: unknown): eventName is string {
		return typeof eventName === 'string' && eventName.trim().length > 0;
	}

	private serialize(envelope: RealtimeEnvelope): string {
		return JSON.stringify(envelope);
	}
}
