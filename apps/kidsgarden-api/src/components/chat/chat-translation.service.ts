import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

type TranslationUsageCounter = {
	date: string;
	count: number;
};

type OpenAiTranslationResponse = {
	output_text?: string;
	output?: Array<{
		content?: Array<{
			text?: string;
			type?: string;
		}>;
	}>;
};

type TranslateMessageParams = {
	memberId: string;
	text: string;
	targetLang: string;
};

@Injectable()
export class ChatTranslationService {
	private readonly usageCounters = new Map<string, TranslationUsageCounter>();
	private readonly supportedTargetLangs = ['en', 'ko', 'ru', 'uz'];

	public async translateMessage(params: TranslateMessageParams): Promise<string> {
		const text = this.normalizeText(params.text);
		const targetLang = this.normalizeTargetLang(params.targetLang);
		this.assertTextAllowed(text);
		this.assertDailyLimitAllowed(params.memberId);

		const apiKey = process.env.OPENAI_API_KEY?.trim();
		const model = process.env.OPENAI_TRANSLATION_MODEL?.trim() || 'gpt-4o-mini';
		if (!apiKey) {
			throw new ServiceUnavailableException('Message translation is temporarily unavailable.');
		}

		try {
			const response = await fetch('https://api.openai.com/v1/responses', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model,
					instructions: this.buildTranslationInstructions(targetLang),
					input: [
						{
							role: 'user',
							content: [
								{
									type: 'input_text',
									text,
								},
							],
						},
					],
					max_output_tokens: 700,
				}),
			});

			if (!response.ok) {
				throw new Error(`OpenAI translation request failed with status ${response.status}`);
			}

			const payload = (await response.json()) as OpenAiTranslationResponse;
			const translatedText = this.extractTranslatedText(payload);
			if (!translatedText) {
				throw new Error('OpenAI translation response did not include translated text');
			}

			this.recordSuccessfulRequest(params.memberId);
			return translatedText;
		} catch (err) {
			throw new ServiceUnavailableException('Message translation is temporarily unavailable. Please try again later.');
		}
	}

	public getMaxChars(): number {
		return this.getPositiveIntEnv('TRANSLATION_MAX_CHARS', 1000);
	}

	private normalizeText(text: string): string {
		return String(text ?? '').trim();
	}

	private normalizeTargetLang(targetLang: string): string {
		const normalized = String(targetLang ?? '').trim().toLowerCase();
		if (!this.supportedTargetLangs.includes(normalized)) {
			throw new BadRequestException('Unsupported translation language.');
		}

		return normalized;
	}

	private assertTextAllowed(text: string): void {
		if (!text) throw new BadRequestException('Only text messages can be translated.');

		const maxChars = this.getMaxChars();
		if (text.length > maxChars) {
			throw new BadRequestException(`Message is too long to translate. Please keep it under ${maxChars} characters.`);
		}
	}

	private assertDailyLimitAllowed(memberId: string): void {
		const key = this.getUsageKey(memberId);
		const today = this.getTodayKey();
		const counter = this.usageCounters.get(key);
		const count = counter?.date === today ? counter.count : 0;
		const limit = this.getPositiveIntEnv('TRANSLATION_DAILY_LIMIT_PER_USER', 30);

		if (count >= limit) {
			throw new BadRequestException('Daily translation limit reached. Please try again tomorrow.');
		}
	}

	private recordSuccessfulRequest(memberId: string): void {
		const key = this.getUsageKey(memberId);
		const today = this.getTodayKey();
		const counter = this.usageCounters.get(key);

		if (!counter || counter.date !== today) {
			this.usageCounters.set(key, { date: today, count: 1 });
			return;
		}

		counter.count += 1;
		this.usageCounters.set(key, counter);
	}

	private getUsageKey(memberId: string): string {
		return `member:${memberId}`;
	}

	private getTodayKey(): string {
		return new Date().toISOString().slice(0, 10);
	}

	private getPositiveIntEnv(name: string, fallback: number): number {
		const parsed = Number.parseInt(String(process.env[name] ?? ''), 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
	}

	private buildTranslationInstructions(targetLang: string): string {
		const langLabel = this.getTargetLanguageLabel(targetLang);

		return [
			`Translate the user's private chat message to ${langLabel}.`,
			'Translate only the message content.',
			'Preserve meaning, names, numbers, URLs, and simple formatting.',
			'Do not add explanations, commentary, labels, or quotes.',
			'Return only the translated text.',
		].join('\n');
	}

	private getTargetLanguageLabel(targetLang: string): string {
		const labels: Record<string, string> = {
			en: 'English',
			ko: 'Korean',
			ru: 'Russian',
			uz: 'Uzbek Latin',
		};

		return labels[targetLang] ?? targetLang;
	}

	private extractTranslatedText(payload: OpenAiTranslationResponse): string {
		if (payload.output_text?.trim()) return payload.output_text.trim();

		const text = payload.output
			?.flatMap((item) => item.content ?? [])
			.map((content) => content.text)
			.filter(Boolean)
			.join('\n')
			.trim();

		return text || '';
	}
}
