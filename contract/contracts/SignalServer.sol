pragma solidity ^0.4.24;
contract SignalServer {
	mapping (address => mapping(address => bool)) canSend;

	event Signal(address indexed from, address indexed to, string signal);

	function setPermissions(address dest, bool value) external {
		canSend[dest][msg.sender] = value;
	}

	function signal(address to, string _msg) external {
		require(canSend[msg.sender][to]);
		emit Signal(msg.sender, to, _msg);
	}
}
