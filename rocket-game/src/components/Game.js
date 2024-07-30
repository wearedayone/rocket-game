// src/components/Game.js
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  startFiring,
  stopFiring,
  updateRocketPosition,
  resetHoldDuration,
  loadTokenBalance
} from '../store'
import ConnectWallet from './ConnectWallet'
import { useAccount, useReadContracts, useWriteContract } from 'wagmi'
import { ERC20_ABI } from '../abi/ERC20'
import { formatUnits, parseUnits } from 'viem'

const Game = () => {
  const dispatch = useDispatch()
  const { isFiring, rocketPosition, holdDuration, tokens } = useSelector(
    state => state.game
  )
  const [currentHoldDuration, setCurrentHoldDuration] = useState(0)
  const intervalRef = useRef(null)
  const rocketIntervalRef = useRef(null)
  const holdStartTimeRef = useRef(null)
  const launchTimeRef = useRef(null)
  const rocketRef = useRef(null)

  const [targets, setTargets] = useState([])

  // load token balance
  const account = useAccount()

  const { data } = useReadContracts({
    contracts: [
      {
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        address: '0x43F2db56F79945AE8A5B866798E2a70258Caff48',
        args: [account.address]
      },
      {
        abi: ERC20_ABI,
        functionName: 'symbol',
        address: '0x43F2db56F79945AE8A5B866798E2a70258Caff48'
      }
    ]
  })

  const { writeContractAsync, status } = useWriteContract()

  useEffect(() => {
    const balance = data ? data[0].result.toString() : '0'
    dispatch(loadTokenBalance(balance))
  }, [data, dispatch])

  const generateTargets = () => {
    const numOfTargets = 50
    const _targets = []
    for (let i = 0; i < numOfTargets; i++) {
      const randomX = Math.random() * (window.innerWidth / 2)
      const randomY = Math.random() * window.innerHeight

      _targets.push({ id: i + 1, x: randomX, y: randomY, visible: true })
    }

    setTargets(_targets)
  }

  useEffect(() => {
    generateTargets()
  }, [])

  useEffect(() => {
    if (isFiring) {
      holdStartTimeRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        const elapsedTime = (Date.now() - holdStartTimeRef.current) / 1000 // in seconds
        setCurrentHoldDuration(elapsedTime)
      }, 100)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isFiring])

  const calculateRocketPosition = (t, v0, angle) => {
    const g = 9.81 // gravity
    const x = v0 * t * Math.cos(angle)
    const y = v0 * t * Math.sin(angle) - 0.5 * g * t * t
    return { x, y }
  }

  const checkTargetHits = (rocketElement, target) => {
    const rocketRect = rocketElement.getBoundingClientRect()
    const rocketCenter = {
      x: rocketRect.left + rocketRect.width / 2,
      y: rocketRect.top + rocketRect.height / 2
    }

    const targetX = window.innerWidth - target.x
    const targetY = window.innerHeight - target.y

    const dx = rocketCenter.x - targetX
    const dy = rocketCenter.y - targetY

    const distance = Math.sqrt(dx ** 2 + dy ** 2)
    return distance <= 50
  }

  const burnToken = async () => {
    await writeContractAsync({
      abi: ERC20_ABI,
      address: '0x43F2db56F79945AE8A5B866798E2a70258Caff48',
      functionName: 'transfer',
      args: ['0x000000000000000000000000000000000000dEaD', parseUnits('1', 18)]
    })
  }

  useEffect(() => {
    if (!isFiring && holdDuration > 0) {
      const launchRocket = () => {
        const g = 9.81 // gravity
        const v0 = holdDuration * 30 // initial velocity based on hold duration
        const angle = Math.PI / 4 // 45 degrees
        launchTimeRef.current = Date.now()
        rocketIntervalRef.current = setInterval(() => {
          const t = (Date.now() - launchTimeRef.current) / 500 // in seconds
          const { x, y } = calculateRocketPosition(t, v0, angle)
          if (y < 0) {
            clearInterval(rocketIntervalRef.current)
            dispatch(updateRocketPosition({ x: 0, y: 0 })) // Reset position after it falls
            dispatch(resetHoldDuration())
          } else {
            dispatch(updateRocketPosition({ x, y: -y }))

            const rocketElement = rocketRef.current

            setTargets(prevTargets => {
              const newTargets = prevTargets.map(t =>
                t.visible && checkTargetHits(rocketElement, t)
                  ? { ...t, visible: false }
                  : t
              )

              return newTargets
            })
          }
        }, 100)
      }

      launchRocket()
    }

    return () => clearInterval(rocketIntervalRef.current)
  }, [isFiring, holdDuration, dispatch])

  const handleMouseDown = async () => {
    try {
      if (tokens > 0) {
        await burnToken()

        if (status === 'success') {
          dispatch(startFiring())
        }
      }
    } catch (error) {}
  }

  const handleMouseUp = () => {
    if (status === 'success') {
      const finalHoldDuration = (Date.now() - holdStartTimeRef.current) / 1000 // in seconds
      setCurrentHoldDuration(finalHoldDuration)
      dispatch(stopFiring())
    }
  }

  return (
    <div className="game">
      <div className="tokens">
        Tokens: {Number(formatUnits(tokens, 18)).toFixed(4)}{' '}
        {data ? data[1].result : ''}
      </div>
      <ConnectWallet />
      <div className="rocket-launcher">
        <div
          className="rocket"
          style={{
            transform: `translate(${rocketPosition.x}px, ${rocketPosition.y}px)`
          }}
          ref={rocketRef}
        >
          🚀
        </div>
      </div>
      {targets.map(target => {
        return (
          <React.Fragment key={target.id}>
            {target.visible && (
              <div
                className={`target target${target.id}`}
                style={{
                  right: target.x,
                  bottom: target.y
                }}
              ></div>
            )}
          </React.Fragment>
        )
      })}
      <div className="land"></div>
      <div className="controls">
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          disabled={tokens <= 0}
        >
          Fire Rocket
        </button>
        <div className="hold-bar">
          <div
            className="hold-duration"
            style={{ width: `${currentHoldDuration * 10}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default Game
