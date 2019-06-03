import { Client, NetworkType } from 'orbs-client-sdk';

const ORBS_END_POINTS = [
  {
    URL: 'http://localhost:8080',
    VCHAIN_ID: 42
  },
  {
    URL: 'http://localhost:8080',
    VCHAIN_ID: 42
  },
];

const MAX_CONCURRENT_CLIENTS = ORBS_END_POINTS.length;

export class OrbsClientLoadBalancer {
  private clientsList;
  private availableClientIdx: number;
  constructor() {
    this.clientsList = [];
    this.availableClientIdx = undefined;
    this.allocateNextClient();
  }

  public getClientForUser(userGuid) {
    const userClientData = this.getClientDataByUserGuid(userGuid);
    if (userClientData) {
      return userClientData.client;
    }

    const clientData = this.clientsList[this.availableClientIdx];
    clientData.userGuid = userGuid;
    this.allocateNextClient();
    return clientData.client;
  }

  public getClientDataByUserGuid(userGuid) {
    return this.clientsList.find(c => c.userGuid === userGuid);
  }

  public calcNextAvailableClientIdx() {
    if (this.availableClientIdx === undefined) {
      this.availableClientIdx = 0;
      return;
    }

    this.availableClientIdx++;
    if (this.availableClientIdx >= MAX_CONCURRENT_CLIENTS) {
      this.availableClientIdx = 0;
      // TODO: notify a cicle was made
    }
  }

  public allocateNextClient() {
    this.calcNextAvailableClientIdx();
    // TODO: restart the orbs node
    const client = new Client(
      ORBS_END_POINTS[this.availableClientIdx].URL,
      ORBS_END_POINTS[this.availableClientIdx].VCHAIN_ID,
      'MAIN_NET' as NetworkType
    );
    this.clientsList[this.availableClientIdx] = { client, userGuid: null };
  }
}
