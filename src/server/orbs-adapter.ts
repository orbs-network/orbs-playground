import { argUint32, argString, argBytes, Client } from 'orbs-client-sdk';
import { TextEncoder } from 'util';

export async function callContract(client, user, contractName, methodName, ...params) {
  const [tx] = client.createTransaction(
    user.PublicKey,
    user.PrivateKey,
    contractName,
    methodName,
    params
  );
  const txResult = await client.sendTransaction(tx);
  if (txResult.outputArguments.length > 0) {
    console.log(
      `${methodName} returned`,
      txResult.outputArguments[0].value.toString()
    );
  }
  return txResult;
}

export async function queryContract(client, user, contractName, methodName, ...params) {
  const tx = client.createQuery(
    user.PublicKey,
    contractName,
    methodName,
    params
  );
  const queryResult = await client.sendQuery(tx);

  if (queryResult.outputArguments.length > 0) {
    console.log(
      `${methodName} returned`,
      queryResult.outputArguments[0].value.toString()
    );
  }
  return queryResult;
}

export async function deployContract(client, user, contractName, contractCode) {
  const contractNameArg = argString(contractName);
  const contractLangArg = argUint32(1); // goLang
  const contractCodeArg = argBytes(new TextEncoder().encode(contractCode));
  const args = [contractNameArg, contractLangArg, contractCodeArg];

  const [tx] = client.createTransaction(
    user.PublicKey,
    user.PrivateKey,
    '_Deployments',
    'deployService',
    args
  );

  const txResult = await client.sendTransaction(tx);
  console.log('txResult', txResult);
  return txResult;
}
