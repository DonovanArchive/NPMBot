// https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
declare namespace NPM {
	// there are a lot of underscore properties that we aren't going to worry about, since they aren't meant for us

	interface Repository {
		type: string;
		url: string;
	}

	interface User {
		name: string;
		email: string;
	}

	interface Author extends Partial<User> {
		url: string;
	}

	interface Tags {
		latest: string;
		[k: string]: string;
	}

	interface Distribution {
		integrity?: string;
		shasum: string;
		tarball: string;
		fileCount?: number;
		unpackedSize?: number;
		"npm-signature"?: string;
	}

	interface Version {
		name: string;
		version: string;
		description: string;
		main: string;
		types: string;
		scripts: Record<string, string>;
		repository: Repository;
		keywords?: string[];
		author: Author;
		license: string;
		bugs: {
			url: string;
		};
		homepage: string;
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
		optionalDependencies?: Record<string, string>;
		peerDependencies?: Record<string, string>;
		gitHead: string;
		dist: Distribution;
		directories: {};
		maintainers: User[];
		contributors?: User[];
		deprecated?: string;
		files?: string[];
		engines?: {
			node?: string;
			npm?: string;
			[k: string]: string | undefined;
		};
		bin?: Record<string, string>;
		_npmVersion: string;
		_nodeVersion: string;
		_npmUser: User;
		// by spec, ANY field can be included here from the package author
		[k: string]: any;
	}

	interface Package {
		name: string;
		"dist-tags": Tags;
		versions: Record<string, Version>;
		time: {
			created: string;
			modified: string;
			[k: string]: string;
		} & {
			unpublished?: {
				name: string;
				time: string;
				tags: Record<string, string>;
				versions: string[];
				maintainers: User[];
			};
		}
		maintainers: User[];
		contributors?: User[];
		description: string;
		homepage: string;
		keywords: string[];
		repository: Repository;
		author: Author;
		bugs: {
			url: string;
		};
		license: string;
		readme: string;
		readmeFilename: string;
		users?: Record<string, true>;
	}

	interface Downloads {
		downloads: number;
		start: string;
		end: string;
		package: string;
	}
}
