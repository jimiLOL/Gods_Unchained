// в принципе этот код можно использовать, что бы обновлять наши сделки
const { AlchemyProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { getConfig, generateStarkWallet, BaseSigner, Workflows } = require('@imtbl/core-sdk');
const { ImmutableXClient, Link } = require('@imtbl/imx-sdk');
const { utils, BigNumber } = require("ethers");


const config = getConfig({
    coreContractAddress: '0x5FDCCA53617f4d2b9134B29090C87D01058e27e9',
    registrationContractAddress: '0x72a06bf2a1CE5e39cBA06c0CAb824960B587d64c',
    chainID: 1,
    basePath: 'https://api.x.immutable.com',
    // headers: { 'x-api-custom-header': '...' } // headers are optional unless specified otherwise
});
// const assetsApi = new AssetsApi(config.apiConfiguration);


// const coreSdkConfig = getConfig('mainnet');
// const coreSdkWorkflows = new Workflows(coreSdkConfig);

const tokenAddress = '0xacb3c6a43d15b907e8433077b6d38ae40936fe2c';


const privateKey = '0940e5a0a8d1f5b26638671f7e91388c6ba689a86c45361f1d71b8804d439dc2';
const provider = new AlchemyProvider('mainnet', '_qSfSMAPno3c1rCcufjgEwdqUJmTmDbF');
const signer = new Wallet(privateKey).connect(provider);


// const linkAddress = 'https://link.x.immutable.com';
// const apiAddress = 'https://api.x.immutable.com/v1';
// const link = new Link(linkAddress);

const generateWalletConnection = async (provider) => {
    // L1 credentials
    const l1Signer = new Wallet(privateKey).connect(provider);

    // L2 credentials
    const starkWallet = await generateStarkWallet(l1Signer);
    const l2Signer = new BaseSigner(starkWallet.starkKeyPair);

    return {
        l1Signer,
        l2Signer
    };
};

const doConnect = async () => {
    // const signer = new wallet.Wallet(conf.PRIVATE_WALLET_KEY).connect(getProvider());
    return await ImmutableXClient.build({
        publicApiUrl: 'https://api.x.immutable.com',
        signer: signer,
        starkContractAddress: '0x5FDCCA53617f4d2b9134B29090C87D01058e27e9',
        registrationContractAddress: '0x72a06bf2a1CE5e39cBA06c0CAb824960B587d64c',
    });
}

// const isAlreadyBought = async (client, item) => {
//     let params = {
//         user: client.address,
//         name: item.sell.data.properties.name
//     }
//     let copies = await getAssets(client, params)
//     if (copies.length <= 0) return false
//     const msg = `(${item.sell.data.properties.name}) ALREADY PRESENT IN COLLECTION`
//     if (vars.DEBUG) console.log(msg)
//     return true;
// }

async function startTest() {
    // console.log(await doConnect());
    // const client = await doConnect()

    // const assetsRequest = await client.getOrders({ status: 'active' })
 

    const chainID = await signer.getChainId();
    console.log(chainID); // этот код не обязательный, просто показывает в какой мы сети
    const coreSdkWorkflows = new Workflows(config);
    const WC = await generateWalletConnection(provider); // создаем подключение 


    let tokenId = '176056833';



    const now = new Date(Date.now());
    now.setMonth(now.getMonth() + 1);
    const timestamp = Math.floor(now.getTime() / 1000);

    const tradeParameters = {
        // Change '0.1' to any value of the currency wanted to sell this asset
        amount_buy: utils.parseEther('0.0002').toString(),
        // Change '1' to any value indicating the number of assets you are selling
        amount_sell: '1',
        expiration_timestamp: timestamp,
        // Fees are optional; for simplicity, no maker or taker fees are added in this sample
        fees: [],
        // The currency wanted to sell this asset
        token_buy: {
            type: 'ETH', // Or 'ERC20' if it's another currency    
            data: {
                //token_address: '', // Or the token address of the ERC20 token
                decimals: 18, // Or any decimals used by the token
            },
        },

        // The asset being sold
        // token_sell: {
        //     type: 'ERC721',
        //     data: {
        //         // The collection address of this asset
        //         token_address: tokenAddress,

        //         // The ID of this asset
        //         token_id: tokenId,
        //     },
        // },
        // The ETH address of the L1 Wallet
        user: await WC.l1Signer.getAddress(),
    };
    const fakeTradeRequest = {
        user: await WC.l1Signer.getAddress(), // Ethereum address of the submitting user
        order_id: 230077693, // The ID of the maker order involved
      };

    console.log(await WC.l1Signer.getAddress()); // смотрим наш адрес 




    const response = await coreSdkWorkflows.createTrade(
        WC, fakeTradeRequest
    );
    // This will log the response specified in this API: https://docs.x.immutable.com/reference/#/operations/createOrder
    console.log(response);



}


module.exports = { startTest }
