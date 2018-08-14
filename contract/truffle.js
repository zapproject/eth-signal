const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
	networks: {
		localhost: {
			host: "localhost",
			port: 8545,
			network_id: "*" // Match any network id
		},
		rinkeby: {
			provider: function() { 
				return new HDWalletProvider("usual dream clay mimic dad suspect mercy amused leader save trip chase", 'https://rinkeby.infura.io/tOYbxwjtu0vJT4pG7TLH') 
			},
			network_id: '4',
			gas: 4500000,
			gasPrice: 10000000000,
		},
	}
};
