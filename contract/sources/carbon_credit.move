module CarbonMove::carbon_credit {
    use std::string::{Self, String};
    use std::option;
    use std::signer;
    // Import necessary Object types
    use aptos_framework::object::{Self, Object, TransferRef};
    use aptos_token_objects::collection;
    use aptos_token_objects::token;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;

    /// Error: The caller is not the admin of the contract.
    const ENOT_ADMIN: u64 = 1;
    /// Error: The asset is not listed for sale.
    const ENOT_LISTED: u64 = 2;

    // RWA Data Structure
    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct CarbonCredit has key {
        project_name: String,
        carbon_amount: u64,
        location: String,
    }

    // Listing Info (Stores price and transfer capability)
    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct Listing has key {
        price: u64,
        transfer_ref: TransferRef, 
    }

    // Module initialization (Runs once on deployment)
    fun init_module(account: &signer) {
        let collection_name = string::utf8(b"CarbonMove Market V3");
        let description = string::utf8(b"Verified Carbon Credits Marketplace");
        let collection_uri = string::utf8(b"https://example.com/collection.png");

        // Create collection
        collection::create_unlimited_collection(
            account,
            description,
            collection_name,
            option::none(),
            collection_uri,
        );
    }

    // 1. Admin Mint & List
    public entry fun mint_and_list(
        admin: &signer, 
        project_name: String,
        token_name: String,
        carbon_amount: u64,
        location: String,
        uri: String,
        price: u64
    ) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @CarbonMove, ENOT_ADMIN);

        // Use the collection name created in init_module
        let collection_name = string::utf8(b"CarbonMove Market V3");

        // Create Token
        let constructor_ref = token::create_named_token(
            admin,
            collection_name,
            location, // description
            token_name, 
            option::none(),
            uri,
        );

        let object_signer = object::generate_signer(&constructor_ref);

        // Store RWA data
        move_to(&object_signer, CarbonCredit {
            project_name,
            carbon_amount,
            location,
        });

        // Generate TransferRef
        let transfer_ref = object::generate_transfer_ref(&constructor_ref);

        // Store Listing info (List for sale)
        move_to(&object_signer, Listing {
            price,
            transfer_ref, 
        });
    }

    // 2. Buy Listing
    public entry fun buy_listing(
        buyer: &signer,
        token_obj: Object<CarbonCredit>
    ) acquires Listing {
        let obj_addr = object::object_address(&token_obj);
        assert!(exists<Listing>(obj_addr), ENOT_LISTED);

        // Unpack listing data
        let Listing { price, transfer_ref } = move_from<Listing>(obj_addr);

        // Payment: Buyer -> Admin
        coin::transfer<AptosCoin>(buyer, @CarbonMove, price);

        // Transfer ownership using the stored capability
        let linear_transfer_ref = object::generate_linear_transfer_ref(&transfer_ref);
        object::transfer_with_ref(linear_transfer_ref, signer::address_of(buyer));
    }

    // 3. Retire/Burn
    public entry fun retire_credit(
        owner: &signer,
        token: Object<CarbonCredit>
    ) {
        object::transfer(owner, token, @0xdead);
    }

    // View Functions
    #[view]
    public fun get_listing_price(obj_addr: address): u64 acquires Listing {
        if (exists<Listing>(obj_addr)) {
            borrow_global<Listing>(obj_addr).price
        } else {
            0
        }
    }

    #[view]
    public fun get_carbon_amount(obj_addr: address): u64 acquires CarbonCredit {
        if (exists<CarbonCredit>(obj_addr)) {
            borrow_global<CarbonCredit>(obj_addr).carbon_amount
        } else {
            0
        }
    }

    #[view]
    public fun get_project_name(obj_addr: address): String acquires CarbonCredit {
        if (exists<CarbonCredit>(obj_addr)) {
            borrow_global<CarbonCredit>(obj_addr).project_name
        } else {
            string::utf8(b"Unknown Project")
        }
    }
}