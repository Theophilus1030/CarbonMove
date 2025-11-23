import { useState, useEffect } from "react";
import { Layout, Row, Col, Button, Input, Card, Typography, message, Modal, Tag, Select, Divider } from "antd";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// --- Configuration ---
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);
const MODULE_ADDRESS = import.meta.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS;
const MODULE_NAME = "carbon_credit_v3";

// Asset Types (Using Local Images from 'public' folder)
const ASSET_TYPES = [
  { 
    label: "Solar Farm", 
    value: "Solar", 
    image: "https://amplussolar.com/blog/wp-content/uploads/2025/01/Top-5-Solar-Farms-in-India-2021.jpg" 
  },
  { 
    label: "Wind Power", 
    value: "Wind", 
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80" 
  },
  { 
    label: "Rainforest", 
    value: "Nature", 
    image: "https://media.istockphoto.com/id/535499464/ja/%E3%82%B9%E3%83%88%E3%83%83%E3%82%AF%E3%83%95%E3%82%A9%E3%83%88/%E3%82%A8%E3%83%AB%E3%83%A6%E3%83%B3%E3%82%B1%E3%81%AE%E6%9C%9D%E3%81%AE%E9%9C%A7.jpg?s=612x612&w=0&k=20&c=ozLzzN8zY8Ipyw1Z_7THhbA5xxhWZ6YK97jbywO4R0I=" 
  },
  { 
    label: "Hydro/Ocean", 
    value: "Hydro", 
    image: "https://firebasestorage.googleapis.com/v0/b/fiveable-92889.appspot.com/o/images%2Fhydro.jpg?alt=media&token=3ba725ec-f9d1-4f52-aa7e-fcff16588ff7" 
  }
];

// Regions
const REGIONS = [
  { label: "Brazil", value: "Brazil" },
  { label: "China", value: "China" },
  { label: "USA", value: "USA" },
  { label: "Europe", value: "Europe" },
  { label: "India", value: "India" },
  { label: "Singapore", value: "Singapore" }
];

function App() {
  const { account, signAndSubmitTransaction } = useWallet();
  
  // --- State ---
  const [projectName, setProjectName] = useState("Project Alpha #01");
  const [tokenName, setTokenName] = useState(`Carbon-${Math.floor(Math.random() * 10000)}`);
  const [amount, setAmount] = useState("100");
  const [price, setPrice] = useState("0.1"); 
  const [selectedType, setSelectedType] = useState(ASSET_TYPES[2].value); 
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0].value); 
  const [marketTokens, setMarketTokens] = useState<any[]>([]); 
  const [myTokens, setMyTokens] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (account && MODULE_ADDRESS) {
      // Case-insensitive check
      setIsAdmin(account.address.toString().toLowerCase() === MODULE_ADDRESS.toLowerCase());
    } else {
      setIsAdmin(false);
    }
  }, [account]);

  // --- Core Logic ---
  const fetchTokens = async (targetAddress: string, isMarket: boolean) => {
    try {
      const tokens = await aptos.getAccountOwnedTokens({ accountAddress: targetAddress });
      
      // Filter by collection name
      const filtered = tokens.filter((t: any) => 
        t.current_token_data?.current_collection?.collection_name === "CarbonMove Market V3"
      );

      const enriched = await Promise.all(filtered.map(async (t: any) => {
        const tokenId = t.token_data_id;
        let extraData = { carbonAmount: "N/A", price: "0", realProjectName: "Loading..." };

        try {
          // 1. Get Carbon Amount
          const amountVal = await aptos.view({ 
            payload: { 
              function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_carbon_amount`, 
              typeArguments: [], 
              functionArguments: [tokenId] 
            }
          });
          extraData.carbonAmount = amountVal?.[0] ? amountVal[0].toString() : "0";

          // 2. Get Real Project Name
          const nameVal = await aptos.view({ 
            payload: { 
              function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_project_name`, 
              typeArguments: [], 
              functionArguments: [tokenId] 
            }
          });
          extraData.realProjectName = nameVal?.[0] ? nameVal[0].toString() : "Unknown Project";
          
          // 3. Get Price (only if market listing)
          if (isMarket) {
            const priceVal = await aptos.view({ 
              payload: { 
                function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_listing_price`, 
                typeArguments: [], 
                functionArguments: [tokenId] 
              }
            });
            const priceOctas = priceVal?.[0] ? Number(priceVal[0]) : 0;
            extraData.price = (priceOctas / 100000000).toString();
          }

        } catch (e) { 
          console.error("View error", e); 
        }

        return { ...t, ...extraData };
      }));

      return enriched;
    } catch (e) { 
      console.error("Fetch error", e); 
      return []; 
    }
  };

  const refreshAll = async () => {
    setFetching(true);
    // Fetch Market (Admin's tokens)
    const market = await fetchTokens(MODULE_ADDRESS, true);
    setMarketTokens(market);

    // Fetch My Portfolio (User's tokens)
    if (account) {
      const mine = await fetchTokens(account.address.toString(), false);
      setMyTokens(mine);
    }
    setFetching(false);
  };

  useEffect(() => { refreshAll(); }, [account]);

  // --- Actions ---
  const handleList = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const priceInOctas = Math.floor(parseFloat(price) * 100000000);
      const targetImage = ASSET_TYPES.find(t => t.value === selectedType)?.image || "";

      const response = await signAndSubmitTransaction({
        sender: account.address.toString(),
        data: { 
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::mint_and_list`, 
          typeArguments: [], 
          functionArguments: [
            projectName, 
            tokenName, 
            parseInt(amount), 
            selectedRegion, 
            targetImage, 
            priceInOctas
          ] 
        },
      });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      message.success("Asset Listed Successfully");
      setTokenName(`Carbon-${Math.floor(Math.random() * 10000)}`); 
      setTimeout(refreshAll, 2000);
    } catch (error: any) { 
      message.error("List Failed: " + error); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleBuy = async (tokenObjAddr: string, priceDisplay: string) => {
    if (!account) { message.error("Connect wallet first"); return; }
    setLoading(true);
    try {
      const response = await signAndSubmitTransaction({
        sender: account.address.toString(),
        data: { 
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::buy_listing`, 
          typeArguments: [], 
          functionArguments: [tokenObjAddr] 
        },
      });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      message.success(`Purchased for ${priceDisplay} APT`);
      setTimeout(refreshAll, 2000);
    } catch (error: any) { 
      message.error("Purchase Failed: " + error); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleRetire = async (tokenObjAddr: string) => {
    Modal.confirm({
      title: 'Confirm Retirement',
      content: 'Permanently retire this asset on-chain? This action cannot be undone.',
      okText: 'Retire & Burn',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await signAndSubmitTransaction({
            sender: account?.address.toString(),
            data: { 
              function: `${MODULE_ADDRESS}::${MODULE_NAME}::retire_credit`, 
              typeArguments: [], 
              functionArguments: [tokenObjAddr] 
            },
          });
          message.loading("Processing...", 1);
          await aptos.waitForTransaction({ transactionHash: response.hash });
          message.success("Retired!");
          setTimeout(refreshAll, 2000);
        } catch (error: any) { 
          message.error("Retire Failed: " + error); 
        }
      }
    });
  };

  // --- Styles ---
  const headerStyle: React.CSSProperties = {
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    background: "#002c3e", // Dark Teal
    padding: "0 24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    zIndex: 10,
    height: "64px"
  };

  const mainButtonStyle: React.CSSProperties = {
    background: "#389e0d", 
    borderColor: "#389e0d", 
    height: "40px", 
    fontWeight: 500
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Global Styles Override */}
      <style>{`
        /* Ghost Button Style for Wallet Connector */
        #wallet-btn-container .ant-btn {
          background-color: transparent !important;
          border: 1px solid rgba(255, 255, 255, 0.4) !important;
          color: white !important;
          font-weight: 500 !important;
          box-shadow: none !important;
          height: 40px !important;
          border-radius: 6px !important;
        }
        #wallet-btn-container .ant-btn:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: #ffffff !important;
          color: #ffffff !important;
        }
        
        /* Card Image Cover Style */
        .asset-card-cover {
            height: 180px;
            width: 100%;
            object-fit: cover;
            border-bottom: 1px solid #f0f0f0;
        }
      `}</style>

      <Header style={headerStyle}>
        <div style={{ color: "white", fontSize: "20px", fontWeight: "600", display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span>🌱 CarbonMove</span>
          <Tag color="rgba(255,255,255,0.2)" style={{color: 'white', border: 'none', marginRight: 0}}>V3</Tag>
        </div>
        <div id="wallet-btn-container" style={{ marginLeft: 'auto' }}>
            <WalletSelector />
        </div>
      </Header>

      <Content style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* === Admin Panel === */}
        {isAdmin && (
          <Card 
            title={
                <div style={{display:'flex', alignItems:'center', gap: 8}}>
                    <span style={{fontSize: 20}}>👑</span>
                    <span>Admin Console</span>
                </div>
            }
            bordered={false}
            style={{ marginBottom: 40, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", borderRadius: "8px" }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Text type="secondary" style={{fontSize: 12}}>PROJECT NAME</Text>
                <Input value={projectName} onChange={e => setProjectName(e.target.value)} style={{marginTop: 4}} />
              </Col>
              <Col xs={12} md={8}>
                <Text type="secondary" style={{fontSize: 12}}>AMOUNT (TONS)</Text>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{marginTop: 4}} />
              </Col>
              <Col xs={12} md={8}>
                <Text type="secondary" style={{fontSize: 12}}>PRICE (APT)</Text>
                <Input type="number" value={price} onChange={e => setPrice(e.target.value)} suffix="APT" style={{marginTop: 4}} />
              </Col>
              <Col xs={12} md={8}>
                <Text type="secondary" style={{fontSize: 12}}>ASSET TYPE</Text>
                <Select value={selectedType} onChange={val => setSelectedType(val)} style={{ width: '100%', marginTop: 4 }}>
                  {ASSET_TYPES.map(type => (<Option key={type.value} value={type.value}>{type.label}</Option>))}
                </Select>
              </Col>
              <Col xs={12} md={8}>
                <Text type="secondary" style={{fontSize: 12}}>REGION</Text>
                <Select value={selectedRegion} onChange={val => setSelectedRegion(val)} style={{ width: '100%', marginTop: 4 }}>
                   {REGIONS.map(reg => (<Option key={reg.value} value={reg.value}>{reg.label}</Option>))}
                </Select>
              </Col>
              <Col xs={24} md={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button type="primary" loading={loading} onClick={handleList} block style={mainButtonStyle}>
                  List Asset
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        {/* === Marketplace === */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0, color: "#262626", display: 'flex', alignItems: 'center', gap: 8 }}>
                🛒 Marketplace
            </Title>
            <Button onClick={refreshAll} loading={fetching}>Refresh</Button>
          </div>
          
          {marketTokens.length === 0 ? (
            <div style={{ background: 'white', padding: '60px', borderRadius: '8px', textAlign: 'center', color: '#8c8c8c' }}>
                No assets available in the marketplace.
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {marketTokens.map((token, idx) => (
                <Col xs={24} sm={12} md={8} lg={6} key={idx}>
                  <Card
                    hoverable
                    bordered={false}
                    style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                    cover={
                        <img 
                            alt="asset" 
                            src={token.current_token_data?.token_uri} 
                            className="asset-card-cover"
                        />
                    }
                    actions={[
                      <div style={{padding: "0 16px 16px 16px"}}>
                         <Button type="primary" block onClick={() => handleBuy(token.token_data_id, token.price)} style={{...mainButtonStyle, width: '100%'}}>
                            Buy for {token.price} APT
                        </Button>
                      </div>
                    ]}
                  >
                    <div style={{padding: "0 12px"}}>
                        <Text strong style={{fontSize: 16, color: '#1f1f1f', display:'block', marginBottom: 8}} ellipsis>
                            {token.realProjectName || "Loading..."}
                        </Text>
                        <div style={{marginBottom: 12}}>
                             <Tag color="geekblue">{token.current_token_data?.description}</Tag> 
                             <Text type="secondary" style={{fontSize: 12}} ellipsis>{token.current_token_data?.token_name}</Text>
                        </div>
                        <Divider style={{margin: "12px 0"}} />
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <Text type="secondary">Offset</Text>
                            <Text strong style={{fontSize:18, color: '#0f3e2e'}}>{token.carbonAmount} Tons</Text>
                        </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>

        <Divider style={{ borderColor: '#e8e8e8' }} />

        {/* === My Portfolio === */}
        <div>
          <Title level={3} style={{ marginBottom: 24, color: "#262626", display: 'flex', alignItems: 'center', gap: 8 }}>
            💼 My Portfolio
          </Title>
          {myTokens.length === 0 ? (
             <div style={{ background: 'white', padding: '60px', borderRadius: '8px', textAlign: 'center', color: '#8c8c8c', border: '1px dashed #d9d9d9' }}>
                Your portfolio is empty. Purchase credits to view them here.
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {myTokens.map((token, idx) => (
                <Col xs={24} sm={12} md={8} lg={6} key={idx}>
                  <Card
                    hoverable
                    bordered={false}
                    style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                    cover={
                        <img 
                            alt="asset" 
                            src={token.current_token_data?.token_uri} 
                            className="asset-card-cover"
                        />
                    }
                    actions={[
                        <Button type="text" danger onClick={() => handleRetire(token.token_data_id)} style={{fontWeight: 600}}>
                            🔥 Retire & Burn
                        </Button>
                    ]}
                  >
                     <div style={{padding: "12px"}}>
                         <Text strong style={{fontSize: 15, color: '#1f1f1f', display: 'block', marginBottom: 6}} ellipsis>
                             {token.realProjectName || "Loading..."}
                         </Text>
                         <div style={{display:'flex', alignItems:'center', gap: 6, marginBottom: 10}}>
                             <Tag color="green">Owned</Tag>
                             <Text type="secondary" style={{fontSize: 12}} ellipsis>{token.current_token_data?.token_name}</Text>
                         </div>
                         <div style={{background: '#f6ffed', padding: '8px 12px', borderRadius: 6, border: '1px solid #b7eb8f', textAlign: 'center'}}>
                             <Text strong style={{color: '#389e0d'}}>{token.carbonAmount} Tons CO2e</Text>
                         </div>
                     </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>

      </Content>
    </Layout>
  );
}

export default App;