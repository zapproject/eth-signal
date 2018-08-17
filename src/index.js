const EthPeer = require('./peer');

function printUsage(args) {
	console.log('Usage: ', args[0] + ' ' + args[1] + ' [prim/sec] [address]');
}

function validateArgs(args) {
	if ( args.length != 4 ) {
		printUsage(args);
		return { pos: null, dest: null, mnemonic: null };
	}

	const pos = args[2];

	if ( args[2] != 'prim' && args[2] != 'sec' ) {
		printUsage(args);
		return { pos: null, dest: null, mnemonic: null };
	}

	const dest = args[3];

	if ( !dest.startsWith('0x') ) {
		printUsage(args);
		return { pos: null, dest: null, mnemonic: null };
	}

	const test_mnemonics = {
		'prim': 'usual dream c1ay mimic dad suspect mercy amused leader save trip chase',
		'sec': undefined
	};

	return { initiator: pos == 'prim', dest, mnemonic: test_mnemonics[pos] };
}

async function main(args) {
	const { initiator, dest, mnemonic } = validateArgs(args);

	if ( !dest ) return;

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
	peer.on('data', x => console.log('Data', x));
	peer.on('error', e => console.error('Error', e));

	peer.connect(initiator, dest);
}

main(process.argv);