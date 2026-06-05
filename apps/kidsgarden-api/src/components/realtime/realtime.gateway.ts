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

	private extractToken(req: any): string | null {
		const parsedUrl = url.parse(req?.url ?? '', true);
		const queryToken = parsedUrl.query?.token;
		if (typeof queryToken === 'string' && queryToken.trim()) return queryToken.trim();

		const authorization = req?.headers?.authorization;
		if (typeof authorization === 'string') {
			const [scheme, token] = authorization.split(' ');
			if (scheme?.toLowerCase() === 'bearer' && token?.trim()) return token.trim();
		}

		return null;
	}

	private safeSend(client: WebSocket, payload: unknown): void {
		if (client.readyState !== WebSocket.OPEN) return;
		client.send(JSON.stringify(payload));
	}
}
