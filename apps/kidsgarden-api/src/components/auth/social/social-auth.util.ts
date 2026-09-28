import { randomBytes } from 'crypto';
import { NormalizedSocialProfile } from './social-auth.types';

const socialPrefixMaxLength = 16;
/** Same bounds as MEMBER_NICK_PATTERN (libs/config.ts): 3-20 chars. */
const memberNickMaxLength = 20;
const memberNickMinLength = 3;

/**
 * Fit `${prefix}_${suffix}` into the nickname rule. A 16-char prefix plus an
 * 8-char suffix used to produce 25-char nicks that MEMBER_NICK_PATTERN rejects,
 * so those accounts could never save their profile again.
 */
function composeMemberNick(prefix: string, suffix: string): string {
	const cleanSuffix = suffix.replace(/[^a-zA-Z0-9_-]/g, '');
	const room = Math.max(memberNickMaxLength - cleanSuffix.length - 1, 1);
	let nick = `${prefix.slice(0, room)}_${cleanSuffix}`.slice(0, memberNickMaxLength);
	if (nick.length < memberNickMinLength) nick = `${nick}parent`.slice(0, memberNickMaxLength);
	return nick;
}

export function normalizeSocialEmail(email?: string): string | undefined {
	const normalizedEmail = email?.trim().toLowerCase();
	return normalizedEmail || undefined;
}

export function buildSocialMemberNick(profile: NormalizedSocialProfile, attempt = 0): string {
	const source = profile.email?.split('@')[0] || profile.displayName || 'parent';
	const safePrefix = source.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, socialPrefixMaxLength) || 'parent';
	const providerSuffix = profile.providerUserId.slice(-8);
	const retrySuffix = attempt > 0 ? `${attempt}` : '';

	return composeMemberNick(safePrefix, `${providerSuffix}${retrySuffix}`);
}

export function buildSocialMemberPhone(profile: NormalizedSocialProfile, attempt = 0): string {
	const retrySuffix = attempt > 0 ? `:${attempt}` : '';
	return `${profile.provider.toLowerCase()}:${profile.providerUserId}${retrySuffix}`;
}

export function buildPrivateSocialMemberNick(profile: NormalizedSocialProfile, attempt = 0): string {
	const source = profile.displayName || 'parent';
	const safePrefix = source.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, socialPrefixMaxLength) || 'parent';
	const retrySuffix = attempt > 0 ? `${attempt}` : '';

	return composeMemberNick(safePrefix, `${randomBytes(4).toString('hex')}${retrySuffix}`);
}

export function buildPrivateSocialMemberPhone(profile: NormalizedSocialProfile, attempt = 0): string {
	const retrySuffix = attempt > 0 ? `:${attempt}` : '';
	return `${profile.provider.toLowerCase()}:user:${randomBytes(8).toString('hex')}${retrySuffix}`;
}

export function buildSocialPasswordSeed(profile: NormalizedSocialProfile): string {
	return `${profile.provider}:${profile.providerUserId}:${randomBytes(16).toString('hex')}`;
}
