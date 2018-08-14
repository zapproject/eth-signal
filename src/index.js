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

async function main(args) {
	const { pos, dest } = validateArgs(args);

	if ( !pos ) return;

	const signal = new SignalServer("usual dream c1ay mimic dad suspect mercy amused leader save trip chase");
	await signal.load();
	console.log('Using signal server at', signal.address);

	// Start p2p
	const peer = new Peer({ initiator: args[2] == 'prim', wrtc });

	peer.on('connect', () => console.log('Peer Connected'));
	peer.on('data', x => console.log('Data', x));
	peer.on('error', e => console.error('Error', e));

	peer.on('signal', data => {
		console.log('Sending signal data', data);
		signal.send(data);
	});

	// Signal
	signal.on('data', data => peer.signal(data));

	// Send data occassionally
	setInterval(() => {
		try {
			console.log('Sending data');
			peer.send('nutsack');
		}
		catch (err) {
			console.log('Failed to send data');
		}
	}, 5 * 1000);
}

main(process.argv);