const apiImmutable = require('../controller/apiClass');
const fs = require('fs');
const helper = require('../helper');
const Redis = require("ioredis");
const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");

const { utils, BigNumber } = require("ethers");


const util = require("util");

const Piscina = require('piscina');
const path = require('path');

const { MessageChannel } = require('worker_threads');
const channel = {};

const iteration_index = 10;

const worker_get_items_for_name = new Piscina({
    filename: path.resolve('./worker_dir', 'getItemsinWhile.js'),
    maxQueue: 8,
    maxThreads: 40
});
const worker_proxy = new Piscina({
    filename: path.resolve('./worker_dir', 'getProxy.js'),
    // maxQueue: 2,
    // maxThreads: 50
});
 

// это будут глобалные Workers

function start(port, name) {
    const MessageChannelInit = {};
    return new Promise(async (resolve, reject) => {
        

        port.on('message', (rpc) => {
            // console.log('proxy_port');
            // console.log(rpc);
            // console.log(channel[rpc.name_chanel]);
            channel[rpc.name_chanel].port2.postMessage(rpc)

        })

        channel['proxy_port'] = new MessageChannel();
        worker_proxy.run({ port: channel['proxy_port'].port1 }, { transferList: [channel['proxy_port'].port1] });
        channel['proxy_port'].port2.on('message', (rpc) => {
            // console.log('proxy_port');
            // console.log(rpc);
            // console.log(channel[rpc.name_chanel]);
            channel[rpc.name_chanel].port2.postMessage(rpc)

        })
        let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
        console.log(typeof list);
        const proxyList = list.split('\n', 5000);
        let index = proxyList.indexOf('');
        proxyList.splice(index, 1);
        helper.shuffle(proxyList);
        const promiseWorker = [];
        for (let index = 0; index < iteration_index; index++) {
            helper.timeout(100 * index).then(() => {

                apiImmutable.get_list_order(helper.initAgent(helper.proxyInit(proxyList[helper.getRandomInt(1, proxyList.length - 1)]))).then((res) => {
                    // console.log('res.data.result.length');
                    // console.log(res.data.result.length);
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
                            let s = new Date().getTime()


                            // console.log(item.sell.data.properties.name);
                            if (await clientRedis.exists(`my_item_${item.sell.data.properties.name}`)) {
                                i++
                                // если у нас самих имеется такая карточка - надо проверить цену и перебить ее, если она ниже нашей
                                const price = await await clientRedis.get(`my_item_${item.sell.data.properties.name.replace(' ', '_')}`);
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
                                    userListItems: JSON.parse(price)
                                },
                                    //  {transferList: [channel.port1]}
                                ).then((message) => {
                                    console.log(message);

                                }).catch(e => {
                                    console.log(e);
                                }));

                            };
                            
                            
                            const average_price = await await clientRedis.get(`average_price_${item.sell.data.properties.name.replace(' ', '_')}`);


                            if (average_price) {
                                i++
                                // let star = new Date().getTime();
                                const db_price = JSON.parse(average_price);


                                if (item.buy.type == 'ETH' && db_price.hasOwnProperty('ETH') && db_price.ETH.count > 30 && db_price.spread_GODS_ETH.spread > 10) {
                                    

                                    let priceItem = BigNumber.from(item.buy.data.quantity_with_fees);
                                    priceItem = utils.formatUnits(priceItem, '18');
                                    if (priceItem <= db_price.ETH.min) {
                                    console.log(db_price);
                                    console.log('item id ' + item.sell.data.token_id + ' price^ ' +priceItem + ' ETH');


                                    console.log('ms click');
                                    fs.appendFile(`./result/result_${item.sell.data.properties.name.replace(' ', '_')}.txt`, `Event: ms click item id ${item.sell.data.token_id} price^ ${priceItem} ETH\n${db_price}`, function (error) {
                                        
                                    })

                                  

                                        // мисклк
                                    } else if (priceItem <= db_price.ETH.average) {
                                    console.log(db_price);
                                    console.log('item id ' + item.sell.data.token_id + ' price^ ' +priceItem + ' ETH');
                                    fs.appendFile(`./result/result_${item.sell.data.properties.name.replace(' ', '_')}.txt`, `Event: average click item id ${item.sell.data.token_id} price^ ${priceItem} ETH\n${db_price}`, function (error) {
                                        
                                    })



                                    console.log('average click');


                                    }
    
                                    // console.log(db_price);
                                    // let end = new Date().getTime();
                                    // console.log(`Рассчеты заняли ${end-star}`);
    
                                    // инициализируем воркер на покупку

                                }
                             


                            } else if (await clientRedis.exists(`worker_isWork_${item.sell.data.properties.name.replace(' ', '_')}`)) {
                                i++
                                // проверяем работает какой-либо воркер на сбором для такой карточки
                                // console.log('Worker уже создан для такой задачи');

                            } else {
                                i++

                                if (itemsArray.length >= 25 || i == res.data.result.length) {

                                    if (itemsArray.length != 0) {
                                        console.log('Создаем воркер itemsArray.length = ' + itemsArray.length);
                                        console.log(itemsArray[0].name);
                                        console.log('in work ' + worker_get_items_for_name.threads.length + ' workers');
                                        const newArray = itemsArray.slice(0, itemsArray.length - 1);
                                        itemsArray.splice(0, itemsArray.length - 1);
                                        const rndString = helper.makeid(5);
                                        channel[`worker_${i}_${rndString}`] = new MessageChannel();
                                        // MessageChannelInit[`worker_${i}`] = {init: true, port2: channel[`worker_${i}`].port2}

                                        promiseWorker.push(worker_get_items_for_name.run({
                                            port: channel[`worker_${i}_${rndString}`].port1,
                                            name: `worker_${i}_${rndString}`,
                                            itemsArray: newArray
                                        }, { transferList: [channel[`worker_${i}_${rndString}`].port1] }
                                        ));
                                        channel[`worker_${i}_${rndString}`].port2.on('message', (rpc) => {
                                            // console.log('Получили запрос в watcher_list_order');

                                            // console.log(rpc);
                                            if (rpc.get || rpc.set) {
                                                channel['proxy_port'].port2.postMessage(rpc)

                                            };
                                            if (rpc.get_price) {
                                                rpc['globalWorker'] = name;
                                                port.postMessage(rpc);

                                            };


                                        })
                                        // itemsArray.length = 0;
                                    }


                                } else {

                                    if (itemsArray.length == 0 || !itemsArray.some(x => x.name == item.sell.data.properties.name)) {
                                        itemsArray.push({ name: item.sell.data.properties.name, id: item.sell.data.token_id })



                                    };

                                }






                            };


                            



                        });
                    } else {
                        console.log('Не получили список карточек');

                    };

                    helper.timeout(100).then(async ()=> {
                        if (index == iteration_index-1) {
                             
                            setInterval(() => {
                                console.log('Progress in ' + worker_get_items_for_name.threads.length + ' workers');
                                let promiseArr = promiseWorker.filter(x => util.inspect(x).includes("pending"));
                                console.log(`Worker ${name} -- Promisee array pending = ` + promiseArr.length + ' all promise ' + promiseWorker.length);

                            }, 4000);
                            await Promise.allSettled(promiseWorker).then((r) => {
                                console.log('==============\nPromise end\n==============');
                                resolve()
                            }).catch(e => {
                                console.log(e);
                                resolve()
                            })

                      

                    }
                    })



                  

                }).catch(e => {
                    console.log(e);
                })


            })

        };

        //  helper.timeout(1000).then(async () => {
        //     setInterval(() => {
        //         console.log('Progress in ' + worker_get_items_for_name.threads.length + ' workers');

        //     }, 10000);
        //     await Promise.allSettled(promiseWorker).then((r) => {
        //         console.log('=======\nPromise end\n==============');
        //         resolve()
        //     }).catch(e => {
        //         console.log(e);
        //         resolve()
        //     })

        // })














    })

}


module.exports = ({ port, starttime, name }) => {
    return new Promise((resolve, reject) => {
        let end = new Date().getTime()
        console.log(`Start worker timestamp ${end - starttime} ms`);




        start(port, name).then((res) => {
            console.log('Worker watcher_list_order end');
            // port.close()

            resolve({name: name});
        }).catch(e => {
            console.log('Worker Error watcher_list_order');

            reject(e);
        })
    })
};