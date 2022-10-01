const { AlchemyProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { getConfig, generateStarkWallet, BaseSigner, Workflows } = require('@imtbl/core-sdk');
// const { ImmutableXClient, Link } = require('@imtbl/imx-sdk');
// const { utils, BigNumber } = require("ethers");


const config = getConfig({
    coreContractAddress: '0x5FDCCA53617f4d2b9134B29090C87D01058e27e9',
    registrationContractAddress: '0x72a06bf2a1CE5e39cBA06c0CAb824960B587d64c',
    chainID: 1,
    basePath: 'https://api.x.immutable.com',
    // headers: { 'x-api-custom-header': '...' } // headers are optional unless specified otherwise
});
 


const privateKey = '0940e5a0a8d1f5b26638671f7e91388c6ba689a86c45361f1d71b8804d439dc2';
const provider = new AlchemyProvider('mainnet', '_qSfSMAPno3c1rCcufjgEwdqUJmTmDbF');
const signer = new Wallet(privateKey).connect(provider);

 

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

 
let WC;
(async()=> {
    WC = await generateWalletConnection(provider)
})();
 

async function buyNFT(order_id) {
    // console.log(await doConnect());
    // const client = await doConnect()

    // const assetsRequest = await client.getOrders({ status: 'active' })
 

    // const chainID = await signer.getChainId();
    // console.log(chainID); // этот код не обязательный, просто показывает в какой мы сети
    const coreSdkWorkflows = new Workflows(config);
    // WC = await generateWalletConnection(provider); // создаем подключение 
    // console.log(WC);



 

    
    const tradeRequest = {
        user: '0xb8F202dC3242A6b17d7Be5e2956aC2680EAf223c', // Ethereum address of the submitting user
        order_id: order_id, // The ID of the maker order involved
      };

    // console.log(await WC.l1Signer.getAddress()); // получаем наш адрес 




    const response = await coreSdkWorkflows.createTrade(
        WC, tradeRequest
    );
    // This will log the response specified in this API: https://docs.x.immutable.com/reference/#/operations/createOrder
    // console.log(response);
    return response



}


module.exports = {buyNFT}
