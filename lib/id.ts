import { nanoid } from "nanoid";

export const newId = () => nanoid();
export const now = () => new Date().toISOString();
