
const Redis = require("ioredis");
const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");
const fs = require('fs');


function start(port, name, item) {
    return new Promise(async (resolve) => {
        const taskBuy = new Map([]);
        port.on('message', (rpc)=> {

            if (!taskBuy.has(rpc.id)) {
                taskBuy.set(rpc.id, rpc.item)

                fs.appendFile(`./result/result_${rpc.item.sell.data.properties.name.replace(' ', '_')}.txt`, `Event: ms click item id ${rpc.item.sell.data.token_id} price^ ${rpc.priceItem} ETH\n${JSON.stringify(rpc.db_price)}\n\r`, function (error) {
                                        
                })
                console.log(rpc);


            }
            if (taskBuy.size > 50) {
                let index = 0;
                taskBuy.forEach((e,i)=> {
                    index++
                    if (index < 30) {
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
            port.close()

            resolve({name: name});
        }).catch(e => {
            console.log('Worker Error createTrade');

            reject(e);
        })
    })
};