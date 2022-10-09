
// const fs = require('fs');
const helper = require('../helper');
const apiImmutable = require('../controller/apiClass');

 
function start(item, port, name) {
    return new Promise(async (resolve) => {
        // let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
        // const proxyList = list.split('\n', 5000);
        // let index = proxyList.indexOf('');
        // proxyList.splice(index, 1);

        const result = []
        let cursor = 'init';
        let i = 0;

        const getProxy = () => new Promise((resolve, reject)=> {
            port.once('message', (rpc)=> {
            
                if (rpc.get) {
                    resolve(rpc.proxy)
                }
                
            })
        });
        port.postMessage({get: true, worker_children_name: name});

        const proxy = await getProxy();
        const getOnceItem = await apiImmutable.get_one_item_for_id(item.id, helper.initAgent(proxy), null).catch(() => {
            cursor = null;
            port.postMessage({set: true, proxy: `${proxy.host}:${proxy.port}`});

            resolve([])
        });
        port.postMessage({set: true, proxy: `${proxy.host}:${proxy.port}`});




        try {
            while (cursor) {

                i++
            
                let breakVar = false;
                port.postMessage({get: true, worker_children_name: name});

                const proxy = await getProxy();

                


                const res = await apiImmutable.get_list_order_for_filter_proto(getOnceItem.data.metadata.proto, helper.initAgent(proxy), cursor).catch(() => {
                    breakVar = true;
                });
                port.postMessage({set: true, proxy: `${proxy.host}:${proxy.port}`});
                // console.log('Item name ' + item.name + ' item id ' + item.id + ' item name ' + getOnceItem.data.metadata.name);

                // console.log(res.data.result[0].sell.data.properties.name);
                if (res?.data?.result?.length == 0 || breakVar) {
                    break
                }


                // console.log(cursor);
                if (i >= 20) {
                    cursor = null;


                } else if (breakVar) {
                    continue
                } else {
                    cursor = res.data.cursor;


                }
                if (Array.isArray(res?.data?.result)) {
                    result.push(res.data.result)

                    // res.data.result.forEach(item => {
                    // result.push({token_id: item.token_id})
                        
                    // });
                    // res.data.result.splice(0, res?.data.result.length-1)


                }




            }
            const newArray = result.flat();
            // console.log('Получили историю - ' + newArray.length);
            newArray.forEach((ele, i) => {
                let filter = newArray.filter(x=> x.order_id == ele.order_id);
                if (filter.length > 1) {
                    newArray.splice(i, 1);

                }
                
            });
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
        




            resolve(newArray)


        } catch (e) {
            console.log(e);
            resolve([])


        }
    })
}


module.exports = ({ item, port, name }) => {
    return new Promise((resolve, reject) => {
        // console.log('Начинаем сбор карточек с такими же именами');
        let startTime = new Date().getTime();
        // const promiseArray = []

 

        start(item, port, name).then((res) => {
            let end = new Date().getTime();
            // promiseArray.push(worker_scanPrice.run({ array_item: res.flat() }))
            console.log(`Worker whileWorkerForFilter end timestamp ${end-startTime}`);

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