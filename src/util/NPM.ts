/// <reference path ="./@types/npm.d.ts" />
import * as https from "https";
import config from "../config";
import semver from "semver";

export default class NPM {
	static async getPackage(name: string, version?: string) {
		return new Promise<{
			status: {
				code: number;
				message: string;
			};
			body: NPM.Package;
		}>((a, b) => https.request({
			method: "GET",
			host: "registry.npmjs.org",
			path: `/${name}${version ? `/${version}` : ""}`,
			headers: {
				"User-Agent": config.web.userAgent
			},
			protocol: "https:"
		}, (res) => {
			const data: Buffer[] = [];

			res
				.on("error", b)
				.on("data", (d) => data.push(d))
				.on("end", () => a({
					status: {
						code: res.statusCode!,
						message: res.statusMessage!
					},
					body: JSON.parse(Buffer.concat(data).toString())
				}))
		})
			.end());
	}

	static async getStats(name: string, from: string, to: string) {
		return new Promise<{
			status: {
				code: number;
				message: string;
			};
			body: NPM.Downloads;
		}>((a, b) => https.request({
			method: "GET",
			host: "api.npmjs.org",
			path: `/downloads/point/${from}:${to}/${name}`,
			headers: {
				"User-Agent": config.web.userAgent
			},
			protocol: "https:"
		}, (res) => {
			const data: Buffer[] = [];

			res
				.on("error", b)
				.on("data", (d) => data.push(d))
				.on("end", () => a({
					status: {
						code: res.statusCode!,
						message: res.statusMessage!
					},
					body: JSON.parse(Buffer.concat(data).toString())
				}))
		})
			.end());
	}

	// ^((?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*)(?:@(\^|~)?(.*))?$
	static parseString(str: string) {
		const [, name, version] = str.match(/^((?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*)(?:@?(.*))?$/) ?? [];
		if (name === undefined) return null;
		if (version === undefined) return {
			name,
			version: null
		}

		return {
			name,
			version
		}
	}

	/**
	 * 
	 * @param ver 
	 * @param versions 
	 * @param tags 
	 */
	static parseVersion(ver: string, versions: string[], tags: NPM.Tags) {
		if (Object.keys(tags).includes(ver)) return {
			all: [tags[ver]],
			latest: tags[ver]
		}
		const [, version] = ver.match(/^((?:\^|~)?.*)$/) ?? [];
		if (version === undefined) return null
		const all = versions.map(v => [v, semver.satisfies(v, version)]).filter(([, t]) => t === true).map(v => v[0]) as unknown as string[];
		if (all.length === 0) return null;
		return {
			all,
			latest: all.sort().reverse()[0]
		}
	}

	static scopedParsing(str: string) {
		return /^(?!@).*\/.*$/.test(str) ? `@${str}` : str;
	}
}
