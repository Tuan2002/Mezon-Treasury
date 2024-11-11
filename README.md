# MezonTreasury 
`MezonTreasury` is a Solidity smart contract designed as a secure treasury system for ERC20 tokens. It enables authorized users to deposit and withdraw tokens with EIP-712 signature authorization, allowing flexible and 
permissioned asset management.

`Mezon` is open-source project that maintain by [NCC Software Vietnam] (https://ncc.asia/)
## Features 
 
- **Deposit and Withdraw ERC20 Tokens** : Users can deposit tokens, and authorized users can withdraw tokens to specified addresses.
 
- **EIP-712 Signature Verification** : Allows secure, off-chain signing of withdrawal requests.
 
- **Role-Based Access Control** : Managed by OpenZeppelin's `AccessControl`, with roles for Admins and authorized Withdrawers.

## Prerequisites 

To work with this project, you need:
 
- **Node.js**  (>= 18.x)
 
- **Hardhat** : A development environment for Ethereum (installed in the project)
 
- **OpenZeppelin Contracts** : For access control, cryptographic utilities, and token standards

## Installation 
 
1. **Clone the Repository** :

```bash
git clone https://github.com/tuan2002/MezonTreasury.git
cd mezon-treasury
```
 
2. **Install Dependencies** :
Install the required dependencies using npm or yarn:

```bash
npm install
```
 
3. **Compile the Contracts** :
Compile the smart contracts using Hardhat:

```bash
npx hardhat compile
```
 
4. **Run Tests** :
To ensure everything is working correctly, run the test suite:

```bash
npx hardhat test
```

## Usage 

The contract defines two primary roles:
 
- **Admin Role** : Granted by default to the contract deployer. Admins can assign and revoke the Withdrawer role.
 
- **Withdrawer Role** : Only addresses with this role can withdraw tokens from the treasury.

### Key Functions 
 
- **Deposit Tokens** :
Users can deposit ERC20 tokens into the treasury by calling the `deposit` function with the token amount:

```solidity
function deposit(uint256 amount) external;
```
 
- **Withdraw Tokens with Signature Verification** :
Withdraw tokens from the treasury by providing an EIP-712 signed message. Only addresses with the `WITHDRAWER_ROLE` can withdraw tokens:

```solidity
function withdraw(uint256 amount, address to, uint8 v, bytes32 r, bytes32 s) public;
```
 
- **Grant and Revoke Withdrawer Role** :
Admins can grant or revoke the `WITHDRAWER_ROLE` to manage authorized users.

```solidity
function grantWithdrawerRole(address account) external onlyRole(ADMIN_ROLE);
function revokeWithdrawerRole(address account) external onlyRole(ADMIN_ROLE);
```

## Contributing 
 
1. **Fork the Repository** : Fork the project and create a new branch for your feature or bug fix.
 
2. **Install Development Dependencies** : Run `npm install` to set up the environment.
 
3. **Develop and Test** : Implement your changes and make sure all tests pass.
 
4. **Submit a Pull Request** : Submit a pull request with a detailed description of your changes.

## Security Considerations 
 
- This contract relies on EIP-712 signature verification to authenticate withdrawal requests. Ensure that only trusted addresses are granted the `WITHDRAWER_ROLE`.

- Be careful to properly handle token approvals when testing and deploying to mainnet.

- Thoroughly test the contract on test networks before deploying to a live environment.

## License 
This project is licensed under the MIT License. See the [LICENSE]()  file for more details.

---