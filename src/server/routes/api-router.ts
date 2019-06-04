import * as bodyParser from 'body-parser';
import { Router } from 'express';
import * as uuid from 'uuid';
import { FileManager } from '../file-manager';
import { ContractManager } from '../contract-manager';
import { getBasicUsersList } from '../users-manager';

const files = new FileManager();
const contracts = new ContractManager(files);

function getUserGuidFromReq(req) {
  if (!req.session.userGuid) {
    req.session.userGuid = uuid();
  }
  return req.session.userGuid;
}

export function apiRouter() {
  const router = Router();
  router.use(bodyParser.json());
  router.use(
    require('express-session')({
      secret: 'Shambalulu',
      resave: false,
      saveUninitialized: true,
      cookie: {},
    }),
  );

  router.post('/api/execute', async (req, res) => {
    try {
      const userGuid = getUserGuidFromReq(req);
      const { stateJson, eventsJson, result } = await contracts.callGammaServer(userGuid, req.body);

      // convert bigint to string (json can't handle bigints)
      result.blockHeight = result.blockHeight.toString();
      result.outputArguments.forEach(arg => (arg.value = arg.value.toString()));
      result.outputEvents.forEach(event =>
        event.arguments.forEach(arg => (arg.value = typeof arg.value === 'bigint' ? arg.value.toString : arg.value)),
      );

      res.json({
        ok: true,
        eventsJson,
        stateJson,
        result,
      });
    } catch (err) {
      console.log(err);
      res.json({
        ok: false,
        stateJson: {},
        result: err,
      });
    }

    res.end();
  });

  router.get('/api/state', async (req, res) => {
    const userGuid = getUserGuidFromReq(req);
    const contractName = req.query.contractName;
    const returnJson = await contracts.getContractState(userGuid, {
      contractName,
    });

    res.json(returnJson);
    res.end();
  });

  router.get('/api/events', async (req, res) => {
    const userGuid = getUserGuidFromReq(req);
    const contractName = req.query.contractName;
    const returnJson = await contracts.getContractEvents(userGuid, {
      contractName,
    });

    res.json(returnJson);
    res.end();
  });

  router.get('/api/discover/contract', async (req, res) => {
    const contractName = req.query.contractName;
    const gammaResponse = await contracts.discoverContract({ contractName });

    res.json({
      ok: true,
      data: JSON.parse(gammaResponse),
    });
    res.end();
  });

  router.post('/api/deploy', async (req, res) => {
    const userGuid = getUserGuidFromReq(req);
    const file = files.load('THE_ONE_AND_ONLY_FILE');
    file.code = req.body.data;
    files.save(file);

    const { ok, deploymentError, contractName, methods, stateJson, eventsJson } = await contracts.decorateAndDeploy(
      userGuid,
      file,
    );

    res.json({
      ok,
      deploymentError,
      eventsJson,
      contractName,
      methods,
      stateJson,
    });
    res.end();
  });

  router.post('/api/deploy/:name', async (req, res) => {
    const userGuid = getUserGuidFromReq(req);
    const file = files.new(req.params.name, req.body.data);
    const { contractName, methods, stateJson, deploymentError, eventsJson } = await contracts.decorateAndDeploy(
      userGuid,
      file,
    );

    res.json({
      ok: true,
      deploymentError,
      eventsJson,
      contractName,
      methods,
      stateJson,
    });
    res.end();
  });

  router.post('/api/test/:name', async (req, res) => {
    const { stdout, stderr, success } = await contracts.runTest(req.params.name);

    res.json({
      ok: true,
      allTestsPassed: success,
      output: stdout,
      stderr,
    });
    res.end();
  });

  router.get('/api/users', async (req, res) => {
    const users = getBasicUsersList();
    res.json({
      ok: true,
      users,
    });
    res.end();
  });

  router.post('/api/set-user', (req, res) => {
    res.send(`ok`);
  });

  return router;
}
