const EventEmitter = require('events');
const fs = require('fs');

const HDWalletProvider = require('truffle-hdwallet-provider');
const Wei = require('weijs');

const SignalServerArtifacts = 'contract/build/contracts/SignalServer.json';

class SignalServer extends EventEmitter {
	constructor(mnemonic) {
		super();

		this.provider = new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io/tOYbxwjtu0vJT4pG7TLH');
		this.wei = new Wei(this.provider);
	}

	async load() {
		await this.wei.accountsPromise;
		if ( this.wei.accounts.length == 0 ) {
			throw new Error('Unable to find any accounts');
		}

		this.address = this.wei.accounts.get(0).address;
		this.contract = await this._loadContract();
		
		await this.startListening();
	}

	async _loadContract() {
		const SignalContract = JSON.parse(fs.readFileSync(SignalServerArtifacts));
		const abi = SignalContract.abi;
		const contract = this.wei.contract(SignalContract.abi);

		const network = await this.wei.rpc.net.version();

		if ( !(network in SignalContract.networks) ) {
			console.log('Cant use this network - no contract deployed there');
			console.log('Deploying a contract now.');

			await contract.deploy(SignalContract.bytecode, { from: this.address });

			SignalContract.networks[network] = {
				events: {},
				links: {},
				address: contract.address
			};

			console.log('Contract deployed to', contract.address);

			fs.writeFileSync(SignalServerArtifacts, JSON.stringify(SignalContract, 0, 4));
		}
		else {
			const address = SignalContract.networks[network].address;
			console.log('Using contract at', address);
			contract.at(address);
		}

		return contract;
	}

	async send(data, dest) {
		if ( !this.contract ) {
			throw new Error("Contract has not yet been loaded");
		}

		await this.contract.signal(this.address, dest, JSON.stringify(data), { from: this.address });
	}

	async startListening() {
		if ( !this.contract ) {
			throw new Error("Contract has not yet been loaded");
		}

		console.log('Sending requests from', this.address);
		const listen = await this.contract.Signal.listen({ to: this.address });
		
		listen.on('event', event => {
			console.log('Received event', event);
			this.emit('data', JSON.parse(event.signal), event);
		});
	}
}

module.exports = SignalServer;