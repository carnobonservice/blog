import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";

const grpcUrls = {
    mainnet: "https://fullnode.mainnet.sui.io:443",
    testnet: "https://fullnode.testnet.sui.io:443",
} as const;

export const dAppKit = createDAppKit({
    networks: ["mainnet", "testnet"],
    defaultNetwork: "mainnet",
    // A wallet must be connected explicitly for each page load. Without this,
    // dApp Kit restores the last approved wallet from local storage.
    createClient: network => new SuiGrpcClient({ network, baseUrl: grpcUrls[network] }),
});

declare module "@mysten/dapp-kit-react" {
    interface Register {
        dAppKit: typeof dAppKit;
    }
}
