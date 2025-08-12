import { createConfig} from '@wagmi/core'
import { arbitrumSepolia } from 'viem/chains'
import { http } from 'viem'
import { getDefaultConfig } from 'connectkit';

export const config = createConfig(
  getDefaultConfig({
    chains: [arbitrumSepolia],
    transports: {
      [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
    },
    walletConnectProjectId: "ffd25e3cc20b883d266134ce525caf88",
    appName: "Chrysalis - SteadyStake",
    appUrl: "https://steadystake.chrysalis.raum.network",
    appIcon: "https://family.co/logo.png",
    enableFamily: false,
  })
)