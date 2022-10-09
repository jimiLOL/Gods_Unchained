

const { init_Order } = require('../controller/createOrder');
const Redis = require("ioredis");
const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");
const { utils } = require("ethers");
const fs = require('fs');


function start() {
    return new Promise(async (resolve) => {

        const keys_db_s = await clientRedis.keys('average_price_*');
        console.log('keys_db_s - ' + keys_db_s.length);

        // keys_db_s.forEach(async element => {
        //     // await clientRedis.del(element)
        //     let item = await clientRedis.get(element)
        //     fs.appendFile('./keys_db_s.txt', `${item}\n`, (error)=> {
        //         // console.log(error);
        //     })
            
        // });


        const keys_db = await clientRedis.keys('my_item_*');
        console.log('keys_db - ' + keys_db.length);
        // console.log(keys_db);
 

        keys_db.forEach(async (ele, index) => {
            let price = await clientRedis.lrange(ele, 0, 700);
            console.log(ele + ' - ' + price.length);

            price.forEach(async (items, i) => {
                let itemData = JSON.parse(items);

                let filter = price.filter(x => {
                    let y = JSON.parse(x);
                    if (y.token_id == itemData.token_id) {
                        return x
                    }
                });
                if (filter.length > 1 && i == price.length) {
                console.log('дублей - ' + filter.length);
                const result = await clientRedis.lrem(ele, filter.length-1, items);
                console.log('result ' + result);
 
                }
            }); // удаляем дубли из базы
            // console.log(ele);
            price = await clientRedis.lrange(ele, 0, -1);
        //    console.log(price);
            price.forEach((element, i) => {
                let itemData = JSON.parse(element);
                // console.log(itemData);

                // itemData.date < new Date().getTime() - 25 * 60 * 60 * 1000
                if (!itemData.init_order) {
                    setTimeout(async () => {
                        const average_price = await clientRedis.get(`average_price_${itemData.item_name.replace(' ', '_')}`);
                        if (average_price) {
                            await clientRedis.lrem(ele, 1, element);
                            // await clientRedis.lrem(ele, 1, itemData.token_id);
                            itemData.init_order = true;
                            let item = JSON.parse(average_price);

                            let sellPrice = item.GODS.average_big;

                            let newPrice = utils.formatUnits(String(sellPrice), '18');

                            const result = await init_Order({ tokenId: itemData.token_id, price: Number(newPrice).toFixed(8), workerType: 'myItemsCheck' }).then(async res => {
                                const price = await clientRedis.lrange(ele, 0, -1);

                                let filter = price.filter(x => {
                                    let y = JSON.parse(x);
                                    if (y.token_id == itemData.token_id) {
                                        return x
                                    }
                                });
                                if (filter.length == 0) {
                                    await clientRedis.lpush(ele, JSON.stringify(itemData));
                                } else {
                                    await clientRedis.lrem(ele, filter.length, element);
                                    // удаляем все вхождения 
                                    await clientRedis.lpush(ele, JSON.stringify(itemData));


                                }

                                return res

                            });
                            console.log(result);

                        }

                        if (index == price.length - 1 && i == price.length - 1) {
                            resolve()
                        }
                    }, 1000 * i + 1);

                } else {
                    if (index == price.length - 1) {
                        resolve()
                    }
                }

            });



        });
        if (keys_db.length == 0) {
            resolve()
        }




    })
}

module.exports = () => {
    return new Promise((resolve, reject) => {
        console.log('Worker myItemsCheck Start');





        start().then(() => {
            console.log('Worker myItemsCheck end');

            resolve();
        }).catch(e => {
            console.log('Worker Error myItemsCheck');

            reject(e);
        })
    })
};