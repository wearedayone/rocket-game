const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules')

module.exports = buildModule('FireModule', m => {
  const fireContract = m.contract('FIREToken', [10000000000000])

  return { fireContract }
})
