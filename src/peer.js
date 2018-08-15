const Peer = require('simple-peer');
const wrtc = require('wrtc');
const EventEmitter = require('events');
const SignalServer = require('./signal.js');

class EthPeer extends EventEmitter {
	constructor(mnemonic) {
		super();
		this.signal = new SignalServer(mnemonic);
	}

	async connect(initiator, address) {
		await this.signal.load();

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
			this.peer.signal(data);
		});
	}

	async send(data) {
		await this.peer.send(data);
	}
}

module.exports = EthPeer;