
const Redis = require("ioredis");
require('dotenv/config');
const clientRedis = new Redis(process.env.REDIS);
// const fs = require('fs');
const { buyNFT } = require('../controller/buyNFT');

// const { getConfig, WalletConnection, generateStarkWallet, BaseSigner  } = require ('@imtbl/core-sdk');

// const config = getConfig({
//     coreContractAddress: '0x5FDCCA53617f4d2b9134B29090C87D01058e27e9',
//     registrationContractAddress: '0x72a06bf2a1CE5e39cBA06c0CAb824960B587d64c',
//     chainID: 5,
//     basePath:  'https://api.x.immutable.com',
//     // headers: { 'x-api-custom-header': '...' } // headers are optional unless specified otherwise
//   });

//   const privateKey = '0940e5a0a8d1f5b26638671f7e91388c6ba689a86c45361f1d71b8804d439dc2';
// const provider = new AlchemyProvider('mainnet', '_qSfSMAPno3c1rCcufjgEwdqUJmTmDbF');
// const signer = new Wallet(privateKey).connect(provider);

// const generateWalletConnection = async (provider)=> {
//     // L1 credentials
//     const l1Signer = Wallet.createRandom().connect(provider);

//     // L2 credentials
//     const starkWallet = await generateStarkWallet(l1Signer);
//     const l2Signer = new BaseSigner(starkWallet.starkKeyPair);

//     return {
//       l1Signer,
//       l2Signer,
//     };
//   };
function start(port, name, item) {
    return new Promise(async (resolve) => {
        // console.log(generateWalletConnection(provider));
        const taskBuy = new Map([]);
        port.on('message', async (rpc) => {

            if (!taskBuy.has(rpc.id)) {
                console.log('Инициировали покупку');
                taskBuy.set(rpc.id, rpc.item.sell.data.properties.name)
                await buyNFT(rpc.item.order_id).then(async res => {
                    console.log(res);
                    if (res?.trade_id) {
                        console.info('Совершили покупку - trade_id: ' + res?.trade_id);
                        const price = await clientRedis.lrange(`my_item_${rpc.item.sell.data.properties.name.replace(' ', '_')}`, 0, -1);
                        let filter = price.filter(x=> {
                            let y = JSON.parse(x);
                            if (y.token_id == rpc.item.sell.data.token_id) {
                                return x
                            }
                        });
                        if (filter.length == 0) {
                            await clientRedis.lpush(`my_item_${rpc.item.sell.data.properties.name.replace(' ', '_')}`, JSON.stringify({ date: new Date().getTime(), trade_id: res.trade_id, price_buy: rpc.priceItem, db_price: rpc.db_price, init_order: false, item_name: rpc.item.sell.data.properties.name, token_id: rpc.item.sell.data.token_id }))

                        } else {
                            console.log('При покупке в базе содержится - ' + filter.length + ' одинаковых объектов');
                            // await clientRedis.lrem(`my_item_${rpc.item.sell.data.properties.name.replace(' ', '_')}`, filter.length, element);

                            // await clientRedis.lpush(`my_item_${rpc.item.sell.data.properties.name.replace(' ', '_')}`, JSON.stringify({ date: new Date().getTime(), trade_id: res.trade_id, price_buy: rpc.priceItem, db_price: rpc.db_price, init_order: false, item_name: rpc.item.sell.data.properties.name, token_id: rpc.item.sell.data.token_id }))

                            
                        }



                    } else {
                        console.log('===============\n====!Покупка не удалась!====\n===============');
                    }

                }).catch(e=> {
                    console.log('===============\n====!Произошла ошибка на этапе покупки====\n===============');

                    console.log(e);
                });


                // fs.appendFile(`./result/result_${rpc.item.sell.data.properties.name.replace(' ', '_')}.txt`, `Event: ms click item id ${rpc.item.sell.data.token_id} price^ ${rpc.priceItem} ETH\n${JSON.stringify(rpc.db_price)}\n\r`, function (error) {

                // })
                // console.log(rpc);


            }
            if (taskBuy.size > 2550) {
                let index = 0;
                taskBuy.forEach((e, i) => {
                    index++
                    if (index < 150) {
                        taskBuy.delete(i)
                    }
                })

            }


        })

    })
}









module.exports = ({ port, name }) => {
    return new Promise((resolve, reject) => {




        start(port, name).then((res) => {
            console.log('Worker createTrade end');
            // port.close()

            resolve({ name: name });
        }).catch(e => {
            console.log('Worker Error createTrade');

            reject(e);
        })
    })
};