/**en una testnet */
const { getNamedAccounts, ethers, network, deployments } = require("hardhat");

//const { describe } = require("node:test"); /** lo mismo */
const { developmentChains } = require("../../helper-hardhat-config.js");
const { assert, expect } = require("chai");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          const sendValue = ethers.utils.parseEther("0.04");

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract("FundMe", deployer);
              await (await fundMe.withdraw()).wait(1);
          });

          it("allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              console.log(endingBalance.toString());
              assert.equal(endingBalance.toString(), "0");
          });
      });
