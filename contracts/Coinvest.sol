pragma solidity ^0.4.11;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol';
import './EtherToken.sol';
import './Multiownable.sol';

//
// State machine:
//
// [Participant]
//      ||
//      \/
//  +---------+  [Creator]  +--------+  [ALL]  +-----------+  [Creator]  +----------+  [ANY]  +--------------+
//  | FUNDING | ==========> | FUNDED | ======> | INVESTING | ==========> | INVESTED | ======> | DISTRIBUTING |
//  +---------+             +--------+         +-----------+             +----------+         +--------------+
//      ||                      ||                  ||                        ||                     ||
//      \/                      \/                  \/                        \/                     \/
//   [Escape]                [Escape]            [Escape]                  [Escape]              [Enriched] (more than [Escape])
//
// Flow:
// 1. Investors can participate during <FUNDING> phase.
// 2. Investors can escape during any phase
// 3. Contract creator can end <FUNDING> and <INVESTING> phases
// 4. All participants should call `invest` method
// 5. Any participant can call `ditribute` method
//


contract Coinvest is Ownable, EtherToken, Multiownable {

    uint256 public minPersonalInvestmentAmount;
    uint256 public minCollectiveInvestmentAmount;

    bool public funding;
    bool public funded;
    bool public investing;
    bool public invested;
    bool public distributing;

    event Funding();
    event Funded(uint256 _balance);
    event Investing(address _contract, uint256 _amount);
    event Invested();
    event Distributing(address _token, uint256 _amount);

    function Coinvest(uint256 _minPersonalInvestmentAmount, uint256 _minCollectiveInvestmentAmount) public {
        minPersonalInvestmentAmount = _minPersonalInvestmentAmount;
        minCollectiveInvestmentAmount = _minCollectiveInvestmentAmount;
        funding = true;
        Funding();
    }

    // Lifecycle

    function finishFunding() public onlyOwner {
        require(address(this).balance >= minCollectiveInvestmentAmount);
        funding = false;
        funded = true;
        Funded(address(this).balance);
    }

    function finishInvesting() public onlyOwner {
        investing = false;
        invested = true;
        Invested();
    }

    //

    function() public payable {
        if (funding) {
            deposit();
        }
    }

    function deposit() public payable {
        require(funding);
        super.deposit();
        
        require(balanceOf(msg.sender) >= minPersonalInvestmentAmount);
        if (!isOwner(msg.sender)) {
            addOwner(msg.sender);
        }
    }

    function withdraw(uint _amount) public {
        // Take all or leave at least minInvestmentAmount
        require(balanceOf(msg.sender) == _amount || balanceOf(msg.sender) - _amount >= minPersonalInvestmentAmount);
        // Use distribute method in <DISTRIBUTION> state
        require(!distributing);
        super.withdraw(_amount);
        if (isOwner(msg.sender) && balanceOf(msg.sender) == 0) {
            removeOwner(msg.sender);
        }
    }

    function invest(address _contract, bytes _data) public {
        invest(_contract, address(this).balance, _data);
    }

    function invest(address _contract, uint256 _amount, bytes _data) public onlyManyOwners {
        require(funded);
        if (!investing) {
            investing = true;
            Investing(_contract, _amount);
        }
        require(_contract.call.value(_amount)(_data));
    }

    function distribute(address _token) public onlyAnyOwner {
        distribute(_token, 0);
    }

    function distribute(address _token, uint _amount) public onlyAnyOwner {
        require(invested);
        if (!distributing) {
            distributing = true;
            Distributing(_token, _amount);
        }

        if (_token == address(0)) {
            uint256 etherSupply = (_amount != 0) ? _amount : address(this).balance;
            for (uint i = 0; i < owners.length; i++) {
                owners[i].transfer(etherSupply * balanceOf(owners[i]) / totalSupply());
            }
        } else {
            uint256 tokenSupply = (_amount != 0) ? _amount : ERC20Basic(_token).totalSupply();
            for (uint j = 0; j < owners.length; j++) {
                ERC20Basic(_token).transfer(owners[j], tokenSupply * balanceOf(owners[j]) / totalSupply());
            }
        }
    }

    //

    function addOwner(address _newOwner) internal {
        address[] memory newOwners = new address[](owners.length + 1);
        for (uint i = 0; i < owners.length; i++) {
            newOwners[i] = owners[i];
        }
        newOwners[newOwners.length - 1] = _newOwner;
        transferOwnership(newOwners);
    }

    function removeOwner(address _oldOwner) internal {
        address[] memory newOwners = new address[](owners.length - 1);
        uint diff = 0;
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] != _oldOwner) {
                newOwners[i - diff] = owners[i];
            } else {
                diff = 1;
            }
        }
        transferOwnership(newOwners);
    }

}