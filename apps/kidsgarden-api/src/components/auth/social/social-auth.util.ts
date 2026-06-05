import { randomBytes } from 'crypto';
import { NormalizedSocialProfile } from './social-auth.types';

const socialPrefixMaxLength = 16;

export function normalizeSocialEmail(email?: string): string | undefined {
	const normalizedEmail = email?.trim().toLowerCase();
	return normalizedEmail || undefined;
}

export function buildSocialMemberNick(profile: NormalizedSocialProfile, attempt = 0): string {
	const source = profile.email?.split('@')[0] || profile.displayName || 'parent';
	const safePrefix = source.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, socialPrefixMaxLength) || 'parent';
	const providerSuffix = profile.providerUserId.slice(-8);
	const retrySuffix = attempt > 0 ? `_${attempt}` : '';

	return `${safePrefix}_${providerSuffix}${retrySuffix}`;
}

export function buildSocialMemberPhone(profile: NormalizedSocialProfile, attempt = 0): string {
	const retrySuffix = attempt > 0 ? `:${attempt}` : '';
	return `${profile.provider.toLowerCase()}:${profile.providerUserId}${retrySuffix}`;
}

export function buildPrivateSocialMemberNick(profile: NormalizedSocialProfile, attempt = 0): string {
	const source = profile.displayName || 'parent';
	const safePrefix = source.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, socialPrefixMaxLength) || 'parent';
	const retrySuffix = attempt > 0 ? `_${attempt}` : '';

	return `${safePrefix}_${randomBytes(4).toString('hex')}${retrySuffix}`;
}

export function buildPrivateSocialMemberPhone(profile: NormalizedSocialProfile, attempt = 0): string {
	const retrySuffix = attempt > 0 ? `:${attempt}` : '';
	return `${profile.provider.toLowerCase()}:user:${randomBytes(8).toString('hex')}${retrySuffix}`;
}

export function buildSocialPasswordSeed(profile: NormalizedSocialProfile): string {
	return `${profile.provider}:${profile.providerUserId}:${randomBytes(16).toString('hex')}`;
}
