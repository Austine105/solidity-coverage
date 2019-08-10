
/*
  Utilities for generating a mock truffle project to test plugin.
*/

const fs = require('fs');
const shell = require('shelljs');

const configPath =     './mock/.solcover.js';
const testPath =       './test/sources/js/';
const sourcesPath =    './test/sources/solidity/contracts/app/';
const migrationPath =  './mock/migrations/2_deploy.js';

const defaultTruffleConfig = `
  module.exports = {
    networks: {
      development: {
        host: "localhost",
        port: 8545,
        network_id: "*"
      }
    },
    compilers: {
      solc: {
        version: "0.5.3",
      }
    }
  };
`

/**
 * Installs mock truffle project at ./mock with a single contract
 * and test specified by the params.
 * @param  {String} contract <contractName.sol> located in /test/sources/cli/
 * @param  {[type]} test     <testName.js> located in /test/cli/
 */
function install(
  contract,
  test,
  config,
  _truffleConfig,
  _trufflejsName,
  noMigrations
) {

  const configjs = `module.exports = ${JSON.stringify(config)}`;

  const migration = `
    const A = artifacts.require('${contract}');
    module.exports = function(deployer) { deployer.deploy(A) };
  `;

  // Mock truffle-config.js
  const trufflejsName = _trufflejsName || 'truffle-config.js';
  const trufflejs = _truffleConfig || defaultTruffleConfig;

  // Generate mock
  shell.mkdir('./mock');
  shell.cp('-Rf', './test/integration/truffle', './mock');
  shell.cp(`${sourcesPath}${contract}.sol`, `./mock/contracts/${contract}.sol`);

  if (!noMigrations){
    fs.writeFileSync(migrationPath, migration);
  }

  fs.writeFileSync(`./mock/${trufflejsName}`, trufflejs);
  fs.writeFileSync(`${configPath}`, configjs);

  shell.cp(`${testPath}${test}`, `./mock/test/${test}`);
};

/**
 * Installs mock truffle project with two contracts (for inheritance, libraries, etc)
 * @param  {config} .solcover.js configuration
 */
function installMultiple(contracts, test, config) {
  const configjs = `module.exports = ${JSON.stringify(config)}`;

  const deployContracts = `
    var A = artifacts.require(`${contracts[0]}`);
    var B = artifacts.require(`${contracts[1]}`);
    module.exports = function(deployer) {
      deployer.deploy(A);
      deployer.link(A, B);
      deployer.deploy(B);
    };
  `;

  shell.mkdir('./mock');
  shell.cp('-Rf', './test/integration/truffle', './mock');

  contracts.forEach(item => {
    shell.cp(`${sourcesPath}${item}.sol`, `./mock/contracts/${item}.sol`)
  });

  shell.cp(`${testPath}${test}`, `./mock/test/${test}`);
  fs.writeFileSync('./mock/truffle-config.js', defaultTruffleJs);
  fs.writeFileSync('./.solcover.js', configjs);
  fs.writeFileSync(migrationPath, migration)
};


/**
 * Removes mock truffle project and coverage reports generated by exec.js
 */
function remove() {
  shell.config.silent = true;
  shell.rm('./.solcover.js');
  shell.rm('-Rf', 'mock');
  shell.rm('-Rf', 'coverage');
  shell.rm('coverage.json');
  shell.config.silent = false;
};


module.exports = {
  install: install,
  installMultiple: installMultiple,
  remove: remove
}
