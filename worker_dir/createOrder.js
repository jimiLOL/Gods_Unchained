
// const Redis = require("ioredis");
// const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");


const {init_Order} = require('../controller/createOrder');



function start(port, name) {
    return new Promise((resolve, reject)=> {
        port.on('message', async (rpc)=> {
            console.log(rpc);
            await init_Order({tokenId: rpc.tokenId, price: price}).then(async res=> {
                console.log(res);

            })
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