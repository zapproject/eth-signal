const Peer = require('simple-peer');
const wrtc = require('wrtc');
const SignalServer = require('./signal.js');

function printUsage(args) {
	console.log('Usage: ', args[0] + ' ' + args[1] + ' [prim/sec] [address]');
}

function validateArgs(args) {
	if ( args.length != 4 ) {
		printUsage(args);
		return { pos: null, dest: null };
	}

	const pos = args[2];

	if ( args[2] != 'prim' && args[2] != 'sec' ) {
		printUsage(args);
		return { pos: null, dest: null };
	}

	const dest = args[3];

	if ( !dest.startsWith('0x') ) {
		printUsage(args);
		return { pos: null, dest: null };
	}

	return { pos, dest };
}

// Two testing mnemonics
// Both have rinkeby ETH
const test_mnemonics = {
	'prim': 'usual dream c1ay mimic dad suspect mercy amused leader save trip chase',
	'sec': undefined
}

async function main(args) {
	const { pos, dest } = validateArgs(args);

	if ( !pos || !dest ) return;

	const signal = new SignalServer(test_mnemonics[pos]);
	await signal.load();

	// Start p2p
	const peer = new Peer({ initiator: args[2] == 'prim', wrtc });

	peer.on('connect', () => console.log('Peer Connected'));
	peer.on('data', x => console.log('Data', x));
	peer.on('error', e => console.error('Error', e));

	peer.on('signal', data => {
		console.log('Sending signal data');

		signal.send(data, dest).then(() => {
			console.log('Successfully sent data');
		}).catch(err => {
			console.error('Failed to send signal data');
		});
	});

	// Signal
	signal.on('data', data => peer.signal(data));

	setTimeout(() => {
		console.log('Starting to send data');
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
	}, 90 * 1000);
}

main(process.argv);