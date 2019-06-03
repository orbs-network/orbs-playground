import { decodeHex } from 'orbs-client-sdk';

interface IRawUser {
  PrivateKey: string;
  PublicKey: string;
  Address: string;
}
interface IBasicUser {
  Name: string;
  Address: string;
}
interface IUser {
  PrivateKey: Uint8Array;
  PublicKey: Uint8Array;
  Address: Uint8Array;
}
interface IRawUsersMap {
  [name: string]: IRawUser;
}
interface IUsersMap {
  [name: string]: IUser;
}

const rawUsers: IRawUsersMap = require('../../../orbs-test-keys.json');
const users: IUsersMap = {};
for (const [Name, { PrivateKey, PublicKey, Address }] of Object.entries(rawUsers)) {
  users[Name] = {
    PrivateKey: decodeHex(PrivateKey),
    PublicKey: decodeHex(PublicKey),
    Address: decodeHex(Address),
  };
}

export function getUser(userName: string): IUser {
  return users[userName];
}

export function getBasicUsersList(): IBasicUser[] {
  return Object.entries(rawUsers).map(([Name, { Address }]) => ({
    Name,
    Address,
  }));
}
