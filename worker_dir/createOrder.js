
const Redis = require("ioredis");
const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");


const { init_Order } = require('../controller/createOrder');



function start(port, name) {
    return new Promise((resolve, reject) => {
        const taskBuy = new Map([]);

        port.on('message', async (rpc) => {

            if (!taskBuy.has(rpc.tokenId)) {
                taskBuy.set(rpc.tokenId, rpc.item_key)

                console.log('==============\nCreate Order');
                console.log(rpc);
                console.log('==============');

                if (rpc?.timeout) {

                    setTimeout(async () => {
                        let price = Number(rpc.price).toFixed(8);
                        // if (rpc.hasOwnProperty('globalWorker')) {
                        //     price = Number(rpc.price).toFixed(8);


                        // } else {
                        //     price = Number(rpc.price).toFixed(8) - Number(rpc.price * 0.09).toFixed(8);

                        // }
                        await init_Order({ tokenId: rpc.tokenId, price: price }).then(async res => {
                            console.log(res);
                            const price = await clientRedis.lrange(rpc.item_key, 0, -1);
                            console.log('При создании ордера база создержит по ключу ' + price.length);
                            price.forEach(async x => {
                                let y = JSON.parse(x);

                                if (y.token_id == rpc.tokenId) {
                                    // const price = await clientRedis.lrange(rpc.item_key, 0, -1);
                                    let filter = price.filter(x => {
                                        let y = JSON.parse(x);
                                        if (y.token_id == rpc.tokenId) {
                                            return x
                                        }
                                    });
                                    if (filter.length == 1) {
                                        y['price_gods_order'] = rpc.price;
                                        await clientRedis.lrem(rpc.item_key, 1, x);
                                        await clientRedis.lpush(rpc.item_key, JSON.stringify(y));
                                    }



                                }
                            })

                        })

                    }, rpc.timeout * rpc.index);

                } else {
                    await init_Order({ tokenId: rpc.tokenId, price: rpc.price }).then(async res => {
                        console.log(res);

                    })
                }

            }
            if (taskBuy.size > 5) {
                let index = 0;
                taskBuy.forEach((e, i) => {
                    index++
                    if (index < 2) {
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

            resolve({ name: name });
        }).catch(e => {
            console.log('Worker Error createTrade');

            reject(e);
        })
    })
};