import {
	Call, OldCall, AnyChannel, TextableChannel, GroupChannel,
	User, OldGuildChannel, OldGroupChannel, FriendSuggestionReasons, Guild,
	PossiblyUncachedGuild, Emoji, Member, MemberPartial, Role,
	OldRole, UnavailableGuild, OldGuild, Invite, Message,
	PossiblyUncachedMessage, PartialEmoji, OldMessage, Relationship, Presence,
	RawRESTRequest, RawPacket, PartialUser, VoiceChannel, OldVoiceState,
	WebhookData
} from "eris"; ``
import NPMBot from "../main";

// @TODO FIND A WAY TO MAKE THIS NOT MANUAL
export default class ClientEvent {
	// I've spent 6 hours trying to figure this out, *these can stay as any*
	event: any;
	listener: any;
	constructor(event: "ready" | "disconnect", listener: (this: NPMBot) => void);
	constructor(event: "callCreate" | "callRing" | "callDelete", listener: (this: NPMBot, call: Call) => void);
	constructor(event: "callUpdate", listener: (this: NPMBot, call: Call, oldCall: OldCall) => void);
	constructor(event: "channelCreate" | "channelDelete", listener: (this: NPMBot, channel: AnyChannel) => void);
	constructor(event: "channelPinUpdate", listener: (this: NPMBot, channel: TextableChannel, timestamp: number, oldTimestamp: number) => void);
	constructor(event: "channelRecipientAdd" | "channelRecipientRemove", listener: (this: NPMBot, channel: GroupChannel, user: User) => void);
	constructor(event: "channelUpdate", listener: (this: NPMBot, channel: AnyChannel, oldChannel: OldGuildChannel | OldGroupChannel) => void);
	constructor(event: "connect" | "shardPreReady", listener: (this: NPMBot, id: number) => void);
	constructor(event: "friendSuggestionCreate", listener: (this: NPMBot, user: User, reasons: FriendSuggestionReasons) => void);
	constructor(event: "friendSuggestionDelete", listener: (this: NPMBot, user: User) => void);
	constructor(event: "guildBanAdd" | "guildBanRemove", listener: (this: NPMBot, guild: Guild, user: User) => void);
	constructor(event: "guildAvailable" | "guildCreate", listener: (this: NPMBot, guild: Guild) => void);
	constructor(event: "guildDelete", listener: (this: NPMBot, guild: PossiblyUncachedGuild) => void);
	constructor(event: "guildEmojisUpdate", listener: (this: NPMBot, guild: Guild, emojis: Emoji[], oldEmojis: Emoji[]) => void);
	constructor(event: "guildMemberAdd", listener: (this: NPMBot, guild: Guild, member: Member) => void);
	constructor(event: "guildMemberChunk", listener: (this: NPMBot, guild: Guild, members: Member[]) => void);
	constructor(event: "guildMemberRemove", listener: (this: NPMBot, guild: Guild, member: Member | MemberPartial) => void);
	constructor(event: "guildMemberUpdate", listener: (this: NPMBot, guild: Guild, member: Member, oldMember: { nick?: string; premiumSince: number; roles: string[] } | null) => void);
	constructor(event: "guildRoleCreate" | "guildRoleDelete", listener: (this: NPMBot, guild: Guild, role: Role) => void);
	constructor(event: "guildRoleUpdate", listener: (this: NPMBot, guild: Guild, role: Role, oldRole: OldRole) => void);
	constructor(event: "guildUnavailable" | "unavailableGuildCreate", listener: (this: NPMBot, guild: UnavailableGuild) => void);
	constructor(event: "guildUpdate", listener: (this: NPMBot, guild: Guild, oldGuild: OldGuild) => void);
	constructor(event: "hello", listener: (this: NPMBot, trace: string[], id: number) => void);
	constructor(event: "inviteCreate" | "inviteDelete", listener: (this: NPMBot, guild: Guild, invite: Invite) => void);
	constructor(event: "messageCreate", listener: (this: NPMBot, message: Message, /* everything after this is added by us */ update?: boolean, slash?: boolean, slashInfo?: { id: string; token: string; }) => void);
	constructor(event: "messageDelete" | "messageReactionRemoveAll", listener: (this: NPMBot, message: PossiblyUncachedMessage) => void);
	constructor(event: "messageReactionRemoveEmoji", listener: (this: NPMBot, message: PossiblyUncachedMessage, emoji: PartialEmoji) => void);
	constructor(event: "messageDeleteBulk", listener: (this: NPMBot, messages: PossiblyUncachedMessage[]) => void);
	constructor(event: "messageReactionAdd", listener: (this: NPMBot, message: PossiblyUncachedMessage, emoji: Emoji, reactor: Member | { id: string }) => void);
	constructor(event: "messageReactionRemove", listener: (this: NPMBot, message: PossiblyUncachedMessage, emoji: PartialEmoji, userID: string) => void);
	constructor(event: "messageUpdate", listener: (this: NPMBot, message: Message, oldMessage: OldMessage | null) => void);
	constructor(event: "presenceUpdate", listener: (this: NPMBot, other: Member | Relationship, oldPresence: Presence | null) => void);
	constructor(event: "rawREST", listener: (this: NPMBot, request: RawRESTRequest) => void);
	constructor(event: "rawWS" | "unknown", listener: (this: NPMBot, packet: RawPacket, id: number) => void);
	constructor(event: "relationshipAdd" | "relationshipRemove", listener: (this: NPMBot, relationship: Relationship) => void);
	constructor(event: "relationshipUpdate", listener: (this: NPMBot, relationship: Relationship, oldRelationship: { type: number }) => void);
	constructor(event: "typingStart", listener: (this: NPMBot, channel: TextableChannel | { id: string }, user: User | { id: string }, member: Member | null) => void);
	constructor(event: "userUpdate", listener: (this: NPMBot, user: User, oldUser: PartialUser | null) => void);
	constructor(event: "voiceChannelJoin", listener: (this: NPMBot, member: Member, newChannel: VoiceChannel) => void);
	constructor(event: "voiceChannelLeave", listener: (this: NPMBot, member: Member, oldChannel: VoiceChannel) => void);
	constructor(event: "voiceChannelSwitch", listener: (this: NPMBot, member: Member, newChannel: VoiceChannel, oldChannel: VoiceChannel) => void);
	constructor(event: "voiceStateUpdate", listener: (this: NPMBot, member: Member, oldState: OldVoiceState) => void);
	constructor(event: "warn" | "debug", listener: (this: NPMBot, message: string, id: number) => void);
	constructor(event: "webhooksUpdate", listener: (this: NPMBot, data: WebhookData) => void);
	constructor(event: "shardReady" | "shardResume", listener: (this: NPMBot, id: number) => void);
	constructor(event: "shardDisconnect" | "error", listener: (this: NPMBot, err: Error, id: number) => void);
	constructor(event: string, listener: (this: NPMBot, ...args: any[]) => void) {
		this.event = event;
		this.listener = listener;
	}

	async handle(client: NPMBot, ...d: any[]) {
		return this.listener.call(client, ...d);
	}
}
