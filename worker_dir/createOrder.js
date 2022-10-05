
const Redis = require("ioredis");
const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");


const {init_Order} = require('../controller/createOrder');



function start(port, name) {
    return new Promise((resolve, reject)=> {
        port.on('message', async (rpc)=> {
            console.log('==============\nCreate Order');
            console.log(rpc);
            console.log('==============');

            if (rpc?.timeout) {

                setTimeout(async () => {
                    await init_Order({tokenId: rpc.tokenId, price: Number(rpc.price).toFixed(8)}).then(async res=> {
                        console.log(res);
                        const price = await clientRedis.lrange(rpc.item_key, 0, -1);
                        price.forEach(async x=> {
                            let y = JSON.parse(x);
                            if (y.token_id == rpc.tokenId) {
                                y['price_gods_order'] = rpc.price;
                                 await clientRedis.lrem(rpc.item_key, 1, x);
                                //  await clientRedis.lrem(rpc.item_key, 1, y.token_id);
                                  await clientRedis.lpush(rpc.item_key, JSON.stringify(y));


                            }
                        })
        
                    })
                    
                }, rpc.timeout* rpc.index);

            } else {
                await init_Order({tokenId: rpc.tokenId, price: rpc.price}).then(async res=> {
                    console.log(res);
    
                })
            }

         
        })

    })

}




module.exports = ({ port, name }) => {
    return new Promise((resolve, reject) => {




        start(port, name).then((res) => {
            console.log('Worker createTrade end');

            resolve({ name: name });
        }).catch(e => {
            console.log('Worker Error createTrade');

            reject(e);
        })
    })
};