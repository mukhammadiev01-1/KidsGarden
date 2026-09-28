import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import * as WebSocket from 'ws';
import * as url from 'url';
import { AuthService } from '../auth/auth.service';
import { Member } from '../../libs/dto/member/member';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({ path: '/realtime', transports: ['websocket'], secure: false })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(RealtimeGateway.name);
	/** Subprotocol name browsers send alongside the JWT (see extractToken). */
	public static readonly AUTH_SUBPROTOCOL = 'kidsgarden.auth';

	constructor(
		private readonly authService: AuthService,
		private readonly realtimeService: RealtimeService,
	) {}

	public async handleConnection(client: WebSocket, req: any): Promise<void> {
		const authMember = await this.authenticate(req);

		if (!authMember) {
			client.close(1008, 'Unauthorized');
			return;
		}

		this.realtimeService.registerConnection(authMember, client);
		this.safeSend(client, {
			event: 'realtime.connected',
			payload: {
				memberId: authMember._id.toString(),
				connectionCount: this.realtimeService.getUserConnectionCount(authMember._id),
			},
		});

		this.logger.log(
			`Realtime connection established for member ${authMember._id.toString()}; connected users: ${this.realtimeService.getConnectedUserCount()}`,
		);
	}

	public handleDisconnect(client: WebSocket): void {
		const memberId = this.realtimeService.unregisterConnection(client);
		if (!memberId) return;

		this.logger.log(
			`Realtime connection closed for member ${memberId}; remaining user connections: ${this.realtimeService.getUserConnectionCount(memberId)}`,
		);
	}

	@SubscribeMessage('ping')
	public handlePing(client: WebSocket): void {
		this.safeSend(client, { event: 'pong', payload: { ts: Date.now() } });
	}

	private async authenticate(req: any): Promise<Member | null> {
		const token = this.extractToken(req);
		if (!token) return null;

		try {
			return await this.authService.authenticateToken(token);
		} catch {
			return null;
		}
	}

	/**
	 * Token sources, in order:
	 * 1. `Sec-WebSocket-Protocol: kidsgarden.auth, <jwt>` -- what browsers use.
	 *    The WebSocket API cannot set headers, and a `?token=` query string
	 *    ended up in nginx access logs (a 30-day JWT carrying phone, name and
	 *    address). `ws` echoes the first offered subprotocol back, so the
	 *    handshake succeeds with `kidsgarden.auth` selected.
	 * 2. `Authorization: Bearer <jwt>` -- native apps.
	 * 3. `?token=` -- legacy clients; keep until every web build has moved.
	 */
	private extractToken(req: any): string | null {
		const protocolHeader = req?.headers?.['sec-websocket-protocol'];
		if (typeof protocolHeader === 'string') {
			const offered = protocolHeader.split(',').map((value: string) => value.trim()).filter(Boolean);
			const marker = offered.indexOf(RealtimeGateway.AUTH_SUBPROTOCOL);
			if (marker !== -1 && offered[marker + 1]) return offered[marker + 1];
		}

		const authorization = req?.headers?.authorization;
		if (typeof authorization === 'string') {
			const [scheme, token] = authorization.split(' ');
			if (scheme?.toLowerCase() === 'bearer' && token?.trim()) return token.trim();
		}

		const parsedUrl = url.parse(req?.url ?? '', true);
		const queryToken = parsedUrl.query?.token;
		if (typeof queryToken === 'string' && queryToken.trim()) return queryToken.trim();

		return null;
	}

	private safeSend(client: WebSocket, payload: unknown): void {
		if (client.readyState !== WebSocket.OPEN) return;
		client.send(JSON.stringify(payload));
	}
}
