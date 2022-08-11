// SPDX-License-Identifier: MIT
/**pragma */
pragma solidity ^0.8.8;
/**imports */
import "./PriceConverter.sol";

/**error codes */
error FundMe__NotOwner();

/**interfaces, libraries, contracts */

/** 
@title A contract for crowdfunding
@author Me
@notice This contract id to demo a sample funding contract
@dev This implements price feeds as our library
*/
contract FundMe {
    //Type declarations
    using PriceConverter for uint256;

    //State variables => Storage
    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address[] private s_funders;
    mapping(address => uint256) private s_AddresstoAmount;

    AggregatorV3Interface private s_priceFeed;
    ///

    event Funded(address indexed from, uint256 amount);

    modifier onlyOwner() {
        //require(msg.sender == i_owner, "Sender is not owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
    @notice This function funds the contract 
    @dev ceevmekvorev
    */

    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Not enough"
        );
        s_funders.push(msg.sender);
        s_AddresstoAmount[msg.sender] = msg.value;
    }

    function withdraw()
        public
        /*payable*/
        onlyOwner
    {
        for (uint256 i = 0; i < s_funders.length; i++) {
            s_AddresstoAmount[s_funders[i]] = 0;
        }
        s_funders = new address[](0);
        //transfer
        //payable(msg.sender).transfer(address(this).balance);
        //send
        //bool sendSuccess = payable(msg.sender).send(address(this).balance);
        //require(sendSuccess, "Send Failed");
        //call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;

        for (uint256 i = 0; i < funders.length; i++) {
            address funder = funders[i];
            s_AddresstoAmount[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmount(address funder) public view returns (uint256) {
        return s_AddresstoAmount[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
