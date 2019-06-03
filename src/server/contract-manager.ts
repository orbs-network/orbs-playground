import { exec } from 'child-process-promise';
import * as fs from 'fs';
import { argBytes, argString, argUint32, argUint64, decodeHex } from 'orbs-client-sdk';
import * as path from 'path';
import * as tmp from 'tmp-promise';
import * as util from 'util';
import * as uuid from 'uuid';
import { callContract, deployContract, queryContract } from './orbs-adapter';
import { OrbsClientLoadBalancer } from './orbs-client-load-balancer';
import { getUser } from './users-manager';

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

export class ContractManager {
  private orbsClientLoadBalancer: OrbsClientLoadBalancer;
  constructor(private files) {
    this.orbsClientLoadBalancer = new OrbsClientLoadBalancer();
  }

  public async runTest(testContractFileName) {
    const contractFile = this.files.load(testContractFileName.substring(0, testContractFileName.indexOf('_test')));
    const testFile = this.files.load(`${testContractFileName}`);

    const tmpDir = await tmp.dir({ unsafeCleanup: true });

    await writeFile(`${path.join(tmpDir.path, contractFile.name)}.go`, contractFile.code);
    await writeFile(`${path.join(tmpDir.path, testFile.name)}.go`, testFile.code);

    try {
      const { stdout, stderr } = await exec(`go test -v`, { cwd: tmpDir.path });
      return { stdout, stderr, success: true };
    } catch ({ stdout, stderr }) {
      return { stdout, stderr, success: false };
    } finally {
      tmpDir.cleanup();
    }
  }

  public async discoverContract({ contractName }) {
    const contractFilepath = `/tmp/${contractName}.go`;

    const result = await exec(`go run introspector.go -contract ${contractFilepath}`, {
      cwd: path.join(path.dirname(__dirname), '..', '..', 'go', 'introspector'),
    });
    return result.stderr;
  }

  public async getContractState(userGuid, { contractName }) {
    let returnValue;

    try {
      const client = this.orbsClientLoadBalancer.getClientForUser(userGuid);
      const callResult = await queryContract(client, getUser('user1'), contractName, 'decoratorReadProxiedState');

      returnValue = {
        ok: true,
        result: JSON.parse(Buffer.from(callResult.outputArguments[0].value).toString()),
      };
    } catch (err) {
      console.log(err);
      returnValue = {
        ok: false,
        result: err,
      };
    }

    return returnValue;
  }

  public async getContractEvents(userGuid, { contractName }) {
    let returnValue;
    try {
      const client = this.orbsClientLoadBalancer.getClientForUser(userGuid);
      const callResult = await queryContract(client, getUser('user1'), contractName, 'decoratorReadProxiedEvents');

      let events;
      const result = Buffer.from(callResult.outputArguments[0].value).toString();
      if (result === 'null') {
        events = [];
      } else {
        events = JSON.parse(result);
      }

      returnValue = {
        ok: true,
        result: events,
      };

      console.log('from events: ', returnValue);
    } catch (err) {
      console.log(err);
      returnValue = {
        ok: false,
        result: err,
      };
    }

    return returnValue;
  }

  public async decorateAndDeploy(userGuid, file) {
    const client = this.orbsClientLoadBalancer.getClientForUser(userGuid);
    const assignedUid = uuid();
    const contractName = `contract_${assignedUid}`;
    const contractFilepath = `/tmp/${contractName}.go`;
    const decoratedContractFilepath = `/tmp/${contractName}_decorated.go`;

    // Write the contract somewhere
    console.log('writing the contract to file');
    await writeFile(contractFilepath, file.code);

    await exec(`go run decorator.go -contract ${contractFilepath} -output ${decoratedContractFilepath}`, {
      cwd: path.join(path.dirname(__dirname), '..', '..', 'go', 'decorator'),
    });

    const decoratedContractCode = await readFile(decoratedContractFilepath);

    const txResultJson = await deployContract(client, getUser('user1'), contractName, decoratedContractCode.toString());
    if (txResultJson.executionResult === 'ERROR_SMART_CONTRACT') {
      return {
        ok: false,
        deploymentError: txResultJson.outputArguments[0].value || '',
      };
    }

    const discoverResponse = await this.discoverContract({ contractName });
    const stateJson = await this.getContractState(userGuid, { contractName });
    const eventsJson = await this.getContractEvents(userGuid, { contractName });
    const methods = JSON.parse(discoverResponse);

    file.lastContractIdInGamma = contractName;
    this.files.save(file);

    return {
      ok: true,
      contractName,
      methods,
      stateJson,
      txResultJson,
      eventsJson,
    };
  }

  public async callGammaServer(userGuid, { contractName, method, args, user }) {
    const client = this.orbsClientLoadBalancer.getClientForUser(userGuid);
    const convertedArgs = args.map(toOrbsArgs);
    const result = await callContract(client, getUser(user), contractName, method, ...convertedArgs);
    const stateJson = await this.getContractState(userGuid, { contractName });
    const eventsJson = await this.getContractEvents(userGuid, { contractName });

    return { stateJson, result, eventsJson };
  }
}

function toOrbsArgs(arg) {
  switch (arg.type) {
    case 'uint32':
      return argUint32(Number(arg.value) || 0);

    case 'uint64':
      return argUint64(Number(arg.value) || 0);

    case 'string':
      return argString(arg.value);

    case '[]byte':
      return arg.value ? argBytes(decodeHex(arg.value)) : argBytes(new Uint8Array());

    default:
      break;
  }
}
