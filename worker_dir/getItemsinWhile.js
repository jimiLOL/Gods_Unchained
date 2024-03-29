

// const apiImmutable = require('../controller/apiClass');
const helper = require('../helper');
const Piscina = require('piscina');
const util = require("util");

const Redis = require("ioredis");
const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");

const { utils, BigNumber } = require("ethers");
const { AbortController } = require('abort-controller');
const signal = {};

const path = require('path');

const workerWhileFilter = new Piscina({
    filename: path.resolve('./worker_dir', 'whileWorkerForFilter.js'),
    // maxQueue: 2,
    maxThreads: 25
});


const { MessageChannel } = require('worker_threads');
const channel = {};

function start(itemsArray, port, name) {
    process.setMaxListeners(500);
    return new Promise((resolve) => {
        const arrayPromise = [];

        const filterArray = [];
        let objectPrice;
        const getPrice = () => new Promise(async (resolve) => {
            let rpc = {
                get_price: true,
                name_chanel: name
            }
            port.postMessage(rpc)
            let i = 0;
            while (!objectPrice) {
                i++
                if (i > 20) {
                    port.postMessage(rpc);
                    i = 0;


                }
                await helper.timeout(20);
                // console.log('Ждем новые цены...');

            }
            // console.log('Получили новые цены.');
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
        if (filterArray.length == 0) {
              resolve()
        }
        // console.log('Будет создано ' + filterArray.length + '  задач для сбора');

        filterArray.forEach(async (ele, i) => {
            const rndString = helper.makeid(5);
            channel[`workerWhile_${i}_${rndString}`] = new MessageChannel();
            await clientRedis.set(`worker_isWork_${ele.name.replace(' ', '_')}`, 'work', 'ex', 30);
            signal[`workerWhile_${i}_${rndString}`] = new AbortController();

            arrayPromise.push(workerWhileFilter.run({ item: ele, port: channel[`workerWhile_${i}_${rndString}`].port1, name: `workerWhile_${i}_${rndString}` }, {signal: signal[`workerWhile_${i}_${rndString}`].signal, transferList: [channel[`workerWhile_${i}_${rndString}`].port1] }).then(async ({resArray, resArrayActive}) => {
                if (Array.isArray(resArray) && resArray.length > 10 && Array.isArray(resArrayActive)) {
                    // console.log('resArray.length ' + resArray.length);
                    signal[`workerWhile_${i}_${rndString}`].abort();
                    for (let index = 0; index < 5; index++) {
                        resArray.forEach((ele, i) => {
                            let filter = resArray.filter(x => x.order_id == ele.order_id);
                            if (filter.length > 1) {

                                resArray.splice(i, 1);

                            }

                        });
                        // console.log('resArray.length ' + resArray.length);

                    };
                    for (let index = 0; index < 5; index++) {
                        resArrayActive.forEach((ele, i) => {
                            let filter = resArrayActive.filter(x => x.order_id == ele.order_id);
                            if (filter.length > 1) {

                                resArrayActive.splice(i, 1);

                            }

                        });

                    };





                    const priceObj = await getPrice();

                    try {

                        // console.log(BigInt(resArray[0].buy.data.quantity_with_fees));
                        // console.log(Number(resArray[0].buy.data.quantity_with_fees));
                        // resArray.sort((a, b) => (BigInt(a.buy.data.quantity_with_fees) < BigInt(b.buy.data.quantity_with_fees)) ? -1 : ((BigInt(a.buy.data.quantity_with_fees) > BigInt(b.buy.data.quantity_with_fees)) ? 1 : 0))
                        resArray.sort((a, b) => Number(a.buy.data.quantity) - Number(b.buy.data.quantity));
                        resArrayActive.sort((a, b) => Number(a.buy.data.quantity) - Number(b.buy.data.quantity));
                        const info = {};
                        const average = {};
                        const average_big = {};
                        const min = {};
                        const max = {};
                        const count = {};
                        const infoActive = {};
                        const averageActive = {};
                        const average_bigActive = {};
                        const minActive = {};
                        const maxActive = {};
                        const countActive = {};






                        
                        Object.keys(priceObj).forEach(price => {

                            // console.log('Расчет средней для ' + priceObj[price].symbol);
                            average[priceObj[price].symbol] = 0;
                            average_big[priceObj[price].symbol] = 0;
                            min[priceObj[price].symbol] = 0;
                            max[priceObj[price].symbol] = 0;
                            count[priceObj[price].symbol] = 0;

                            averageActive[priceObj[price].symbol] = 0;
                            average_bigActive[priceObj[price].symbol] = 0;
                            minActive[priceObj[price].symbol] = 0;
                            maxActive[priceObj[price].symbol] = 0;
                            countActive[priceObj[price].symbol] = 0;


                            const allERCPrice = resArray.filter(x => x.buy.data.token_address == priceObj[price].token_address || x.buy.type == 'ETH' && priceObj[price].symbol == 'ETH');
                            const allERCPriceActive = resArrayActive.filter(x => x.buy.data.token_address == priceObj[price].token_address || x.buy.type == 'ETH' && priceObj[price].symbol == 'ETH');

                            const priceArray = [];
                            allERCPrice.forEach(x => {
                                priceArray.push(Number(x.buy.data.quantity));

                            });
                            const priceArrayActive = [];


                            allERCPriceActive.forEach(x => {
                                priceArrayActive.push(Number(x.buy.data.quantity));

                            });
                            const maxVar = Math.max(...priceArray);
                            const minVar = Math.min(...priceArray);
                            // const maxVarActive = Math.min(...priceArrayActive);
                            // const minVarActive = Math.min(...priceArrayActive);

                            const sum = priceArray.reduce((partial_sum, a) => partial_sum + a, 0);

                            const filtered = allERCPrice.filter(x => {
                                if (allERCPrice.length <= 90) {
                                    return x

                                } else {
                                    let f = (x.buy.data.quantity / sum) * 100;
                                    if (f < (helper.randn_bm(minVar, maxVar, 3) / sum) * 100) {
                                        return x
                                    }

                                }



                            });
                            // console.log('История после фильтрации по среднему отклонению "3" - ' + filtered.length);
                            if (allERCPriceActive.length > 0) {
                                const arrayPriceActive = [];

                                allERCPriceActive.forEach(e => {




                                    averageActive[priceObj[price].symbol] = Number(e.buy.data.quantity) + averageActive[priceObj[price].symbol];
                                    average_bigActive[priceObj[price].symbol] = Number(e.buy.data.quantity) + average_bigActive[priceObj[price].symbol];
                                    // const priceOne = BigNumber.from(e.buy.data.quantity);

                                    // console.log(utils.formatUnits(priceOne, priceObj[price].decimals) + ' ' + priceObj[price].symbol);
                                    // console.log(`${priceObj[price].symbol} == ${utils.formatUnits(priceOne, priceObj[price].decimals)*priceObj[price].usd} USD`);
                                    // arrayPrice.push(utils.formatUnits(priceOne, priceObj[price].decimals));
                                    arrayPriceActive.push(Number(e.buy.data.quantity));

                                });
                                averageActive[priceObj[price].symbol] = averageActive[priceObj[price].symbol] / allERCPriceActive.length;
                                let bg = BigNumber.from(String(averageActive[priceObj[price].symbol].toFixed()));
                                averageActive[priceObj[price].symbol] = utils.formatUnits(bg, priceObj[price].decimals);
                                minActive[priceObj[price].symbol] = BigNumber.from(String(helper.getMin(arrayPriceActive)));
                                maxActive[priceObj[price].symbol] = BigNumber.from(String(helper.getMax(arrayPriceActive)));
                                // console.log('arrayPrice.length ' + arrayPrice.length);
                                countActive[priceObj[price].symbol] = arrayPriceActive.length;
                                infoActive[priceObj[price].symbol] = {
                                    average_active: Number(averageActive[priceObj[price].symbol]).toFixed(8),
                                    average_big_active: average_bigActive[priceObj[price].symbol] / allERCPriceActive.length,
                                    min_active: Number(utils.formatUnits(minActive[priceObj[price].symbol], priceObj[price].decimals)).toFixed(8),
                                    max_active: Number(utils.formatUnits(maxActive[priceObj[price].symbol], priceObj[price].decimals)).toFixed(8),
                                    count_active: countActive[priceObj[price].symbol],
                                };


                            }

                            if (filtered.length > 0) {
                                const arrayPrice = [];
                                info['name'] = filtered[0].sell.data.properties.name;


                                filtered.forEach(e => {




                                    average[priceObj[price].symbol] = Number(e.buy.data.quantity) + average[priceObj[price].symbol];
                                    average_big[priceObj[price].symbol] = Number(e.buy.data.quantity) + average_big[priceObj[price].symbol];
                                    // const priceOne = BigNumber.from(e.buy.data.quantity);

                                    // console.log(utils.formatUnits(priceOne, priceObj[price].decimals) + ' ' + priceObj[price].symbol);
                                    // console.log(`${priceObj[price].symbol} == ${utils.formatUnits(priceOne, priceObj[price].decimals)*priceObj[price].usd} USD`);
                                    // arrayPrice.push(utils.formatUnits(priceOne, priceObj[price].decimals));
                                    arrayPrice.push(Number(e.buy.data.quantity));

                                });
                                average[priceObj[price].symbol] = average[priceObj[price].symbol] / filtered.length;
                                let bg = BigNumber.from(String(average[priceObj[price].symbol].toFixed()));
                                // let bg_mod = BigNumber.from(bg).mod(BigNumber.from(String(allERCPrice.length)));
                                // console.log(bg);
                                average[priceObj[price].symbol] = utils.formatUnits(bg, priceObj[price].decimals);
                                min[priceObj[price].symbol] = BigNumber.from(String(helper.getMin(arrayPrice)));
                                max[priceObj[price].symbol] = BigNumber.from(String(helper.getMax(arrayPrice)));
                                // console.log('arrayPrice.length ' + arrayPrice.length);
                                count[priceObj[price].symbol] = arrayPrice.length;
                                let obj = {
                                    average: Number(average[priceObj[price].symbol]).toFixed(8),
                                    average_big: average_big[priceObj[price].symbol] / filtered.length,
                                    min: Number(utils.formatUnits(min[priceObj[price].symbol], priceObj[price].decimals)).toFixed(8),
                                    max: Number(utils.formatUnits(max[priceObj[price].symbol], priceObj[price].decimals)).toFixed(8),
                                    count: count[priceObj[price].symbol],
                                    [`${priceObj[price].symbol}-USD`]: priceObj[price].usd,
                                    token_address: priceObj[price].token_address
                                };
                                info[priceObj[price].symbol] = Object.assign({}, obj, infoActive[priceObj[price].symbol])
                                
                                // info[priceObj[price].symbol] = {
                                //     average: Number(average[priceObj[price].symbol]).toFixed(8),
                                //     average_big: average_big[priceObj[price].symbol] / filtered.length,
                                //     min: Number(utils.formatUnits(min[priceObj[price].symbol], priceObj[price].decimals)).toFixed(8),
                                //     max: Number(utils.formatUnits(max[priceObj[price].symbol], priceObj[price].decimals)).toFixed(8),
                                //     count: count[priceObj[price].symbol],
                                //     [`${priceObj[price].symbol}-USD`]: priceObj[price].usd,
                                //     token_address: priceObj[price].token_address
                                // };
                                // console.log(resArray[0].sell.data.properties.name);

                                // console.log(info[priceObj[price].symbol]);

                            }




                        })
                        Object.keys(info).forEach(ele => {
                            if (!info.hasOwnProperty('spread_GODS_ETH')) {
                                info['spread_GODS_ETH'] = 0;

                            }
                            if (ele == 'GODS' && info['ETH'] != undefined) {
                                const priceEth = info['ETH'].average * priceObj['ethereum'].usd;
                                // console.log('priceEth^  ' + priceEth + ' USD');
                                const priceGODS = info[ele].average * priceObj['gods-unchained'].usd;
                                // console.log('priceGODS^  ' + priceGODS + ' USD');

                                info['spread_GODS_ETH'] = {
                                    spread: (priceGODS / priceEth - 1) * 100,
                                    priceEth_USD: priceEth,
                                    priceGODS_USD: priceGODS

                                };
                                //  info['spread_GODS-ETH'] = info['spread_GODS-ETH'] + info[ele].average;


                            }
                        })

                        // console.log('Average');
                        // console.log(info['spread_GODS_ETH']);
                        if (info.name) {
                            await clientRedis.set(`average_price_${info.name.replace(' ', '_')}`, JSON.stringify(info), 'ex', 45000);

                        }
                        // console.log('!=======!');
                        // расчитать надо для каждой монеты свою среднию.


                        // console.log('Сделок за последние 3 дня ' + resArray.length);


                        // console.log(resArray[resArray.length - 1]);
                        return info


                    } catch (e) {
                        console.log(resArray[0]);
                        console.log(resArray[0].sell.data);

                        console.log(e);
                        return 'zero'

                    }


                } else {
                    await clientRedis.set(`worker_isWork_${ele.name.replace(' ', '_')}`, 'work', 'ex', 900);
                    return 'zero'

                }
            }));




            channel[`workerWhile_${i}_${rndString}`].port2.on('message', (rpc) => {

                rpc['name_chanel'] = name;


                port.postMessage(rpc)

            });










        });

        helper.timeout(1000).then(async () => {

            let promiseArr = arrayPromise.filter(x => util.inspect(x).includes("pending"));
            // console.log(`Worker ${name} -- Promisee array pending = ` + promiseArr.length + ' all promise ' + arrayPromise.length);
            // setInterval(() => {
            //     let promiseArr = arrayPromise.filter(x => util.inspect(x).includes("pending"));
            //     console.log(promiseArr[0]);
            //     console.log(`Worker ${name} -- Promisee array pending = ` + promiseArr.length + ' all promise ' + arrayPromise.length);


            // }, 5000);
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
        // console.log('Начинаем сбор карточек с такими же именами');
        // let startTime = new Date().getTime();





        start(itemsArray, port, name).then((res) => {
            // let end = new Date().getTime();
            // console.log(`================\nWorker getItemsinWhile ${name} end ${end - startTime} ms`);

            resolve(res);
        }).catch(e => {
            console.log('Worker getItemsinWhile check');

            reject(e);
        })
    })
};