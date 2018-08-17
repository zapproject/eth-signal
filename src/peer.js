const assert = require('assert');
const Peer = require('simple-peer');
const EventEmitter = require('events');
const SignalServer = require('./signal.js');

// Only use wrtc when theres no window.
const wrtc = typeof window == 'undefined' ? require('wrtc') : undefined;

class EthPeer extends EventEmitter {
	constructor(mnemonic) {
		super();
		this.signal = new SignalServer(mnemonic);
	}

	async connect(initiator, address) {
		await this.signal.load();

		if ( !(await this.signal.getPermissions(address)) ) {
			console.log('Giving', address, 'permission to signal...');
			await this.signal.setPermissions(address, true);
			assert(await this.signal.getPermissions(address));
			console.log('Permission granted');
		}
		else {
			console.log(address, 'already has permission to signal');
		}

		this.peer = new Peer({ initiator, wrtc });

		this.peer.on('connect', () => {
			this.emit('connect');
		});

		this.peer.on('data', data => {
			this.emit('data', data);
		});

		this.peer.on('error', err => {
			this.emit('error', err);
		});

		this.peer.on('signal', data => {
			this.signal.send(data, address).then(() => {
				this.emit('signal');
			}).catch(err => {
				this.emit('error', err);
			});
		});

		this.signal.on('data', data => {
			this.emit('signaled');
			this.peer.signal(data);
		});
	}

	async send(data) {
		if ( !this.peer ) {
			throw new Error("Attempted to send while the peer wasn't conneted");
		}

		await this.peer.send(data);
	}
}

module.exports = EthPeer;