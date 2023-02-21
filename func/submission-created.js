import fetch from 'node-fetch';

import { API_ENDPOINT, MAX_EMBED_FIELD_CHARS, MAX_EMBED_FOOTER_CHARS } from "./helpers/discord-helpers.js";
import { createJwt, decodeJwt } from "./helpers/jwt-helpers.js";
import { getBan, isBlocked } from "./helpers/user-helpers.js";

export async function handler(event, context) {
    let payload;

    if (process.env.USE_NETLIFY_FORMS) {
        payload = JSON.parse(event.body).payload.data;
    } else {
        if (event.httpMethod !== "POST") {
            return {
                statusCode: 405
            };
        }

        const params = new URLSearchParams(event.body);
        payload = {
            banReason: params.get("banReason") || undefined,
            appealText: params.get("appealText") || undefined,
            futureActions: params.get("futureActions") || undefined,
            token: params.get("token") || undefined
        };
    }

    if (payload.banReason !== undefined &&
        payload.appealText !== undefined &&
        payload.futureActions !== undefined && 
        payload.token !== undefined) {
        
        const userInfo = decodeJwt(payload.token);
        if (isBlocked(userInfo.id)) {
            return {
                statusCode: 303,
                headers: {
                    "Location": `/error?msg=${encodeURIComponent("You cannot submit ban appeals with this Discord account.")}`,
                },
            };
        }
        
        const message = {
            embed: {
                title: "New report submitted!",
                timestamp: new Date().toISOString(),
                fields: [
                    {
                        name: "Submitter",
                        value: `<@${userInfo.id}> (${userInfo.username}#${userInfo.discriminator})`
                    },
                    {
                        name: "What is the host name?",
                        value: payload.hostName.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                    {
                        name: "Why are you reporting this host?",
                        value: payload.reportReason.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                    {
                        name: "Website of the Host?",
                        value: payload.website.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                    {
                        name: "Discord of the Host?",
                        value: payload.discord.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                    {
                        name: "Please Provide Evidence ( Link Only )",
                        value: payload.Evidence.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                ]
            }
        }
        
        const acceptmsg = {
            embed: {
                title: "New Blacklist",
                timestamp: new Date().toISOString(),
                fields: [
                    {
                        name: "What is the host name?",
                        value: payload.hostName.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                    {
                        name: "Why are you reporting this host?",
                        value: payload.reportReason.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                    {
                        name: "Website of the Host?",
                        value: payload.website.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                    {
                        name: "Discord of the Host?",
                        value: payload.discord.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                    {
                        name: "Please Provide Evidence ( Link Only )",
                        value: payload.Evidence.slice(0, MAX_EMBED_FIELD_CHARS)
                    },
                ]
            }
        }

            const accptmsg = await fetch(`${API_ENDPOINT}/channels/${encodeURIComponent(process.env.PUBLIC_CHANNEL)}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
                },
                body: JSON.stringify(acceptmsg)
            });

                message.components = [{
                    type: 1,
                    components: [{
                        type: 2,
                        style: 5,
                        label: "Approve Report & Blacklist Host",
                        url: `${accptmsg}`
                    }]
                }];
            }
        }

        const result = await fetch(`${API_ENDPOINT}/channels/${encodeURIComponent(process.env.APPEALS_CHANNEL)}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
            },
            body: JSON.stringify(message)
        });

        if (result.ok) {
            if (process.env.USE_NETLIFY_FORMS) {
                return {
                    statusCode: 200
                };
            } else {
                return {
                    statusCode: 303,
                    headers: {
                        "Location": "/success"
                    }
                };
            }
        } else {
            console.log(JSON.stringify(await result.json()));
            throw new Error("Failed to submit message");

            return {
                statusCode: 400
        };
        } 



