export type Name = string;

let id = 0;

export const nextId = () => id++;

export const namePart = (name: Name) => name.split('$')[0];

export const fresh = (name: Name = '_') => `${namePart(name)}$${nextId()}`;
