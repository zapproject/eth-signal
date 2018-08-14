const EventEmitter = require('events');
const fs = require('fs');

const HDWalletProvider = require('truffle-hdwallet-provider');
const Wei = require('weijs');

const SignalServerArtifacts = 'contracts/build/contracts/SignalServer.json';

class SignalServer extends EventEmitter {
	constructor(mnemonic) {
		super();

		this.provider = new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io/tOYbxwjtu0vJT4pG7TLH');
		this.wei = new Wei(this.provider);
	}

	async load() {
		await this.wei.accountsPromise;
		if ( wei.accunts.length == 0 ) {
			throw new Error('Unable to find any accounts');
		}

		this.address = this.wei.accounts.get(0);
		this.contract = await this._loadContract();
		
		this.startListening();
	}

	async _loadContract() {
		const SignalContract = JSON.parse(fs.readFileSync(SignalServerArtifacts));
		const abi = SignalContract.abi;
		const contract = wei.contract(SignalContract.abi);

		const network = await wei.rpc.net.version();

		if ( !(network in SignalContract.networks) ) {
			console.log('Cant use this network - no contract deployed there');
			console.log('Deploying a contract now.');

			await contract.deploy(SignalContract.bytecode, { from: this.address });

			SignalContract.networks[network] = {
				events: {},
				links: {},
				address: contract.address
			};

			fs.writeFileSync(SignalServerArtifacts, JSON.stringify(SignalContract, 0, 4));
		}
		else {
			const address = SignalContract.networks[network].address;
			contract.at(address);
		}

		return contract;
	}

	send(data, dest) {
		if ( !this.contract ) {
			throw new Error("Contract has not yet been loaded");
		}

		this.contract.signal(JSON.stringify(data), { from: this.address, to: dest });
	}

	startListening() {
		if ( !this.contract ) {
			throw new Error("Contract has not yet been loaded");
		}

		this.contract.Signal.listen({ to: this.address }).on('event', event => {
			this.emit('data', JSON.parse(event._msg), event);
		});
	}
}

module.exports = SignalServer;