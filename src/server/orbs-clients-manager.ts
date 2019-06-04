import { Client, NetworkType } from 'orbs-client-sdk';
import { ORBS_END_POINTS } from './config';
import * as request from 'request';

interface IEndpointData {
  URL: string;
  VCHAIN_ID: number;
}

interface IClientData {
  client: Client;
  endPointData: IEndpointData;
}

export class OrbsClientsManager {
  private clientsDataList: IClientData[];
  constructor() {
    this.clientsDataList = [];
    this.allocateAllClients();
  }

  public getTotalClients(): number {
    return this.clientsDataList.length;
  }

  public getClientByIdx(idx: number): Client {
    return this.clientsDataList[idx].client;
  }

  public restartServerByIdx(idx: number) {
    return new Promise((resolve, reject) => {
      request.get(`${this.clientsDataList[idx].endPointData.URL}/debug/gamma/restart`, {}, (err, data) =>
        err ? reject(err) : resolve(data.body),
      );
    });
  }

  private allocateAllClients() {
    for (const endPointData of ORBS_END_POINTS) {
      const client = new Client(endPointData.URL, endPointData.VCHAIN_ID, 'MAIN_NET' as NetworkType);
      this.clientsDataList.push({ client, endPointData });
    }
  }
}
