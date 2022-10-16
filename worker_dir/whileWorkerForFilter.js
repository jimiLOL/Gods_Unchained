
// const fs = require('fs');
const helper = require('../helper');
const apiImmutable = require('../controller/apiClass');


function start(item, port, name) {
    return new Promise(async (resolve) => {
        // let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
        // const proxyList = list.split('\n', 5000);
        // let index = proxyList.indexOf('');
        // proxyList.splice(index, 1);

        const resultFilled = [];
        const resultActive = [];
        let cursor = 'init';
        let cursorActive = null;
        let i = 0;

        const getProxy = () => new Promise((resolve, reject) => {
            port.postMessage({ get: true, worker_children_name: name });

            port.once('message', (rpc) => {

                if (rpc.get) {
                    resolve(rpc.proxy)
                }

            })
        });
        // port.postMessage({get: true, worker_children_name: name});

        const proxy = await getProxy();
        const getOnceItem = await apiImmutable.get_one_item_for_id(item.id, helper.initAgent(proxy), null).catch(() => {
            // cursor = null;
            port.postMessage({ set: true, proxy: `${proxy.host}:${proxy.port}` });

            resolve([])
        });
        port.postMessage({ set: true, proxy: `${proxy.host}:${proxy.port}` });




        try {
            while (cursor) {

                i++

                let breakVar = false;

                let proxy = await getProxy();
                let resActive = null;




                const resFilled = await apiImmutable.get_list_filled_order_for_filter_proto(getOnceItem.data.metadata.proto, helper.initAgent(proxy), cursor).catch(() => {
                    breakVar = true;
                });
                port.postMessage({ set: true, proxy: `${proxy.host}:${proxy.port}` });
                if (i < 2) {
                    proxy = await getProxy();

                    resActive = await apiImmutable.get_list_active_order_for_filter_proto(getOnceItem.data.metadata.proto, helper.initAgent(proxy), cursorActive).catch(() => {
                        breakVar = true;
                    });
                    cursorActive = resActive.data.cursor;

                    port.postMessage({ set: true, proxy: `${proxy.host}:${proxy.port}` });

                }


                // console.log('Item name ' + item.name + ' item id ' + item.id + ' item name ' + getOnceItem.data.metadata.name);

                // console.log(res.data.result[0].sell.data.properties.name);
                if (resFilled?.data?.result?.length == 0 || breakVar) {
                    break
                }


                // console.log(cursor);
                if (i >= 20) {
                    cursor = null;


                } else if (breakVar) {
                    continue
                } else {
                    cursor = resFilled.data.cursor;


                }
                if (Array.isArray(resFilled?.data?.result)) {
                    resultFilled.push(resFilled.data.result)

                    // res.data.result.forEach(item => {
                    // result.push({token_id: item.token_id})

                    // });
                    // res.data.result.splice(0, res?.data.result.length-1)


                };
                if (i < 2 && Array.isArray(resActive?.data?.result)) {
                    resultActive.push(resActive.data.result)
                }




            }
            const newArrayFilled = resultFilled.flat();
            const newArrayActive = resultFilled.flat();
            newArrayFilled.forEach((ele, i) => {
                let filter = newArrayFilled.filter(x => x.order_id == ele.order_id);
                if (filter.length > 1) {
                    newArrayFilled.splice(i, 1);

                }

            });
            newArrayActive.forEach((ele, i) => {
                let filter = newArrayActive.filter(x => x.order_id == ele.order_id);
                if (filter.length > 1) {
                    newArrayActive.splice(i, 1);

                }

            });
            // console.log('Получили историю - ' + newArrayActive.length, newArrayFilled.length);

            // const dateObject = {};
            // newArray.map(x=> {
            //     if (dateObject[helper.setDateFormatMoment(x.updated_timestamp, '1d')] == undefined) {
            //     dateObject[helper.setDateFormatMoment(x.updated_timestamp, '1d')] = []


            //     } else {
            //         dateObject[helper.setDateFormatMoment(x.updated_timestamp, '1d')].push(x)

            //     }
            // });
            // const order_count = [];
            // Object.keys(dateObject).forEach(e=> {
            //     console.log(e, dateObject[e].length);
            //     order_count.push(dateObject[e].length);
            // });
            // const maxVar = Math.max(...order_count);
            // const minVar = Math.min(...order_count);
            // Object.keys(dateObject).forEach(e=> {
            //     if (dateObject[e].length > helper.randn_bm(minVar, maxVar, 3)) {

            //     }
            // });
            // const filtered = newArray.filter(x => Number(x.buy.data.quantity) > helper.randn_bm(minVar, maxVar, 3));

            // let filterDate = newArray.filter(x=> {

            // })





            resolve({ resArray: newArrayFilled, resArrayActive: newArrayActive })


        } catch (e) {
            console.log(e);
            resolve([])


        }
    })
}


module.exports = ({ item, port, name }) => {
    return new Promise((resolve, reject) => {
        // console.log('Начинаем сбор карточек с такими же именами');
        // let startTime = new Date().getTime();
        // const promiseArray = []



        start(item, port, name).then((res) => {
            let end = new Date().getTime();
            // promiseArray.push(worker_scanPrice.run({ array_item: res.flat() }))
            // console.log(`Worker whileWorkerForFilter end timestamp ${end-startTime}`);

            // await Promise.allSettled(arrayPromise).then(() => {
            //     return resolve()
            // }).catch(e => {
            //     console.log(e);
            //     return resolve()
            // })

            resolve(res);
        }).catch(e => {
            console.log('Worker Error whileWorkerForFilter');

            reject(e);
        })
    })
};