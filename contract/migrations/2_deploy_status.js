var SignalServer = artifacts.require("./SignalServer.sol");

module.exports = function(deployer) {
  deployer.deploy(SignalServer);
};
