import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { createPublicClient, http, getContract } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { createBundlerClient, toSimple7702SmartAccount } from "viem/account-abstraction"
import { erc20Abi, encodePacked, hexToBigInt } from "viem"
import { signPermit } from "../utils/permit"

export function PaymasterTransfer() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')

  // Only render UI after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted
  if (!mounted) return null

  const handleTransfer = async () => {
    if (!isConnected || !address) return
    setLoading(true)
    try {
      const client = createPublicClient({ 
        chain: arbitrumSepolia, 
        transport: http() 
      })

      const account = await toSimple7702SmartAccount({ 
        client, 
        owner: address 
      })

      const paymaster = {
        async getPaymasterData() {
          const permitAmount = 10000000n
          const permitSignature = await signPermit({
            tokenAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS!,
            account,
            client,
            spenderAddress: process.env.NEXT_PUBLIC_PAYMASTER_V08_ADDRESS!,
            permitAmount,
          })

          return {
            paymaster: process.env.NEXT_PUBLIC_PAYMASTER_V08_ADDRESS,
            paymasterData: encodePacked(
              ["uint8", "address", "uint256", "bytes"],
              [0, process.env.NEXT_PUBLIC_USDC_ADDRESS!, permitAmount, permitSignature]
            ),
            paymasterVerificationGasLimit: 200000n,
            paymasterPostOpGasLimit: 15000n,
            isFinal: true,
          }
        },
      }

      const bundlerClient = createBundlerClient({
        account,
        client,
        paymaster,
        userOperation: {
          estimateFeesPerGas: async () => {
            const { standard: fees } = await bundlerClient.request({
              method: "pimlico_getUserOperationGasPrice",
            })
            return { 
              maxFeePerGas: hexToBigInt(fees.maxFeePerGas),
              maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas)
            }
          },
        },
        transport: http(`https://public.pimlico.io/v2/${client.chain.id}/rpc`),
      })

      const hash = await bundlerClient.sendUserOperation({
        account,
        calls: [
          {
            to: process.env.NEXT_PUBLIC_USDC_ADDRESS!,
            abi: erc20Abi,
            functionName: "transfer",
            args: [recipient, BigInt(amount)],
          },
        ],
      })

      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash })
      setTxHash(receipt.receipt.transactionHash)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {isConnected ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Connected: {address}</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="number"
              placeholder="Amount (in USDC)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={handleTransfer}
              disabled={loading}
              className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Processing...' : 'Transfer USDC'}
            </button>

            {txHash && (
              <div className="text-sm text-green-600">
                Transaction successful! Hash: {txHash}
              </div>
            )}
          </div>
          
          <button
            onClick={() => disconnect()}
            className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => connect({ connector })}
              className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Connect with {connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}