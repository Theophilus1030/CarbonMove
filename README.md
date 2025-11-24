# 🌱 CarbonMove - RWA Carbon Credit Marketplace on Aptos

## 📖 Introduction

**CarbonMove** is a next-generation decentralized **Real-World Asset (RWA)** carbon credit trading and retirement platform built on the **Aptos** blockchain. We are dedicated to leveraging the native features of the **Move language** to reshape the foundation of trust in the Voluntary Carbon Market (VCM).

### 🌍 Background & Pain Points

In the global wave of pursuing "Carbon Neutrality," traditional carbon trading markets still face serious trust crises:

  * **Double Counting**: The same carbon credit is often fraudulently sold to multiple buyers by dishonest project owners, leading to falsified environmental data.
  * **Fragmented Liquidity**: Carbon assets are typically locked in centralized, isolated databases, making them inaccessible to ordinary users and SMEs.
  * **Opaque Retirement**: After purchasing carbon credits, it is difficult for users to verify whether the quota has truly been "cancelled," causing many environmental actions to become mere formalities.

### 💡 Our Solution

CarbonMove proposes a fully on-chain solution based on the **Move Object Model**:

1.  **True Ownership**:
    Utilizing the Aptos `Object` standard, we encapsulate every certified real-world carbon credit (e.g., 100 tons of solar emission reduction) into an independent on-chain object. Unlike traditional ledger accounting, Move Objects have independent addresses and lifecycles, physically guaranteeing **uniqueness** and **non-replicability** at the underlying layer.

2.  **Decentralized Marketplace**:
    We have built a permissionless trading protocol. Certification bodies can directly **Mint & List** assets, setting prices in APT; global buyers can pay to purchase instantly. The smart contract utilizes the `TransferRef` mechanism to achieve unattended, atomic transactions, eliminating intermediary friction.

3.  **Immutable Proof of Impact**:
    This is the core loop of CarbonMove. When buyers wish to offset their carbon footprint, they must call the on-chain `retire` function. This operation forces the transfer of asset ownership to a blackhole address (`0xdead`). This process leaves a permanent mark on-chain, providing an immutable **"Proof of Burning"** and completely preventing the secondary circulation of used credits.

**CarbonMove is not just a marketplace; it is the bridge connecting Web3 financial liquidity with Web2 environmental assets, making every contribution to the planet visible and real.**

## ✨ Key Features

1.  **RWA Tokenization**

      * Admins (Certifiers) can mint real-world carbon reduction projects (e.g., Solar, Wind, Rainforest Protection) as on-chain assets.
      * Each asset contains authentic metadata: Project Name, Geographical Location, Carbon Tonnage, and Visual Proofs.

2.  **On-chain Listing Marketplace**

      * Adopts a **Listing** model: Admins mint assets while simultaneously setting an APT price and listing them for sale.
      * Leverages Move's `TransferRef` capability to enable automated, trustless trading without manual admin intervention.

3.  **Pay-to-Buy**

      * Integrated with the Aptos Coin standard. Users pay in APT, and the smart contract automatically routes funds to the project owner while transferring asset ownership to the buyer, completing the commercial loop.

4.  **On-chain Proof of Retirement**

      * After purchase, owners can click "Retire & Burn" to destroy the asset (transfer to the dead address).
      * This serves as the sole proof that carbon offsetting has occurred, preventing the certificate from being resold and solving the double-counting problem.

## 🛠 Tech Stack

  * **Blockchain**: Aptos Testnet
  * **Smart Contract**: Move Language
      * `aptos_framework::object` (Object Model)
      * `aptos_token_objects` (Digital Asset Standard)
      * Core Module: `carbon_credit`
  * **Frontend**:
      * React + TypeScript + Vite
      * Ant Design (UI Components)
      * Aptos TS SDK (Blockchain Interaction)
      * Petra Wallet Adapter (Wallet Connection)

## 🚀 Quick Start

Follow these steps to deploy the contract and run the frontend.

### 1\. Prerequisites

  * **Node.js** (v16+)
  * **Aptos CLI** (For compiling and deploying contracts)
  * **Petra Wallet** Browser Extension

### 2\. Clone the Repository

```bash
git clone https://github.com/YourUsername/CarbonMove.git
cd CarbonMove
```

### 3\. Deploy Smart Contract (Backend)

1.  Navigate to the move directory:
    ```bash
    cd move
    ```
2.  Initialize your Aptos account (if you haven't):
    ```bash
    aptos init
    # Select 'testnet' and press Enter to generate a new private key
    ```
3.  Fund your account:
    ```bash
    aptos account fund-with-faucet --account default
    ```
4.  **Publish the Contract**:
    *(This command will compile the code and deploy it to your address)*
    ```bash
    aptos move publish --named-addresses CarbonMove=default
    ```
    > **Note**: Copy the `Sender` address from the output (e.g., `0x123...`). You will need this for the frontend.

### 4\. Run Frontend (Web App)

1.  Return to the root directory and install dependencies:
    ```bash
    cd ..
    npm install
    ```
2.  **Configure Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    # Paste the address you got from the "Deploy Smart Contract" step
    VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS=0x... 

    # (Optional) Aptos API Key
    VITE_APTOS_API_KEY=aptos_testnet_...
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:5173` in your browser.
      * *Login with the same wallet account used for deployment to access the Admin Console.*

## 📜 Smart Contract Information

  * **Network**: Aptos Testnet
  * **Module Name**: `carbon_credit`
  * **Key Functions**:
      * `mint_and_list`: Mint RWA assets and list them for sale.
      * `buy_listing`: Purchase assets using APT.
      * `retire_credit`: Burn assets to offset carbon emissions.

-----

*Built for Move the Future: Aptos x SMU Web3 Innovation Hackathon 2025*