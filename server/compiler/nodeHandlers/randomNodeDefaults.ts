import { customAlphabet, nanoid } from "nanoid";

const alnum12 = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

export function randomAlnum12(): string {
  return alnum12();
}

export function randomShortId(length = 6): string {
  return nanoid(length);
}
