import { WebClient } from '@slack/web-api';
import { Client } from 'orbs-client-sdk';
import { SLACK_TOKEN } from './config';
import { OrbsClientsManager } from './orbs-clients-manager';

export class OrbsClientLoadBalancer {
  private orbsClientsManager: OrbsClientsManager;
  private availableClientSlot: number;
  private userGuidToClientIdx: Map<string, number>;
  private clientIdxToUserGuid: Map<number, string>;

  constructor() {
    this.orbsClientsManager = new OrbsClientsManager();
    this.availableClientSlot = undefined;
    this.userGuidToClientIdx = new Map();
    this.clientIdxToUserGuid = new Map();
  }

  public getClientForUser(userGuid: string): Client {
    // user already has a client assigned?
    const userClient = this.getClientByUserGuid(userGuid);
    if (userClient) {
      return userClient;
    }

    this.calcNextAvailableClientIdx();
    // was this client idx already assigned to a user?
    if (this.clientIdxToUserGuid.has(this.availableClientSlot)) {
      // restart the server before we assign it
      this.orbsClientsManager.restartServerByIdx(this.availableClientSlot);
    }

    this.clientIdxToUserGuid.set(this.availableClientSlot, userGuid);
    this.userGuidToClientIdx.set(userGuid, this.availableClientSlot);
    return this.orbsClientsManager.getClientByIdx(this.availableClientSlot);
  }

  public async restartServerByUser(userGuid: string): Promise<boolean> {
    const clientIdx = this.userGuidToClientIdx.get(userGuid);
    if (clientIdx !== undefined) {
      await this.orbsClientsManager.restartServerByIdx(clientIdx);
      return true;
    }

    return false;
  }

  private getClientByUserGuid(userGuid: string): Client {
    const clientIdx = this.userGuidToClientIdx.get(userGuid);
    if (clientIdx !== undefined) {
      return this.orbsClientsManager.getClientByIdx(clientIdx);
    }
    return null;
  }

  private calcNextAvailableClientIdx() {
    if (this.availableClientSlot === undefined) {
      this.availableClientSlot = 0;
      return;
    }

    this.availableClientSlot++;
    if (this.availableClientSlot >= this.orbsClientsManager.getTotalClients()) {
      this.availableClientSlot = 0;
      this.sendSlackMessage('Orbs-Playground made a full cycle');
    }
  }

  private async sendSlackMessage(message: string) {
    if (SLACK_TOKEN) {
      const web = new WebClient(SLACK_TOKEN);
      const res = await web.chat.postMessage({ channel: '#online-ide', text: message });
      console.log('Message sent: ', res.ts);
    }
  }
}
