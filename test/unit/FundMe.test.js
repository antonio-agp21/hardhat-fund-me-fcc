const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

//const { describe } = require("node:test");  /** con esto de repente no funciona */

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          let MockV3Aggregator;
          const sendValue = ethers.utils.parseEther("1");
          beforeEach(async function () {
              //deploy fundme using hardhat deploy
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]); //************************************************************************ */
              fundMe = await ethers.getContract(
                  "FundMe",
                  deployer
              ); /** no lo deployea antes??? O ya lo hace esa función?? */
          });
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  MockV3Aggregator = await ethers.getContract(
                      "MockV3Aggregator"
                  );
                  assert.equal(response, MockV3Aggregator.address);
              }); /** IMP */
          });

          describe("fund", async () => {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith("Not enough");
              });
              it("updates the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue });

                  const response = await fundMe.getAddressToAmount(deployer);
                  console.log("bien");
                  assert.equal(sendValue.toString(), response.toString());
              });
              it("updates the getFunder array", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getFunder(0);
                  await expect(fundMe.getFunder(1)).to.be.reverted;
                  assert.equal(response, deployer);
              });
          });

          describe("withdraw", async () => {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });
              it("withdraw ETH from a single funder", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  //Act
                  const transactionResponse = await fundMe.withdraw();

                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  //Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
              });

              it("allows us to withdraw ETH from every funder", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners(); /** */
                  for (let i = 1; i < 10; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ); /**   conecta con todas las cuentas para llamar a la función desde ahí */
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  //Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  //Arrange

                  assert.equal(endingFundMeBalance, 0);

                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  ); /** DA ERROR */

                  //Array correctly reset
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 1; i < 10; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmount(accounts[i].address),
                          0
                      );
                  }
              });

              it("only allows the owner to withdraw the funds", async function () {
                  const accounts =
                      await ethers.getSigners(); /***array de accounts, no de addresses */
                  await fundMe.fund({ value: sendValue });
                  for (let i = 1; i < 10; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                      await expect(
                          fundMeConnectedContract.withdraw()
                      ).to.be.revertedWith("FundMe__NotOwner");
                  }
              });
          });

          describe("cheaperWithdraw", async () => {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });
              it("cheaperWithdraw ETH from a single funder", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw();

                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  //Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
              });

              it("allows us to cheaperWithdraw ETH from every funder", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners(); /** */
                  for (let i = 1; i < 10; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ); /**   conecta con todas las cuentas para llamar a la función desde ahí */
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  //Arrange

                  assert.equal(endingFundMeBalance, 0);

                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  ); /** DA ERROR */

                  //Array correctly reset
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 1; i < 10; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmount(accounts[i].address),
                          0
                      );
                  }
              });

              it("only allows the owner to cheaperWithdraw the funds", async function () {
                  const accounts =
                      await ethers.getSigners(); /***array de accounts, no de addresses */
                  await fundMe.fund({ value: sendValue });
                  for (let i = 1; i < 10; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                      await expect(
                          fundMeConnectedContract.cheaperWithdraw()
                      ).to.be.revertedWith("FundMe__NotOwner");
                  }
              });
          });

          describe("getOwner", async () => {
              it("should get the owner of the contract correctly", async function () {
                  const owner = await fundMe.getOwner();
                  assert.equal(deployer, owner);
              });
          });
      });
