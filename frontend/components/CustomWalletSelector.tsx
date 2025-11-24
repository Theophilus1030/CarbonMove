import { useState } from "react";
import { Button, Modal, List, Avatar, message } from "antd";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function CustomWalletSelector() {
  const { account, connect, disconnect, wallets } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setModalOpen(false);
      message.success(`Connected to ${walletName}`);
    } catch (error: any) {
      console.error("Connect error:", error);
      message.error(`Failed to connect: ${error.message || error}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      message.success("Wallet disconnected");
    } catch (error: any) {
      console.error("Disconnect error:", error);
      message.error(`Failed to disconnect: ${error.message || error}`);
    }
  };

  // 过滤出已安装的钱包（使用字符串比较）
  const installedWallets = wallets?.filter(
    wallet => wallet.readyState === "Installed"
  ) || [];

  return (
    <>
      {account ? (
        <Button
          onClick={handleDisconnect}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: 'white',
            fontWeight: 500,
            height: '40px',
            borderRadius: '6px',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}
        </Button>
      ) : (
        <Button
          onClick={() => setModalOpen(true)}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: 'white',
            fontWeight: 500,
            height: '40px',
            borderRadius: '6px',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          Connect Wallet
        </Button>
      )}

      <Modal
        title="Connect a Wallet"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={400}
      >
        {installedWallets.length > 0 ? (
          <List
            dataSource={installedWallets}
            renderItem={(wallet) => (
              <List.Item
                style={{ 
                  cursor: 'pointer', 
                  padding: '12px 16px',
                  borderRadius: '8px',
                  transition: 'background 0.2s'
                }}
                onClick={() => handleConnect(wallet.name)}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      src={wallet.icon} 
                      size={40}
                      style={{
                        backgroundColor: '#f0f0f0',
                        padding: '4px'
                      }}
                    />
                  }
                  title={<span style={{ fontSize: '16px', fontWeight: 500 }}>{wallet.name}</span>}
                  description={`Ready to connect`}
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#999' 
          }}>
            <p style={{ fontSize: '16px', marginBottom: '16px' }}>
              No wallet detected
            </p>
            <p style={{ fontSize: '14px', marginBottom: '24px' }}>
              Please install a wallet extension to continue
            </p>
            <Button 
              type="primary" 
              href="https://petra.app/" 
              target="_blank"
              style={{ marginRight: '8px' }}
            >
              Install Petra
            </Button>
            <Button 
              href="https://martianwallet.xyz/" 
              target="_blank"
            >
              Install Martian
            </Button>
          </div>
        )}
        
        {installedWallets.length > 0 && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#f0f2f5', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#666'
          }}>
            💡 Detected {installedWallets.length} wallet{installedWallets.length > 1 ? 's' : ''}
          </div>
        )}
      </Modal>
    </>
  );
}