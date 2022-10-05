// это будут глобалные Workers

const apiImmutable = require('../controller/apiClass');
const fs = require('fs');
const helper = require('../helper');
const Redis = require("ioredis");
const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");

const { utils, BigNumber } = require("ethers");


// const util = require("util");

const Piscina = require('piscina');
const path = require('path');

const { MessageChannel } = require('worker_threads');
const channel = {};

const iteration_index = 3;

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
let objectPrice;
let walletBalance = {};

// (async()=> {
//     // Очищаем базу
//     const keys_db = await clientRedis.keys('my_item_*');
//     keys_db.forEach(async element => {
//         // await clientRedis.del(element)
//         let get = await clientRedis.lrange(element, 0, -1);
//         get.forEach(ele => {
//             fs.appendFile('./keys_db.txt', `${ele}\n`, (error)=> {
//                 // console.log(error);
//             })
//         });
    
        
//     });
//     // const keys_db_s = await clientRedis.keys('average_price_*');
//     // keys_db_s.forEach(async element => {
//     //     await clientRedis.del(element)
//     //     // fs.appendFile('./keys_db_s.txt', `${element}\n`, (error)=> {
//     //     //     // console.log(error);
//     //     // })
        
//     // });
// })()
 

function start(port, name) {
    const MessageChannelInit = {};
    return new Promise(async (resolve, reject) => {


        port.on('message', (rpc) => {
            // console.log('proxy_port');
            // console.log(rpc);
            // console.log(channel[rpc.name_chanel]);
            if (rpc.internal) {
                objectPrice = rpc.price;
                walletBalance = rpc.walletBalance;
                if (!rpc.walletBalance) {
                    let newRpc = {
                        get_price: true,
                        // name_chanel: name,
                        internal: true,
                        globalWorker: name
                    };
                    port.postMessage(newRpc)
                }

            } else {
                channel[rpc.name_chanel].port2.postMessage(rpc)

            }

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
        // console.log(typeof list);
        const proxyList = list.split('\n', 5000);
        let index = proxyList.indexOf('');
        proxyList.splice(index, 1);
        helper.shuffle(proxyList);
        const promiseWorker = [];
        let rpc = {
            get_price: true,
            // name_chanel: name,
            internal: true,
            globalWorker: name
        };
        port.postMessage(rpc);
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

                        try {
                            while (!walletBalance.hasOwnProperty('ETH')) {
                                helper.timeout(20);
                                console.log('Ждем данные по балансу..');
    
                            }

                        } catch (e) {
                            console.log(e);
                            console.log(walletBalance);
                        }
                        
                     
                     

                        res.data.result.forEach(async item => {
                           
                           
                            // let s = new Date().getTime()


                            // console.log(item.sell.data.properties.name);
                            

                            


                            const average_price = await clientRedis.get(`average_price_${item.sell.data.properties.name.replace(' ', '_')}`);


                            if (average_price) {
                                i++
                                // let star = new Date().getTime();
                                const db_price = JSON.parse(average_price);




                                if (item.buy.type == 'ETH' && db_price.hasOwnProperty('ETH') && db_price.ETH.count > 30 && db_price.spread_GODS_ETH.spread > 25) {


                                    let priceItem = BigNumber.from(item.buy.data.quantity_with_fees);
                                    priceItem = utils.formatUnits(priceItem, '18');
                                    let myBalanceETH = utils.formatUnits(walletBalance.ETH, '18');
                                    // console.log(myBalanceETH);
                                    // console.log(priceItem <= myBalanceETH);
                                    let rpc = {
                                        init_buy: true,
                                        id: item.sell.data.token_id,
                                        db_price: db_price,
                                        priceItem: priceItem,
                                        item: item,
                                        event_type: ''
                                    }
                                    if (priceItem <= db_price.ETH.min && priceItem <= myBalanceETH) {
                                        rpc.event_type = 'ms click';

                                        port.postMessage(rpc)
                                        // console.log(db_price);
                                        // console.log('item id ' + item.sell.data.token_id + ' price^ ' +priceItem + ' ETH');


                                        // console.log('ms click');
                                        // fs.appendFile(`./result/result_${item.sell.data.properties.name.replace(' ', '_')}.txt`, `Event: ms click item id ${item.sell.data.token_id} price^ ${priceItem} ETH\n${average_price}\n\r`, function (error) {

                                        // })



                                        // мисклк
                                    } else if (priceItem <= db_price.ETH.average && priceItem <= myBalanceETH) {
                                        rpc.event_type = 'average click';
                                        port.postMessage(rpc)

                                        // console.log(db_price);
                                        // console.log('item id ' + item.sell.data.token_id + ' price^ ' +priceItem + ' ETH');
                                        // fs.appendFile(`./result/result_${item.sell.data.properties.name.replace(' ', '_')}.txt`, `Event: average click item id ${item.sell.data.token_id} price^ ${priceItem} ETH\n${average_price}\n\r`, function (error) {

                                        // })



                                        // console.log('average click');


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
                            // console.log(await clientRedis.llen(`my_item_${item.sell.data.properties.name}`) > 0);


                            if (await clientRedis.llen(`my_item_${item.sell.data.properties.name.replace(' ', '_')}`) > 0) {
                                console.log('============\nIt`s item is on the list\n=============');
                                i++
                                // если у нас самих имеется такая карточка - надо проверить цену и перебить ее, если она ниже нашей
                                const price = await clientRedis.lrange(`my_item_${item.sell.data.properties.name.replace(' ', '_')}`, 0, -1);
                                let priceItem = BigNumber.from(item.buy.data.quantity);
                                priceItem = utils.formatUnits(priceItem, '18');
                                let rpc = {
                                    init_order: true,
                                    // name_chanel: name,
                                    internal: true,
                                    globalWorker: name,
                                    timeout: 1000,
                                    index: 0,
                                    item_key: `my_item_${item.sell.data.properties.name.replace(' ', '_')}`
                                };
                                while (!objectPrice) {
                                    await helper.timeout(20);
                                    console.log('Ждем новые цены в watcher_list_order...');

                                }

                                let newArray = price.filter(x => {
                                    let y = JSON.parse(x);s
                                    // console.log(y);
                                    let eth = (y.price_buy * objectPrice['ethereum'].usd).toFixed(4); // за что мы купили
                                    let gods = (priceItem * objectPrice['gods-unchained'].usd).toFixed(4); // текущий лот в на бирже

                                    // console.log(y.token_id);
                                   
                                    // console.log(eth, gods, eth <= gods, y.init_order, item.buy.data.token_address == '0xccc8cb5229b0ac8069c51fd58367fd1e622afd97', y.date < new Date().getTime() - 26 * 60 * 60 * 1000);
                                    let gods_var = y?.price_gods_order ? y.price_gods_order:99999;

                                    if (item.buy.data.token_address == '0xccc8cb5229b0ac8069c51fd58367fd1e622afd97' && eth <= gods && y.init_order && gods_var > gods) {
                                        return y
                                    }

                                });
                                console.log('Отфильтровали ' + newArray.length);


                                newArray.forEach((element, index) => {
                                    let ele = JSON.parse(element);
                                    console.log(`Инициализируем create_order ${ele.token_id}`);
                                    // console.log(ele);
                                    // console.log(typeof ele);

                                    rpc['tokenId'] = ele.token_id;
                                    rpc['price'] = priceItem - 0.01;
                                    rpc.index = index;
                                    // console.log(rpc);
                                    port.postMessage(rpc)
                                    
                                
                                    // отправляем задачу в отдельный воркер котрый перебивает это все делож

                                });



 

                            };






                        });
                    } else {
                        console.log('Не получили список карточек');

                    };

                    helper.timeout(100).then(async () => {
                        if (index == iteration_index - 1) {

                            // setInterval(() => {
                            //     console.log('Progress in ' + worker_get_items_for_name.threads.length + ' workers');
                            //     let promiseArr = promiseWorker.filter(x => util.inspect(x).includes("pending"));
                            //     console.log(`Worker ${name} -- Promisee array pending = ` + promiseArr.length + ' all promise ' + promiseWorker.length);

                            // }, 4000);
                            await Promise.allSettled(promiseWorker).then((r) => {
                                // console.log('==============\nPromise end\n==============');
                                return resolve()
                            }).catch(e => {
                                console.log(e);
                                return resolve()
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

            resolve({ name: name });
        }).catch(e => {
            console.log('Worker Error watcher_list_order');

            reject(e);
        })
    })
};