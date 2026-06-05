import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

type RedisPayloadHandler = (payload: unknown) => void | Promise<void>;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(RedisService.name);
	private readonly handlers = new Map<string, Set<RedisPayloadHandler>>();
	private readonly redisUrl?: string;
	private commandClient?: Redis;
	private publisherClient?: Redis;
	private subscriberClient?: Redis;

	constructor() {
		this.redisUrl = process.env.REDIS_URL || (process.env.NODE_ENV === 'production' ? undefined : 'redis://localhost:6379');
	}

	public async onModuleInit(): Promise<void> {
		if (!this.redisUrl) {
			this.logger.warn('Redis is disabled: REDIS_URL is not configured.');
			return;
		}

		this.commandClient = this.createClient('command');
		this.publisherClient = this.createClient('publisher');
		this.subscriberClient = this.createClient('subscriber');
		this.subscriberClient.on('message', (channel, message) => void this.handleMessage(channel, message));

		await Promise.all([
			this.safeConnect(this.commandClient, 'command'),
			this.safeConnect(this.publisherClient, 'publisher'),
			this.safeConnect(this.subscriberClient, 'subscriber'),
		]);
	}

	public async onModuleDestroy(): Promise<void> {
		await Promise.all([
			this.safeDisconnect(this.subscriberClient, 'subscriber'),
			this.safeDisconnect(this.publisherClient, 'publisher'),
			this.safeDisconnect(this.commandClient, 'command'),
		]);
	}

	public async publish(channel: string, payload: unknown): Promise<boolean> {
		if (!this.isValidChannel(channel) || !this.publisherClient || !this.isClientReady(this.publisherClient)) {
			return false;
		}

		try {
			await this.publisherClient.publish(channel, JSON.stringify(payload));
			return true;
		} catch (err) {
			this.logger.warn(`Redis publish failed on ${channel}: ${this.getErrorMessage(err)}`);
			return false;
		}
	}

	public async subscribe(channel: string, handler: RedisPayloadHandler): Promise<boolean> {
		if (!this.isValidChannel(channel) || !this.subscriberClient || !this.isClientReady(this.subscriberClient)) {
			return false;
		}

		const channelHandlers = this.handlers.get(channel) ?? new Set<RedisPayloadHandler>();
		channelHandlers.add(handler);
		this.handlers.set(channel, channelHandlers);

		try {
			await this.subscriberClient.subscribe(channel);
			return true;
		} catch (err) {
			channelHandlers.delete(handler);
			this.logger.warn(`Redis subscribe failed on ${channel}: ${this.getErrorMessage(err)}`);
			return false;
		}
	}

	public async ping(): Promise<boolean> {
		if (!this.commandClient || !this.isClientReady(this.commandClient)) return false;

		try {
			return (await this.commandClient.ping()) === 'PONG';
		} catch (err) {
			this.logger.warn(`Redis ping failed: ${this.getErrorMessage(err)}`);
			return false;
		}
	}

	public isHealthy(): boolean {
		return [this.commandClient, this.publisherClient, this.subscriberClient].every(
			(client) => !!client && this.isClientReady(client),
		);
	}

	private createClient(name: string): Redis {
		const client = new Redis(this.redisUrl, {
			lazyConnect: true,
			maxRetriesPerRequest: 3,
			retryStrategy: (times) => Math.min(times * 100, 2000),
		});

		client.on('connect', () => this.logger.log(`Redis ${name} client connected.`));
		client.on('ready', () => this.logger.log(`Redis ${name} client ready.`));
		client.on('error', (err) => this.logger.warn(`Redis ${name} client error: ${this.getErrorMessage(err)}`));
		client.on('close', () => this.logger.warn(`Redis ${name} client closed.`));

		return client;
	}

	private async safeConnect(client: Redis, name: string): Promise<void> {
		try {
			await client.connect();
		} catch (err) {
			this.logger.warn(`Redis ${name} client connection failed: ${this.getErrorMessage(err)}`);
		}
	}

	private async safeDisconnect(client: Redis | undefined, name: string): Promise<void> {
		if (!client) return;

		try {
			await client.quit();
		} catch (err) {
			this.logger.warn(`Redis ${name} client quit failed: ${this.getErrorMessage(err)}`);
			client.disconnect();
		}
	}

	private async handleMessage(channel: string, message: string): Promise<void> {
		const channelHandlers = this.handlers.get(channel);
		if (!channelHandlers?.size) return;

		let payload: unknown;
		try {
			payload = JSON.parse(message);
		} catch {
			payload = message;
		}

		for (const handler of channelHandlers) {
			try {
				await handler(payload);
			} catch (err) {
				this.logger.warn(`Redis handler failed on ${channel}: ${this.getErrorMessage(err)}`);
			}
		}
	}

	private isClientReady(client: Redis): boolean {
		return client.status === 'ready';
	}

	private isValidChannel(channel: string): boolean {
		return typeof channel === 'string' && channel.trim().length > 0;
	}

	private getErrorMessage(err: unknown): string {
		return err instanceof Error ? err.message : String(err);
	}
}
