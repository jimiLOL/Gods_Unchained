

const apiImmutable = require('../controller/apiClass');
const helper = require('../helper');
const Piscina = require('piscina');
const util = require("util");

const { utils, BigNumber } = require("ethers");

// const {BigNumber,FixedFormat,FixedNumber,formatFixed,parseFixed} = require("@ethersproject/bignumber");

const path = require('path');
// const workerWhile = new Piscina({
//     filename: path.resolve('./worker_dir', 'whileWorker.js'),
//     // maxQueue: 2,
//     maxThreads: 20
// });
const workerWhileFilter = new Piscina({
    filename: path.resolve('./worker_dir', 'whileWorkerForFilter.js'),
    // maxQueue: 2,
    maxThreads: 25
});
// const worker_scanPrice = new Piscina({
//     filename: path.resolve('./worker_dir', 'scanPrice.js'),
//     // maxQueue: 2,
//     maxThreads: 80
// });

const { MessageChannel } = require('worker_threads');
const channel = {};

function start(itemsArray, port, name) {
    process.setMaxListeners(500);
    return new Promise((resolve) => {
        const arrayPromise = [];

        const filterArray = [];
        let objectPrice;
        const getPrice = () => new Promise(async (resolve)=> {
            let rpc = {
                get_price: true,
                name_chanel: name
            }
            port.postMessage(rpc)
            while (!objectPrice) {
                await helper.timeout(20);
                console.log('Ждем новые цены...');

            }
            console.log('Получили новые цены.');
            resolve(objectPrice)
        })

        port.on('message', (rpc) => {
      
            if (rpc.get) {
                channel[rpc.worker_children_name].port2.postMessage(rpc)

            }
            if (rpc.set_price || rpc.get_price) {
                objectPrice = rpc.price;
            }

        })


        itemsArray.forEach(async item => {

            if (!filterArray.some(x => x.name == item.name)) {
                filterArray.push(item)


            };

        });
        console.log('Будет создано ' + filterArray.length + '  задач для сбора');

        filterArray.forEach(async (ele, i) => {
            const rndString = helper.makeid(5);
            channel[`workerWhile_${i}_${rndString}`] = new MessageChannel();

            arrayPromise.push(workerWhileFilter.run({ item: ele, port: channel[`workerWhile_${i}_${rndString}`].port1, name: `workerWhile_${i}_${rndString}` }, { transferList: [channel[`workerWhile_${i}_${rndString}`].port1] }).then(async resArray=> {
                if (Array.isArray(resArray) && resArray.length > 0) {
                    const priceObj = await getPrice();

                    try {
                     
                            // console.log(BigInt(resArray[0].buy.data.quantity_with_fees));
                            console.log(Number(resArray[0].buy.data.quantity_with_fees));
                            // resArray.sort((a, b) => (BigInt(a.buy.data.quantity_with_fees) < BigInt(b.buy.data.quantity_with_fees)) ? -1 : ((BigInt(a.buy.data.quantity_with_fees) > BigInt(b.buy.data.quantity_with_fees)) ? 1 : 0))
                            resArray.sort((a, b) => Number(a.buy.data.quantity_with_fees) - Number(b.buy.data.quantity_with_fees));
                            const info = {};
                            const average = {};
                            const min = {};
                            const max = {};
                            const count = {};
                            Object.keys(priceObj).forEach(price=> {
                             
                                // console.log('Расчет средней для ' + priceObj[price].symbol);
                                average[priceObj[price].symbol] = BigNumber.from(0);
                                min[priceObj[price].symbol] = 0;
                                max[priceObj[price].symbol] = 0;
                                count[priceObj[price].symbol] = 0;
                                const allERCPrice = resArray.filter(x=> x.buy.data.token_address == priceObj[price].token_address || x.buy.type == 'ETH' && priceObj[price].symbol == 'ETH');
                                if (allERCPrice.length > 0) {
                                    const arrayPrice = [];
                                 
                                    allERCPrice.forEach(e=> {
                                        average[priceObj[price].symbol] = BigNumber.from(e.buy.data.quantity_with_fees).add(average[priceObj[price].symbol]);
                                        const priceOne = BigNumber.from(e.buy.data.quantity_with_fees);
                                        // console.log(utils.formatUnits(priceOne, priceObj[price].decimals) + ' ' + priceObj[price].symbol);
                                        // console.log(`${priceObj[price].symbol} == ${utils.formatUnits(priceOne, priceObj[price].decimals)*priceObj[price].usd} USD`);
                                        arrayPrice.push(utils.formatUnits(priceOne, priceObj[price].decimals));
                                        info['name'] = e.sell.data.properties.name;

                                    });
                                    // average[priceObj[price].symbol] = average[priceObj[price].symbol]/allERCPrice.length;
                                    average[priceObj[price].symbol] = utils.formatUnits(average[priceObj[price].symbol], priceObj[price].decimals)/allERCPrice.length;
                                    min[priceObj[price].symbol] = Math.min(...arrayPrice);
                                    max[priceObj[price].symbol] = Math.max(...arrayPrice);
                                    count[priceObj[price].symbol] = arrayPrice.length;
                                    info[priceObj[price].symbol] = {
                                        average: average[priceObj[price].symbol],
                                        min: min[priceObj[price].symbol],
                                        max: max[priceObj[price].symbol],
                                        count: count[priceObj[price].symbol],
                                        [`${priceObj[price].symbol}-USD`]: priceObj[price].usd
                                    };

                                }

                               
                              

                            })
                            Object.keys(info).forEach(ele=> {
                                if (!info.hasOwnProperty('spread_GODS-ETH')) {
                                    info['spread_GODS-ETH'] = 0;

                                }
                                if (ele == 'GODS' && info['ETH'] != undefined) {
                                    const priceEth = info['ETH'].average*priceObj['ethereum'].usd;
                                    console.log('priceEth^  ' + priceEth + ' USD');
                                    const priceGODS = info[ele].average*priceObj['gods-unchained'].usd;
                                    console.log('priceGODS^  ' + priceGODS + ' USD');

                                  const spread = (priceGODS/priceEth-1)*100;
                                  console.log('spread: ' + spread);
                                //  info['spread_GODS-ETH'] = info['spread_GODS-ETH'] + info[ele].average;


                                }
                            })
                            // resArray.forEach(e=> {
                            //     sum = Number(e.buy.data.quantity_with_fees)+Number(sum)
                            // })

                            // const sum = arr.reduce((partial_sum, a) => partial_sum + a.buy.data.quantity_with_fees, 0);
                            // console.log('Sum ' + sum);
                            // const average = Number(sum) / resArray.length;
                            console.log('Average');
                            console.log(info);
                            console.log('!=======!');
                            // расчитать надо для каждой монеты свою среднию.
    
    
                            console.log('Сделок за последние 3 дня ' + resArray.length);
                      
                       
                        // console.log(resArray[resArray.length - 1]);
                          return info


                    } catch (e) {
                        console.log(resArray[0]);

                        console.log(e);

                    }


                }
            }))


            // arrayPromise.push(workerWhile.run({ item: ele, port: channel[`workerWhile_${i}_${rndString}`].port1, name: `workerWhile_${i}_${rndString}` }, { transferList: [channel[`workerWhile_${i}_${rndString}`].port1] }).then(async (res) => {
            //     if (Array.isArray(res) && res.length > 0) {
            //         const promiseArr = [];
            //         const resArray = res.flat();

            //         for (let index = 0; index < Math.ceil(resArray.length / 50); index++) {
            //             const rndString = helper.makeid(5);

            //             channel[`worker_scanPrice_${i}_${rndString}`] = new MessageChannel();
            //             channel[`worker_scanPrice_${i}_${rndString}`].port2.on('message', (rpc) => {
            //                 // if (rpc.get && rpc.worker_children_name.includes('worker_scanPrice_')) {
            //                 //     console.log('Получили запрос от ' + rpc.worker_children_name);
            //                 //     console.log(rpc);


            //                 // }
            //                 rpc['name_chanel'] = name;


            //                 port.postMessage(rpc)

            //             });
            //             let newArray = resArray.splice(0, 50);

            //             promiseArr.push(worker_scanPrice.run({ array_item: newArray, port: channel[`worker_scanPrice_${i}_${rndString}`].port1, name: `worker_scanPrice_${i}_${rndString}` }, { transferList: [channel[`worker_scanPrice_${i}_${rndString}`].port1] }));

            //         };


            //         const priceObj = await getPrice();
                   

            //         await Promise.allSettled(promiseArr).then((res) => {

            //             const arr = [];
            //             res.forEach(element => {
            //                 arr.push(element.value);

            //             });
            //             console.log('Сортируем');
                        
            //             const resArray = arr.flat();
            //             arr.length = 0;
            //             try {
            //                 if (Array.isArray(resArray) && resArray.length > 0) {
            //                     // console.log(BigInt(resArray[0].buy.data.quantity_with_fees));
            //                     console.log(Number(resArray[0].buy.data.quantity_with_fees));
            //                     // resArray.sort((a, b) => (BigInt(a.buy.data.quantity_with_fees) < BigInt(b.buy.data.quantity_with_fees)) ? -1 : ((BigInt(a.buy.data.quantity_with_fees) > BigInt(b.buy.data.quantity_with_fees)) ? 1 : 0))
            //                     resArray.sort((a, b) => Number(a.buy.data.quantity_with_fees) - Number(b.buy.data.quantity_with_fees));
            //                     const info = {};
            //                     const average = {};
            //                     const min = {};
            //                     const max = {};
            //                     const count = {};
            //                     Object.keys(priceObj).forEach(price=> {
                                 
            //                         console.log('Расчет средней для ' + priceObj[price].symbol);
            //                         average[priceObj[price].symbol] = BigNumber.from(0);
            //                         min[priceObj[price].symbol] = 0;
            //                         max[priceObj[price].symbol] = 0;
            //                         count[priceObj[price].symbol] = 0;
            //                         const allERCPrice = resArray.filter(x=> x.buy.data.token_address == priceObj[price].token_address || x.buy.type == 'ETH' && priceObj[price].symbol == 'ETH');
            //                         if (allERCPrice.length > 0) {
            //                             const arrayPrice = [];
                                     
            //                             allERCPrice.forEach(e=> {
            //                                 average[priceObj[price].symbol] = BigNumber.from(e.buy.data.quantity_with_fees).add(average[priceObj[price].symbol]);
            //                                 const priceOne = BigNumber.from(e.buy.data.quantity_with_fees);
            //                                 console.log(utils.formatUnits(priceOne, priceObj[price].decimals) + ' ' + priceObj[price].symbol);
            //                                 console.log(`${priceObj[price].symbol} == ${utils.formatUnits(priceOne, priceObj[price].decimals)*priceObj[price].usd} USD`);
            //                                 arrayPrice.push(utils.formatUnits(priceOne, priceObj[price].decimals));
            //                                 info['name'] = e.sell.data.properties.name;
    
            //                             });
            //                             // average[priceObj[price].symbol] = average[priceObj[price].symbol]/allERCPrice.length;
            //                             average[priceObj[price].symbol] = utils.formatUnits(average[priceObj[price].symbol], priceObj[price].decimals)/allERCPrice.length;
            //                             min[priceObj[price].symbol] = Math.min(...arrayPrice);
            //                             max[priceObj[price].symbol] = Math.max(...arrayPrice);
            //                             count[priceObj[price].symbol] = arrayPrice.length;
            //                             info[priceObj[price].symbol] = {
            //                                 average: average[priceObj[price].symbol],
            //                                 min: min[priceObj[price].symbol],
            //                                 max: max[priceObj[price].symbol],
            //                                 count: count[priceObj[price].symbol],
            //                             };

            //                         }
                                  

            //                     })
            //                     // resArray.forEach(e=> {
            //                     //     sum = Number(e.buy.data.quantity_with_fees)+Number(sum)
            //                     // })
    
            //                     // const sum = arr.reduce((partial_sum, a) => partial_sum + a.buy.data.quantity_with_fees, 0);
            //                     // console.log('Sum ' + sum);
            //                     // const average = Number(sum) / resArray.length;
            //                     console.log('Average');
            //                     console.log(info);
            //                     console.log('!=======!');
            //                     // расчитать надо для каждой монеты свою среднию.
        
        
            //                     console.log('Сделок за последние 3 дня ' + resArray.length);
            //                 }
                           
            //                 // console.log(resArray[resArray.length - 1]);

            //             } catch (e) {
            //                 console.log(resArray[0]);

            //                 console.log(e);

            //             }
              
            //               return(average)

            //         });

            //     } else {
            //         return {}
            //     }


            // }));
            channel[`workerWhile_${i}_${rndString}`].port2.on('message', (rpc) => {
                // if (rpc.get && rpc.worker_children_name.includes('worker_scanPrice_')) {
                //     console.log('Получили запрос от ' + rpc.worker_children_name);
                //     console.log(rpc);


                // }
                rpc['name_chanel'] = name;


                port.postMessage(rpc)

            })




            // arrayPromise.push(worker_pull.run({ array_item: result.flat() }).then(() => {

            // }).catch(e => {
            //     console.log(e);
            // }))




        });
        // Object.keys(channel).forEach(chanel => {
        //     channel[chanel].port2.on('message', (rpc) => {
        //         if (rpc.get && rpc.worker_children_name.includes('worker_scanPrice_')) {
        //             console.log('Получили запрос от ' + rpc.worker_children_name);
        //             console.log(rpc);


        //         }
        //         rpc['name_chanel'] = name;


        //         port.postMessage(rpc)

        //     })

        // })


        helper.timeout(30000).then(async () => {
            let promiseArr = arrayPromise.filter(x => util.inspect(x).includes("pending"));
            console.log(`Worker ${name} -- Promisee array pending = ` + promiseArr.length + ' all promise ' + arrayPromise.length);
            setInterval(() => {
                let promiseArr = arrayPromise.filter(x => util.inspect(x).includes("pending"));
                console.log(promiseArr[0]);
                console.log(`Worker ${name} -- Promisee array pending = ` + promiseArr.length + ' all promise ' + arrayPromise.length);


            }, 5000);
            await Promise.allSettled(arrayPromise).then(() => {
                return resolve()
            }).catch(e => {
                console.log(e);
                return resolve()
            })
        })



    })
}






module.exports = ({ itemsArray, port, name }) => {
    return new Promise((resolve, reject) => {
        console.log('Начинаем сбор карточек с такими же именами');
        let startTime = new Date().getTime();





        start(itemsArray, port, name).then((res) => {
            let end = new Date().getTime();
            console.log(`================\nWorker getItemsinWhile ${name} end ${end - startTime}`);

            resolve(res);
        }).catch(e => {
            console.log('Worker getItemsinWhile check');

            reject(e);
        })
    })
};