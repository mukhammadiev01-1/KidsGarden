import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Application } from '../../libs/dto/application/application';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Removes application documents that no application references.
 *
 * Clients upload documents first and create the application second. When the
 * second call fails (duplicate open application, inactive center, network),
 * the uploaded files stay in uploads/application/ with nothing pointing at
 * them, and every retry adds more.
 *
 * Safety:
 * - Report-only unless UPLOAD_JANITOR_DELETE=true. Check the log line
 *   ("orphaned application documents: ...") before turning deletion on.
 * - Only files older than UPLOAD_JANITOR_GRACE_HOURS (default 48), so an
 *   upload whose application is still being submitted is never touched.
 * - Aborts the run if the reference query fails, instead of treating
 *   "no references" as "everything is orphaned".
 * - At most UPLOAD_JANITOR_MAX_DELETIONS (default 200) deletions per run.
 */
@Injectable()
export class ApplicationDocumentJanitorService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(ApplicationDocumentJanitorService.name);
	private timer?: NodeJS.Timeout;
	private firstRun?: NodeJS.Timeout;
	private running = false;

	constructor(@InjectModel('Application') private readonly applicationModel: Model<Application>) {}

	public onModuleInit(): void {
		if (String(process.env.UPLOAD_JANITOR_ENABLED ?? 'true').toLowerCase() === 'false') return;

		const intervalMs = this.positiveNumberEnv('UPLOAD_JANITOR_INTERVAL_HOURS', 6) * HOUR_MS;
		this.firstRun = setTimeout(() => void this.run(), 10 * 60 * 1000);
		this.timer = setInterval(() => void this.run(), intervalMs);
		this.firstRun.unref?.();
		this.timer.unref?.();
	}

	public onModuleDestroy(): void {
		if (this.firstRun) clearTimeout(this.firstRun);
		if (this.timer) clearInterval(this.timer);
	}

	/** One sweep. Public so it can be triggered from a test or a script. */
	public async run(): Promise<void> {
		if (this.running) return;
		this.running = true;
		try {
			await this.sweep();
		} catch (err: any) {
			this.logger.warn(`Janitor run failed: ${err?.message ?? err}`);
		} finally {
			this.running = false;
		}
	}

	private async sweep(): Promise<void> {
		const dir = path.resolve(process.cwd(), 'uploads', 'application');
		let entries: string[];
		try {
			entries = await fs.readdir(dir);
		} catch (err: any) {
			if (err?.code === 'ENOENT') return;
			throw err;
		}
		if (!entries.length) return;

		// Every url any application (in any status) still points at.
		const referencedUrls: unknown[] = await this.applicationModel.distinct('documents.url').exec();
		const referenced = new Set(referencedUrls.filter((value): value is string => typeof value === 'string'));

		const graceMs = this.positiveNumberEnv('UPLOAD_JANITOR_GRACE_HOURS', 48) * HOUR_MS;
		const cutoff = Date.now() - graceMs;
		const orphans: { filePath: string; size: number }[] = [];

		for (const name of entries) {
			const filePath = path.join(dir, name);
			const stat = await fs.lstat(filePath).catch(() => null);
			if (!stat || !stat.isFile()) continue;
			if (stat.mtimeMs > cutoff) continue;
			if (referenced.has(`uploads/application/${name}`)) continue;
			orphans.push({ filePath, size: stat.size });
		}

		if (!orphans.length) return;

		const totalMb = (orphans.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(1);
		const deleteEnabled = String(process.env.UPLOAD_JANITOR_DELETE).toLowerCase() === 'true';
		if (!deleteEnabled) {
			this.logger.log(
				`orphaned application documents: ${orphans.length} files, ${totalMb} MB (report only; set UPLOAD_JANITOR_DELETE=true to remove)`,
			);
			return;
		}

		const maxDeletions = this.positiveNumberEnv('UPLOAD_JANITOR_MAX_DELETIONS', 200);
		let deleted = 0;
		for (const orphan of orphans.slice(0, maxDeletions)) {
			try {
				await fs.unlink(orphan.filePath);
				deleted += 1;
			} catch (err: any) {
				this.logger.warn(`Could not delete ${orphan.filePath}: ${err?.message ?? err}`);
			}
		}
		this.logger.log(
			`orphaned application documents: deleted ${deleted} of ${orphans.length} (${totalMb} MB found)` +
				(orphans.length > maxDeletions ? `; ${orphans.length - maxDeletions} left for the next run` : ''),
		);
	}

	private positiveNumberEnv(name: string, fallback: number): number {
		const parsed = Number(process.env[name]);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
	}
}
