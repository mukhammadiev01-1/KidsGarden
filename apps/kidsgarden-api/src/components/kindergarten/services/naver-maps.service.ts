import { Injectable } from '@nestjs/common';
import { buildKindergartenGeoLocation, isValidLatitude, isValidLongitude } from '../../../libs/utils/kindergarten-geo-location.util';

export interface NaverGeocodedAddress {
	latitude: number;
	longitude: number;
	roadAddress?: string;
	jibunAddress?: string;
}

export interface NaverReverseGeocodedAddress {
	latitude: number;
	longitude: number;
	roadAddress?: string;
	jibunAddress?: string;
}

interface NaverGeocodeResponse {
	status?: string;
	addresses?: Array<{
		x?: string;
		y?: string;
		roadAddress?: string;
		jibunAddress?: string;
	}>;
}

interface NaverReverseGeocodeResponse {
	status?: {
		code?: number;
		name?: string;
		message?: string;
	};
	results?: Array<{
		name?: string;
		region?: {
			area1?: { name?: string };
			area2?: { name?: string };
			area3?: { name?: string };
			area4?: { name?: string };
		};
		land?: {
			name?: string;
			number1?: string;
			number2?: string;
			addition0?: { value?: string };
		};
	}>;
}

@Injectable()
export class NaverMapsService {
	private readonly geocodeUrl = 'https://maps.apigw.ntruss.com/map-geocode/v2/geocode';
	private readonly reverseGeocodeUrl = 'https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc';
	private readonly requestTimeoutMs = 5000;

	public async geocodeAddress(address: string): Promise<NaverGeocodedAddress | null> {
		const query = address?.trim();
		if (!query) return null;

		const credentials = this.getCredentials();
		if (!credentials) return null;

		try {
			const url = new URL(this.geocodeUrl);
			url.searchParams.set('query', query);
			const response = await fetch(url, {
				method: 'GET',
				headers: this.buildHeaders(credentials),
				signal: this.createTimeoutSignal(),
			});

			if (!response.ok) return null;

			const payload = (await response.json()) as NaverGeocodeResponse;
			const firstAddress = payload.addresses?.[0];
			if (!firstAddress) return null;

			const longitude = Number(firstAddress.x);
			const latitude = Number(firstAddress.y);
			if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null;
			if (!buildKindergartenGeoLocation(latitude, longitude)) return null;

			return {
				latitude,
				longitude,
				roadAddress: firstAddress.roadAddress || undefined,
				jibunAddress: firstAddress.jibunAddress || undefined,
			};
		} catch (_err) {
			return null;
		}
	}

	public async reverseGeocode(latitude: number, longitude: number): Promise<NaverReverseGeocodedAddress | null> {
		if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null;

		const credentials = this.getCredentials();
		if (!credentials) return null;

		try {
			const url = new URL(this.reverseGeocodeUrl);
			url.searchParams.set('coords', `${longitude},${latitude}`);
			url.searchParams.set('orders', 'roadaddr,addr');
			url.searchParams.set('output', 'json');
			const response = await fetch(url, {
				method: 'GET',
				headers: this.buildHeaders(credentials),
				signal: this.createTimeoutSignal(),
			});

			if (!response.ok) return null;

			const payload = (await response.json()) as NaverReverseGeocodeResponse;
			if (payload.status?.code && payload.status.code !== 0) return null;

			return {
				latitude,
				longitude,
				roadAddress: this.formatReverseAddress(payload, 'roadaddr'),
				jibunAddress: this.formatReverseAddress(payload, 'addr'),
			};
		} catch (_err) {
			return null;
		}
	}

	public hasCredentials(): boolean {
		return Boolean(this.getCredentials());
	}

	private getCredentials(): { keyId: string; key: string } | null {
		const keyId = process.env.NAVER_MAPS_KEY_ID?.trim();
		const key = process.env.NAVER_MAPS_KEY?.trim();
		if (!keyId || !key) return null;

		return { keyId, key };
	}

	private buildHeaders(credentials: { keyId: string; key: string }): HeadersInit {
		return {
			Accept: 'application/json',
			'x-ncp-apigw-api-key-id': credentials.keyId,
			'x-ncp-apigw-api-key': credentials.key,
		};
	}

	private createTimeoutSignal(): AbortSignal {
		const controller = new AbortController();
		setTimeout(() => controller.abort(), this.requestTimeoutMs);
		return controller.signal;
	}

	private formatReverseAddress(payload: NaverReverseGeocodeResponse, type: 'roadaddr' | 'addr'): string | undefined {
		const result = payload.results?.find((item) => item.name === type);
		if (!result) return undefined;

		const region = [result.region?.area1?.name, result.region?.area2?.name, result.region?.area3?.name, result.region?.area4?.name]
			.filter(Boolean)
			.join(' ');
		const landName = result.land?.name;
		const landNumber = [result.land?.number1, result.land?.number2].filter(Boolean).join('-');
		const building = result.land?.addition0?.value;

		return [region, landName, landNumber, building].filter(Boolean).join(' ') || undefined;
	}
}
