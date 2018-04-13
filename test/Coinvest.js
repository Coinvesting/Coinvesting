// @flow
'use strict'

const BigNumber = web3.BigNumber;
const expect = require('chai').expect;
const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should();

import ether from './helpers/ether';
import {advanceBlock} from './helpers/advanceToBlock';
import {increaseTimeTo, duration} from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';
import MerkleTree from './helpers/merkleTree.js';

//const MintableToken = artifacts.require('zeppelin-solidity/contracts/token/ERC20/MintableToken');
//const MerkleIndividuallyCappedCrowdsale = artifacts.require('MerkleIndividuallyCappedCrowdsaleImpl');

function padLeft(s, n, str){
    return Array(n - String(s).length + 1).join(str || '0') + s;
}

contract('MerkleIndividuallyCappedCrowdsale', function ([_, wallet1, wallet2, wallet3, wallet4, wallet5, wallet6]) {
/*
    const caps = {
        [wallet1]: ether(10),
        [wallet2]: ether(20),
        [wallet3]: ether(30),
        [wallet4]: ether(40),
        [wallet5]: ether(50),
        [wallet6]: ether(60),
    };
    const elements = Object.keys(caps).map(key => new Buffer(key.substr(2) + padLeft(caps[key].toString(16), 64, 0), 'hex'));
    let merkleTree = new MerkleTree(elements);

    // Output for README.md
    const proof = merkleTree.getHexProof(elements[1]);
    console.log(caps);
    console.log('\nlements(hex) =\n', elements.map(e => e.toString('hex')));
    console.log('\nlements(sha3) =\n', elements.map(e => web3.sha3(e.toString('hex'), { encoding: 'hex' })));
    console.log('\nmerkleTree =\n', merkleTree);
    console.log('\nproof =', proof);

    let crowdsale;

    beforeEach(async function() {
        const token = await MintableToken.new();
        crowdsale = await MerkleIndividuallyCappedCrowdsale.new(1, _, token.address);
        await crowdsale.setCapsMerkleRoot(merkleTree.getHexRoot());
        await token.mint(crowdsale.address, 1000000 * 10**18);
    })

    it('should reject calls on old method', async function() {
        let reverted = false;
        try {
            await crowdsale.contract.buyTokens["address"](wallet1, {value: 40, from: _});
        } catch(e) {
            reverted = (e.message == 'VM Exception while processing transaction: revert');
        }
        reverted.should.be.true;
    })

    it('should fail on wrong proofs', async function() {
        await crowdsale.buyTokens(wallet1, ether(10), merkleTree.getHexProof(elements[1]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet2, ether(20), merkleTree.getHexProof(elements[2]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet3, ether(30), merkleTree.getHexProof(elements[3]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet4, ether(40), merkleTree.getHexProof(elements[4]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet5, ether(50), merkleTree.getHexProof(elements[0]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
    })

    it('should fail on wrong caps', async function() {
        await crowdsale.buyTokens(wallet1, ether(20), merkleTree.getHexProof(elements[0]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet2, ether(10), merkleTree.getHexProof(elements[1]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet3, ether(50), merkleTree.getHexProof(elements[2]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet4, ether(30), merkleTree.getHexProof(elements[3]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet5, ether(40), merkleTree.getHexProof(elements[4]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
    })

    it('should fail on wrong wallets', async function() {
        await crowdsale.buyTokens(wallet2, ether(10), merkleTree.getHexProof(elements[0]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet1, ether(20), merkleTree.getHexProof(elements[1]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet5, ether(30), merkleTree.getHexProof(elements[2]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet3, ether(40), merkleTree.getHexProof(elements[3]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet4, ether(50), merkleTree.getHexProof(elements[4]), {value: ether(4)}).should.be.rejectedWith(EVMRevert);
    })

    it('should work fine', async function() {
        // Wallet1
        await crowdsale.buyTokens(wallet1, ether(10), merkleTree.getHexProof(elements[0]), {value: ether(11)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet1, ether(10), merkleTree.getHexProof(elements[0]), {value: ether(4)}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet1, ether(10), merkleTree.getHexProof(elements[0]), {value: ether(7)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet1, ether(10), merkleTree.getHexProof(elements[0]), {value: ether(6)}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet1, ether(10), merkleTree.getHexProof(elements[0]), {value: ether(1)}).should.be.rejectedWith(EVMRevert);

        // Wallet2
        await crowdsale.buyTokens(wallet2, ether(20), merkleTree.getHexProof(elements[1]), {value: ether(21)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet2, ether(20), merkleTree.getHexProof(elements[1]), {value: ether(4)}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet2, ether(20), merkleTree.getHexProof(elements[1]), {value: ether(17)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet2, ether(20), merkleTree.getHexProof(elements[1]), {value: ether(16)}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet2, ether(20), merkleTree.getHexProof(elements[1]), {value: ether(1)}).should.be.rejectedWith(EVMRevert);

        // Wallet3
        await crowdsale.buyTokens(wallet3, ether(30), merkleTree.getHexProof(elements[2]), {value: ether(31)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet3, ether(30), merkleTree.getHexProof(elements[2]), {value: ether(4)}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet3, ether(30), merkleTree.getHexProof(elements[2]), {value: ether(27)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet3, ether(30), merkleTree.getHexProof(elements[2]), {value: ether(26)}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet3, ether(30), merkleTree.getHexProof(elements[2]), {value: ether(1)}).should.be.rejectedWith(EVMRevert);

        // Wallet4
        await crowdsale.buyTokens(wallet4, ether(40), merkleTree.getHexProof(elements[3]), {value: ether(41)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet4, ether(40), merkleTree.getHexProof(elements[3]), {value: ether(4)}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet4, ether(40), merkleTree.getHexProof(elements[3]), {value: ether(37)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet4, ether(40), merkleTree.getHexProof(elements[3]), {value: ether(36)}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet4, ether(40), merkleTree.getHexProof(elements[3]), {value: ether(1)}).should.be.rejectedWith(EVMRevert);

        // Wallet5
        await crowdsale.buyTokens(wallet5, ether(50), merkleTree.getHexProof(elements[4]), {value: ether(51)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet5, ether(50), merkleTree.getHexProof(elements[4]), {value: ether(4)}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet5, ether(50), merkleTree.getHexProof(elements[4]), {value: ether(47)}).should.be.rejectedWith(EVMRevert);
        await crowdsale.buyTokens(wallet5, ether(50), merkleTree.getHexProof(elements[4]), {value: ether(46)}).should.be.fulfilled;
        await crowdsale.buyTokens(wallet5, ether(50), merkleTree.getHexProof(elements[4]), {value: ether(1)}).should.be.rejectedWith(EVMRevert);
    })

    /*
    //
    // const root = tree[tree.length - 1][0];
    //
    function buildMerkleTree(elements) {
        elements.sort();

        let tree = [];
        tree[0] = elements;
        for (let r = 1; 2**(r-1) < elements.length; r++) {
            tree[r] = [];
            for (let i = 0; i < tree[r-1].length; i+=2**r) {
                const j = i + 2**(r-1);
                if (j >= tree[r-1].length) {
                    tree[r][i] = tree[r-1][i];
                } else
                if (tree[r-1][i] < tree[r-1][j]) {
                    tree[r][i] = web3.sha3(tree[r-1][i].substr(2) + tree[r-1][j].substr(2), { encoding: 'hex' });
                } else {
                    tree[r][i] = web3.sha3(tree[r-1][j].substr(2) + tree[r-1][i].substr(2), { encoding: 'hex' });
                }
            }
        }

        return tree;
    }
*/

})
