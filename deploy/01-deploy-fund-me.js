//import
/*
function deployFunc(hre) {
    console.log("Hi");
}

module.exports.default = deployFunc;

*/

/*module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre;
};*/

const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config.js");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        //*************aquí enlaza con el mock
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]; //*********************************** */
    }

    //localhost o hardhat network: use a mock
    const args = [ethUsdPriceFeedAddress];

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, //put pricefeedAddress
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }
    log("--------------------------------------------");
};

module.exports.tags = ["all", "fund me"];
