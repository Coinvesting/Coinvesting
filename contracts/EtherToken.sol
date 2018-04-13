pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";


contract EtherToken is MintableToken, BurnableToken {

    function EtherToken() public {
        owner = address(0);
    }

    function() public payable {
        deposit();
    }

    function deposit() public payable {
        owner = msg.sender;
        mint(msg.sender, msg.value);
        owner = address(0);
    }

    function withdraw(uint amount) public {
        burn(amount);
        msg.sender.transfer(amount);
    }

}
