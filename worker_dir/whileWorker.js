
const fs = require('fs');
const helper = require('../helper');
const apiImmutable = require('../controller/apiClass');


function start(item) {
    return new Promise(async (resolve) => {
        let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
        // console.log(typeof list);
        const proxyList = list.split('\n', 3000);
        let index = proxyList.indexOf('');
        proxyList.splice(index, 1);
        helper.shuffle(proxyList);

        const result = []
        let cursor = 'init';
        let i = 0;



        try {
            while (cursor) {
                i++
                if (i > proxyList.length - 1) {
                    i = 0;
                }
                // console.log('while cycle ' + i);
                let breakVar = false;


                const res = await apiImmutable.get_assets_for_name(item.name, helper.initAgent(helper.proxyInit(proxyList[i])), cursor).catch(() => {
                    breakVar = true;
                });

                // console.log(cursor);
                if (i >= 5) {
                    cursor = null;
                    resolve(result)


                } else if (breakVar) {
                    continue
                } else {
                    cursor = res.data.cursor;


                }
                if (Array.isArray(res?.data?.result)) {
                    result.push(res.data.result)


                }




            }

        } catch (e) {
            console.log(e);
            resolve()


        }
    })
}


module.exports = ({ item }) => {
    return new Promise((resolve, reject) => {
        // console.log('Начинаем сбор карточек с такими же именами');
        let startTime = new Date().getTime();
        const promiseArray = []


        const Piscina = require('piscina');
        const path = require('path');
        const worker_scanPrice = new Piscina({
            filename: path.resolve('./worker_dir', 'scanPrice.js'),
            // maxQueue: 2,
            // maxThreads: 50
        });




        start(item).then(async (res) => {
            let end = new Date().getTime();
            // promiseArray.push(worker_scanPrice.run({ array_item: res.flat() }))
            console.log(`Worker whileWorker end timestamp ${end-startTime}`);

            // await Promise.allSettled(arrayPromise).then(() => {
            //     return resolve()
            // }).catch(e => {
            //     console.log(e);
            //     return resolve()
            // })

            // resolve(res);
        }).catch(e => {
            console.log('Worker Error whileWorker');

            reject(e);
        })
    })
};