
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



        try {
            while (cursor) {

                i++
            
                let breakVar = false;
                port.postMessage({get: true, worker_children_name: name});

                const proxy = await getProxy();

                


                const res = await apiImmutable.get_assets_for_name(item.name, helper.initAgent(proxy), cursor).catch(() => {
                    breakVar = true;
                });
                port.postMessage({set: true, proxy: `${proxy.host}:${proxy.port}`});


                // console.log(cursor);
                if (i >= 2) {
                    cursor = null;


                } else if (breakVar) {
                    continue
                } else {
                    cursor = res.data.cursor;


                }
                if (Array.isArray(res?.data?.result)) {
                    res.data.result.forEach(item => {
                    result.push({token_id: item.token_id})
                        
                    });
                    res.data.result.splice(0, res?.data.result.length-1)


                }




            }
            resolve(result)


        } catch (e) {
            console.log(e);
            resolve()


        }
    })
}


module.exports = ({ item, port, name }) => {
    return new Promise((resolve, reject) => {
        // console.log('Начинаем сбор карточек с такими же именами');
        // let startTime = new Date().getTime();
        // const promiseArray = []


        // const Piscina = require('piscina');
        // const path = require('path');
        // const worker_scanPrice = new Piscina({
        //     filename: path.resolve('./worker_dir', 'scanPrice.js'),
        //     // maxQueue: 2,
        //     // maxThreads: 50
        // });
        // нельзя ее сюда импортирвоть это ведет к утечке памяти!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
        // надо наверное возвращать значения и оттуда уже запускать другие воркеры.




        start(item, port, name).then((res) => {
            // let end = new Date().getTime();
            // promiseArray.push(worker_scanPrice.run({ array_item: res.flat() }))
            // console.log(`Worker whileWorker end timestamp ${end-startTime}`);

            // await Promise.allSettled(arrayPromise).then(() => {
            //     return resolve()
            // }).catch(e => {
            //     console.log(e);
            //     return resolve()
            // })

            resolve(res);
        }).catch(e => {
            console.log('Worker Error whileWorker');

            reject(e);
        })
    })
};