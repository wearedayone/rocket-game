import React from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

function ConnectWallet() {
  const account = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const shortenAddress = address => {
    if (address) {
      return `${address.substring(0, 6)}...${address.substring(
        address.length - 4,
        address.length
      )}`
    }

    return ''
  }

  return (
    <div className="connect-btn">
      {account.address ? (
        <button className="user-address" onClick={disconnect}>
          {shortenAddress(account.address)}
        </button>
      ) : (
        <button onClick={() => connect({ connector: injected() })}>
          ConnectWallet
        </button>
      )}
    </div>
  )
}

export default ConnectWallet
