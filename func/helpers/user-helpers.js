import fetch from 'node-fetch';

import { API_ENDPOINT } from "./discord-helpers.js";

export async function getUserInfo(token) {
    const result = await fetch(`${API_ENDPOINT}/users/@me`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await result.json();

    if (!result.ok) {
        console.log(data);
        throw new Error("Failed to get user information");
    }

    return data;
}

export function isBlocked(userId) {
    if (process.env.BLOCKED_USERS) {
        const blockedUsers = process.env.BLOCKED_USERS.replace(/"/g, "").split(",").filter(Boolean);
        if (blockedUsers.indexOf(userId) > -1) {
            return true;
        }
    }

    return false;
}
