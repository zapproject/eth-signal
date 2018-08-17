const EthPeer = require('./peer');
const path = require('path');
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const ZapProvider = require('@zapjs/provider').ZapProvider;

function printUsage(args) {
	console.log('Usage: ', args[0] + ' ' + args[1] + ' [prim/sec] [address]');
}

const mnemonic = 'usual dream c1ay mimic dad suspect mercy amused leader save trip chase';

async function loadProvider(web3, owner) {
	const contracts = {
		artifactsDir: path.join(__dirname, '../', 'node_modules/@zapjs/artifacts/contracts/'),
		networkId: (await web3.eth.net.getId()).toString(),
		networkProvider: web3.currentProvider,
	};

	const handler = {
		handleIncoming: (data) => {
			console.log('handleIncoming', data);
		},
		handleUnsubscription: (data) => {
			console.log('handleUnsubscription', data);
		},
		handleSubscription: (data) => {
			console.log('handleSubscription', data);
		},
	};

	return new ZapProvider(owner, Object.assign(contracts, { handler }));
}


async function main(args) {
	const _provider = new HDWalletProvider(mnemonic, 'wss://kovan.infura.io/ws/xeb916AFjrcttuQlezyq');
	const web3 = new Web3(_provider);
	const accounts = await web3.eth.getAccounts();
	const provider = await loadProvider(web3, accounts[0]);

	if ( (await provider.getTitle()).length == 0 ) {
		console.log('Initializing provider...');
		await provider.initiateProvider({ title: "realtimeoracle", public_key: '0x1234' });
		console.log('Done');
	}
	else {
		console.log('Title of provider is', await provider.getTitle());
	}

	const endpoint = "data";
	const endpoints = await provider.getEndpoints();

	if ( endpoints.indexOf(endpoint) < 0 ) {
		console.log('Initiating endpoint', endpoint);
		await provider.initiateProviderCurve({
			endpoint,
			term: [3, 0, 0, 2, 10000]
		});
		console.log('Done.');
	}
	else {
		console.log('Found the', endpoint, 'endpoint');
	}


	provider.listenSubscribes({}, (err, event) => {
		if ( err ) throw err;

		const peer = new EthPeer(mnemonic);

		peer.on('connect', () => {
			console.log('Peer Connected. Sending data.');

			// Send data occassionally
			setInterval(() => {
				try {
					console.log('Sending data');
					peer.send('data');
				}
				catch (err) {
					console.log('Failed to send data');
				}
			}, 5 * 1000);
		});

		peer.on('signal', x => console.log('Signaling'));
		peer.on('signaled', x => console.log('Signaled'));
		peer.on('data', x => console.log('Data', x));
		peer.on('error', e => console.error('Error', e));

		peer.connect(true, event.returnValues.subscriber);
	});
}

main(process.argv);