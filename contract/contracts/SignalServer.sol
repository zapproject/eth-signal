pragma solidity ^0.4.24;
contract SignalServer {
	event Signal(address indexed from, address indexed to, string signal);

	function signal(address from, address to, string _msg) external {
		emit Signal(from, to, _msg);
	}
}
