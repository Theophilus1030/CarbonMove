import { PropsWithChildren } from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { useToast } from "@/components/ui/use-toast";
import { APTOS_API_KEY, NETWORK } from "@/constants";

// 导入 Wallet Standard
import { AptosStandardSupportedWallet } from "@aptos-labs/wallet-standard";

export function WalletProvider({ children }: PropsWithChildren) {
  const { toast } = useToast();

  return (
    <AptosWalletAdapterProvider
      plugins={[]}
      autoConnect={true}
      dappConfig={{ 
        network: NETWORK, 
        aptosApiKeys: { [NETWORK]: APTOS_API_KEY } 
      }}
      onError={(error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error || "Unknown wallet error",
        });
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}