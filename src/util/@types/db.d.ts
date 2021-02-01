import { ObjectId, WithId } from "mongodb";

declare global {
	interface DBEntry {
		_id?: ObjectId;
	}

	export type PremiumEntry = PremiumGuildEntry | PremiumUserEntry;

	interface PremiumGuildEntry extends DBEntry {
		type: "guild";
		guildId: string;
		user: string;
		active: boolean;
		activationDate: number;
	}

	interface PremiumUserEntry extends DBEntry {
		type: "user";
		userId: string;
		active: boolean;
		amount: number;
		activationDate: number;
		patronId: string;
	}

	namespace Votes {
		interface DBLVote {
			user: string;
			type: "upvote" | "test";
			weekend: boolean;
			query: string;
			time: number;
		}

		interface DBoatsVote {
			user: string;
			time: number;
		}
	}

	type MaybeId<T> = WithId<T> | T;
}
