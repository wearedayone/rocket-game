require('@nomicfoundation/hardhat-toolbox')

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.19',
  networks: {
    sepolia: {
      url: 'https://sepolia.infura.io/v3/e5b3c8274fe749d4829c579042ff4c9f',
      accounts: [
        '52e6acd80584d788154242b2166c4fd505fdfaa2588f8b6012e53e7ab9a0ccf7'
      ]
    }
  },
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
