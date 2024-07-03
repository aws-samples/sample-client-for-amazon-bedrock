"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordChannelSearchTool = exports.DiscordSendMessagesTool = exports.DiscordGetTextChannelsTool = exports.DiscordGetGuildsTool = exports.DiscordGetMessagesTool = void 0;
const discord_js_1 = require("discord.js");
const env_1 = require("@langchain/core/utils/env");
const tools_1 = require("@langchain/core/tools");
/**
 * A tool for retrieving messages from a discord channel using a bot.
 * It extends the base Tool class and implements the _call method to
 * perform the retrieve operation. Requires an bot token which can be set
 * in the environment variables, and a limit on how many messages to retrieve.
 * The _call method takes the discord channel ID as the input argument.
 * The bot must have read permissions to the given channel. It returns the
 * message content, author, and time the message was created for each message.
 */
class DiscordGetMessagesTool extends tools_1.Tool {
    static lc_name() {
        return "DiscordGetMessagesTool";
    }
    constructor(fields) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "discord-get-messages"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: `A discord tool. useful for reading messages from a discord channel. 
  Input should be the discord channel ID. The bot should have read 
  permissions for the channel.`
        });
        Object.defineProperty(this, "botToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "messageLimit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { botToken = (0, env_1.getEnvironmentVariable)("DISCORD_BOT_TOKEN"), messageLimit = 10, client, } = fields ?? {};
        if (!botToken) {
            throw new Error("Environment variable DISCORD_BOT_TOKEN missing, but is required for DiscordGetMessagesTool.");
        }
        this.client =
            client ??
                new discord_js_1.Client({
                    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages],
                });
        this.botToken = botToken;
        this.messageLimit = messageLimit;
    }
    /** @ignore */
    async _call(input) {
        try {
            await this.client.login(this.botToken);
            const channel = (await this.client.channels.fetch(input));
            if (!channel) {
                return "Channel not found.";
            }
            const messages = await channel.messages.fetch({
                limit: this.messageLimit,
            });
            await this.client.destroy();
            const results = messages.map((message) => ({
                author: message.author.tag,
                content: message.content,
                timestamp: message.createdAt,
            })) ?? [];
            return JSON.stringify(results);
        }
        catch (err) {
            await this.client.destroy();
            return "Error getting messages.";
        }
    }
}
exports.DiscordGetMessagesTool = DiscordGetMessagesTool;
/**
 * A tool for retrieving all servers a bot is a member of. It extends the
 * base `Tool` class and implements the `_call` method to perform the retrieve
 * operation. Requires a bot token which can be set in the environment
 * variables.
 */
class DiscordGetGuildsTool extends tools_1.Tool {
    static lc_name() {
        return "DiscordGetGuildsTool";
    }
    constructor(fields) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "discord-get-guilds"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: `A discord tool. Useful for getting a list of all servers/guilds the bot is a member of. No input required.`
        });
        Object.defineProperty(this, "botToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { botToken = (0, env_1.getEnvironmentVariable)("DISCORD_BOT_TOKEN"), client } = fields ?? {};
        if (!botToken) {
            throw new Error("Environment variable DISCORD_BOT_TOKEN missing, but is required for DiscordGetGuildsTool.");
        }
        this.client =
            client ??
                new discord_js_1.Client({
                    intents: [discord_js_1.GatewayIntentBits.Guilds],
                });
        this.botToken = botToken;
    }
    /** @ignore */
    async _call(_input) {
        try {
            await this.client.login(this.botToken);
            const guilds = await this.client.guilds.fetch();
            await this.client.destroy();
            const results = guilds.map((guild) => ({
                id: guild.id,
                name: guild.name,
                createdAt: guild.createdAt,
            })) ?? [];
            return JSON.stringify(results);
        }
        catch (err) {
            await this.client.destroy();
            return "Error getting guilds.";
        }
    }
}
exports.DiscordGetGuildsTool = DiscordGetGuildsTool;
/**
 * A tool for retrieving text channels within a server/guild a bot is a member
 * of. It extends the base `Tool` class and implements the `_call` method to
 * perform the retrieve operation. Requires a bot token which can be set in
 * the environment variables. The `_call` method takes a server/guild ID
 * to get its text channels.
 */
class DiscordGetTextChannelsTool extends tools_1.Tool {
    static lc_name() {
        return "DiscordGetTextChannelsTool";
    }
    constructor(fields) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "discord-get-text-channels"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: `A discord tool. Useful for getting a list of all text channels in a server/guild. Input should be a discord server/guild ID.`
        });
        Object.defineProperty(this, "botToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { botToken = (0, env_1.getEnvironmentVariable)("DISCORD_BOT_TOKEN"), client } = fields ?? {};
        if (!botToken) {
            throw new Error("Environment variable DISCORD_BOT_TOKEN missing, but is required for DiscordGetTextChannelsTool.");
        }
        this.client =
            client ??
                new discord_js_1.Client({
                    intents: [discord_js_1.GatewayIntentBits.Guilds],
                });
        this.botToken = botToken;
    }
    /** @ignore */
    async _call(input) {
        try {
            await this.client.login(this.botToken);
            const guild = await this.client.guilds.fetch(input);
            const channels = await guild.channels.fetch();
            await this.client.destroy();
            const results = channels
                .filter((channel) => channel?.type === discord_js_1.ChannelType.GuildText)
                .map((channel) => ({
                id: channel?.id,
                name: channel?.name,
                createdAt: channel?.createdAt,
            })) ?? [];
            return JSON.stringify(results);
        }
        catch (err) {
            await this.client.destroy();
            return "Error getting text channels.";
        }
    }
}
exports.DiscordGetTextChannelsTool = DiscordGetTextChannelsTool;
/**
 * A tool for sending messages to a discord channel using a bot.
 * It extends the base Tool class and implements the _call method to
 * perform the retrieve operation. Requires a bot token and channelId which can be set
 * in the environment variables. The _call method takes the message to be
 * sent as the input argument.
 */
class DiscordSendMessagesTool extends tools_1.Tool {
    static lc_name() {
        return "DiscordSendMessagesTool";
    }
    constructor(fields) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "discord-send-messages"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: `A discord tool useful for sending messages to a discod channel.
  Input should be the discord channel message, since we will already have the channel ID.`
        });
        Object.defineProperty(this, "botToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "channelId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { botToken = (0, env_1.getEnvironmentVariable)("DISCORD_BOT_TOKEN"), channelId = (0, env_1.getEnvironmentVariable)("DISCORD_CHANNEL_ID"), client, } = fields ?? {};
        if (!botToken) {
            throw new Error("Environment variable DISCORD_BOT_TOKEN missing, but is required for DiscordSendMessagesTool.");
        }
        if (!channelId) {
            throw new Error("Environment variable DISCORD_CHANNEL_ID missing, but is required for DiscordSendMessagesTool.");
        }
        this.client =
            client ??
                new discord_js_1.Client({
                    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages],
                });
        this.botToken = botToken;
        this.channelId = channelId;
    }
    /** @ignore */
    async _call(message) {
        try {
            await this.client.login(this.botToken);
            const channel = (await this.client.channels.fetch(this.channelId));
            if (!channel) {
                throw new Error("Channel not found");
            }
            if (!(channel.constructor === discord_js_1.TextChannel)) {
                throw new Error("Channel is not text channel, cannot send message");
            }
            await channel.send(message);
            await this.client.destroy();
            return "Message sent successfully.";
        }
        catch (err) {
            await this.client.destroy();
            return "Error sending message.";
        }
    }
}
exports.DiscordSendMessagesTool = DiscordSendMessagesTool;
/**
 * A tool for searching for messages within a discord channel using a bot.
 * It extends the base Tool class and implements the _call method to
 * perform the retrieve operation. Requires an bot token which can be set
 * in the environment variables, and the discord channel ID of the channel.
 * The _call method takes the search term as the input argument.
 * The bot must have read permissions to the given channel. It returns the
 * message content, author, and time the message was created for each message.
 */
class DiscordChannelSearchTool extends tools_1.Tool {
    static lc_name() {
        return "DiscordChannelSearchTool";
    }
    constructor(fields) {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "discord_channel_search_tool"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: `A discord toolkit. Useful for searching for messages 
  within a discord channel. Input should be the search term. The bot 
  should have read permissions for the channel.`
        });
        Object.defineProperty(this, "botToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "channelId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { botToken = (0, env_1.getEnvironmentVariable)("DISCORD_BOT_TOKEN"), channelId = (0, env_1.getEnvironmentVariable)("DISCORD_CHANNEL_ID"), client, } = fields ?? {};
        if (!botToken) {
            throw new Error("Environment variable DISCORD_BOT_TOKEN missing, but is required for DiscordChannelSearchTool.");
        }
        if (!channelId) {
            throw new Error("Environment variable DISCORD_CHANNEL_ID missing, but is required for DiscordChannelSearchTool.");
        }
        this.client =
            client ??
                new discord_js_1.Client({
                    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages],
                });
        this.botToken = botToken;
        this.channelId = channelId;
    }
    /** @ignore */
    async _call(searchTerm) {
        try {
            await this.client.login(this.botToken);
            const channel = (await this.client.channels.fetch(this.channelId));
            if (!channel) {
                return "Channel not found";
            }
            const messages = await channel.messages.fetch();
            await this.client.destroy();
            const filtered = messages.filter((message) => message.content.toLowerCase().includes(searchTerm.toLowerCase()));
            const results = filtered.map((message) => ({
                author: message.author.tag,
                content: message.content,
                timestamp: message.createdAt,
            })) ?? [];
            return JSON.stringify(results);
        }
        catch (err) {
            await this.client.destroy();
            return "Error searching through channel.";
        }
    }
}
exports.DiscordChannelSearchTool = DiscordChannelSearchTool;
