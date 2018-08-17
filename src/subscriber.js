const EthPeer = require('./peer');
const path = require('path');
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const ZapProvider = require('@zapjs/provider').ZapProvider;
const ZapSubscriber = require('@zapjs/subscriber').ZapSubscriber;

function printUsage(args) {
	console.log('Usage: ', args[0] + ' ' + args[1] + ' [prim/sec] [address]');
}

const mnemonic = undefined;

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

async function loadSubscriber(web3, owner) {
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

	return new ZapSubscriber(owner, Object.assign(contracts, { handler }));
}

async function main(args) {
	const _provider = new HDWalletProvider(mnemonic, 'wss://kovan.infura.io/ws/xeb916AFjrcttuQlezyq');
	const web3 = new Web3(_provider);
	const accounts = await web3.eth.getAccounts();
	const subscriber = await loadSubscriber(web3, accounts[0]);
	const provider = await loadProvider(web3, '0xB748B0dea992b00424eC20f0D4C195F96c094154');

	if ( (await provider.getTitle()).length == 0 ) {
		console.log('Provider not initialized.');
		return;
	}
	else {
		console.log('Title of provider is', await provider.getTitle());
	}

	const endpoint = "data";
	const endpoints = await provider.getEndpoints();

	if ( endpoints.indexOf(endpoint) < 0 ) {
		console.log('Provider does not have the', endpoint, 'endpoint');
		return;
	}
	else {
		console.log('Found the', endpoint, 'endpoint');
	}

	const boundDots = await provider.getBoundDots({ endpoint, subscriber: accounts[0] });

	if ( boundDots < 10 ) {
		console.log('Bonding 10 DOTs');
		const zapBal = await subscriber.getZapBalance();

		if ( zapBal == 0 ) {
			console.log('No Zap!');
			return;
		}

		await subscriber.bond({
			provider: provider.providerOwner,
			endpoint,
			dots: 10,
			gas: '1000000'
		});

		console.log('Done');
	}

	provider.listenSubscribes({
		subscriber: accounts[0]
	}, (err, event) => {
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

		peer.connect(false, provider.providerOwner);
	});

	console.log('Making the subscription');
	await subscriber.subscribe({
		provider: provider.providerOwner,
		endpoint,
		endpointParams: [],
		dots: 10
	});

	console.log('Subscription made.');
}

main(process.argv);