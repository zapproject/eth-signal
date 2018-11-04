const EventEmitter = require('events');
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const SignalContract = require('../contract/build/contracts/SignalServer.json');

class SignalServer extends EventEmitter {
	constructor(mnemonic) {
		super();

		this.provider = new HDWalletProvider(mnemonic, 'wss://rinkeby.infura.io/ws/xeb916AFjrcttuQlezyq');
		this.web3 = new Web3(this.provider);
	}

	async load() {
		const accounts = await this.web3.eth.getAccounts();

		if ( accounts.length == 0 ) {
			throw new Error('Unable to find any accounts');
		}

		this.address = accounts[0];
		this.contract = await this._loadContract();

		await this.startListening();
	}

	async _loadContract() {
		let contract = new this.web3.eth.Contract(SignalContract.abi);
		const network = (await this.web3.eth.net.getId()).toString();

		if ( !(network in SignalContract.networks) ) {
			console.log('Cant use this network - no contract deployed there');
			if (process.env.APP_ENV === 'browser') return;
			console.log('Deploying a contract now.');

			contract = await contract.deploy({
				data: SignalContract.bytecode
			}).send({
				from: this.address
			});

			SignalContract.networks[network] = {
				events: {},
				links: {},
				address: contract.address
			};

			console.log('Contract deployed to', contract.address);
			const fs = require('fs');
			fs.writeFileSync(SignalServerArtifacts, JSON.stringify(SignalContract, 0, 4));
		}
		else {
			const address = SignalContract.networks[network].address;
			console.log('Using contract at', address);
			contract.options.address = address;
		}

		return contract;
	}

	async getPermissions(dest) {
		if ( !this.contract ) {
			throw new Error("Contract has not yet been loaded");
		}

		return await this.contract.methods.getPermissions(dest, this.address).call();
	}

	async setPermissions(dest, allowed) {
		if ( !this.contract ) {
			throw new Error("Contract has not yet been loaded");
		}

		return await this.contract.methods.setPermissions(dest, allowed).send({ from: this.address });
	}

	async send(data, dest) {
		if ( !this.contract ) {
			throw new Error("Contract has not yet been loaded");
		}

		await this.contract.methods.signal(dest, JSON.stringify(data)).send({ from: this.address });
	}

	async startListening() {
		if ( !this.contract ) {
			throw new Error("Contract has not yet been loaded");
		}

		console.log('Sending requests from', this.address);

		this.contract.events.Signal({
			filter: {to: this.address }
		}, (err, event) => {
			if ( err ) {
				throw err;
			}

			this.emit('data', JSON.parse(event.returnValues.signal), event);
		});
	}
}

module.exports = SignalServer;