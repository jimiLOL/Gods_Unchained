const apiImmutable = require('../controller/apiClass');
const fs = require('fs');
const helper = require('../helper');
const Redis = require("ioredis");
const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");


const Piscina = require('piscina');
const path = require('path');

const worker_get_items_for_name = new Piscina({
    filename: path.resolve('./worker_dir', 'getItemsinWhile.js'),
    maxQueue: 2,
    maxThreads: 4
});

// это будут глобалные Workers

function start(port, userListItems) {
    return new Promise(async (resolve, reject) => {
        let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
        console.log(typeof list);
        const proxyList = list.split('\n', 3000);
        let index = proxyList.indexOf('');
        proxyList.splice(index, 1);
        helper.shuffle(proxyList);
        const promiseWorker = [];
        for (let index = 0; index < 10; index++) {
            helper.timeout(20 * index).then(() => {

                apiImmutable.get_list_order(helper.initAgent(helper.proxyInit(proxyList[helper.getRandomInt(1, proxyList.length - 1)]))).then((res) => {
                    console.log('res.data.result.length');
                    console.log(res.data.result.length);
                    if (Array.isArray(res.data.result)) {
                        //   const filterArray = [];

                        // res.data.result.forEach(async item => {

                        //     if (!filterArray.some(x=> x.sell.data.properties.name == item.sell.data.properties.name)) {
                        //         filterArray.push(item)


                        //        };

                        // })
                        let i = 0;
                        const itemsArray = [];

                        res.data.result.forEach(async item => {
                         
                            // console.log(item.sell.data.properties.name);
                            if (await clientRedis.exists(`my_item_${item.sell.data.properties.name}`)) {
                                i++
                                // если у нас самих имеется такая карточка - надо проверить цену и перебить ее, если она выше нашей
                                const price = await await clientRedis.get(`my_item_${item.sell.data.properties.name}`);
                                console.log(price);
                                // отправляем задачу в отдельный воркер котрый перебивает это все делож
                                const worker_set_new_price = new Piscina({
                                    filename: path.resolve('./worker_dir', '.js'),
                                    maxQueue: 2,
                                    maxThreads: 2
                                });
                                promiseWorker.push(worker_set_new_price.run({
                                    // port: channel.port1,
                                    // starttime: start,
                                    userListItems: userListItems
                                },
                                    //  {transferList: [channel.port1]}
                                ).then((message) => {
                                    console.log(message);

                                }).catch(e => {
                                    console.log(e);
                                }));

                            };

                            if (await clientRedis.exists(`average_price_${item.sell.data.properties.name}`)) {
                                i++
                                const price = await await clientRedis.get(`average_price_${item.sell.data.properties.name}`);
                                console.log(price);

                                // инициализируем воркер на покупку


                            } else if (await clientRedis.exists(`worker_isWork_${item.sell.data.properties.name}`)) {
                                i++
                                // проверяем работает какой-либо воркер на сбором для такой карточки
                                console.log('Worker уже создан для такой задачи');

                            } else {
                                i++

                                if (itemsArray.length >= 25 || i == res.data.result.length) {

                                    if (itemsArray.length != 0) {
                                        console.log('Создаем воркер itemsArray.length = ' + itemsArray.length);
                                        promiseWorker.push(worker_get_items_for_name.run({
                                            // port: channel.port1,
                                            // starttime: start,
                                            itemsArray: itemsArray
                                        },
                                            //  {transferList: [channel.port1]}
                                        ).then((message) => {

                                            console.log(message);
                                            resolve()
    
                                        }).catch(e => {
                                            console.log(e);
                                            resolve()
                                        }));
                                        itemsArray.length = 0;
                                    }
                                    

                                } else {
                             
                                    if (itemsArray.length == 0 || !itemsArray.some(x => x.name == item.sell.data.properties.name)) {
                                        itemsArray.push({ name: item.sell.data.properties.name })



                                    };

                                }






                            }



                        });
                    } else {
                        console.log('Не получили список карточек');

                    }





                })

                if (index >= 9) {
                
                }
            })

        };

        helper.timeout(4000).then(async ()=> {
           return await Promise.allSettled(promiseWorker).then((r) => {
                console.log(r);
                return resolve()
            }).catch(e => {
                console.log(e);
               return resolve()
            })

        })
 
            
            
      
      
    








    })

}


module.exports = ({ port, userListItems, starttime }) => {
    return new Promise((resolve, reject) => {
        let end = new Date().getTime()
        console.log(`Start worker timestamp ${end - starttime} ms`);




        start(port, userListItems).then((res) => {
            console.log('Worker watcher_list_order end');

            resolve(res);
        }).catch(e => {
            console.log('Worker Error watcher_list_order');

            reject(e);
        })
    })
};