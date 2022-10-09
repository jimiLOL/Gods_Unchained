
const apiImmutable = require('../controller/apiClass');
const fs = require('fs');
const helper = require('../helper');


const Redis = require("ioredis");
const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");


function get_Items_My_Wallet_and_start_watcher_workers() {
    return new Promise(async (resolve, reject) => {



        // let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
        // // console.log(typeof list);
        // const proxyList = list.split('\n', 5000);
        // helper.shuffle(proxyList);

        // const arrayResultFindForName = [];
        // const arrayPromise = []; // прмисы глобальных воркеров
        const result = [];

        await apiImmutable.get_list_my_item('0xb8F202dC3242A6b17d7Be5e2956aC2680EAf223c').then(async r => {
            try {
                // console.log(r.data.cursor.length);

                console.log('result.length ' + r.data.result.length);
                r.data.result.forEach(e=> {
                    result.push(e)

                });
    
                if (r.data.cursor.length != 0) {
                    // console.log(r.data.cursor);
                    let cursor = r.data.cursor;
                    let ini = 0;
                    while (cursor.length > 3) {
                        ini++;
                        // console.log(ini);
                        await helper.timeout(500*ini).then(async ()=> {
                            const res = await apiImmutable.get_list_my_item('0xb8F202dC3242A6b17d7Be5e2956aC2680EAf223c', cursor);
                            res.data.result.forEach(e=> {
                                result.push(e)
            
                            });
                            console.log(cursor);
                            cursor = res.data.cursor;

                        })
                 
    
    
                    }
    
                }  
                console.log(result.length);
                let i = 0;
    
                // const filterArray = [];
                const keys_db = await clientRedis.keys('my_item_*');
    
                keys_db.forEach(async (ele, index) => {
                    const itemList = await clientRedis.lrange(ele, 0, -1);
                    itemList.forEach(async item => {
                        let item_js = JSON.parse(item);
                        let filter = result.filter(x => x.token_id == item_js.token_id && item_js.init_order && item_js.date < new Date().getTime()-30*60*1000);
                        if (filter.length == 0) {
                            console.log('Хотим удалить id ' + item_js.token_id);
                        //    const result =  await clientRedis.lrem(ele, 1, item);
                        //    console.log(result);
                        // 
    
                        };
                        i++
    
                    });
                    if (keys_db.length == i) {
                        return resolve()
    
    
                    }
    
    
    
                });

            } catch (e) {
                console.log(e);
            }
           

            // r.data.result.forEach(async e => {
            //     //    const filter = filterArray.filter(x=> x.metadata.name == e.metadata.name);
            //     if (!filterArray.some(x => x.metadata.name == e.metadata.name)) {
            //         filterArray.push(e);
            //         // await clientRedis.set(`my_item_${e.name.replace()}`, ) 


            //     };
            //     i++
            //     if (r.data.result.length == i) {
            //         console.log(filterArray.length);

            //         return resolve(filterArray)


            //     }


            // })
            // filterArray.forEach(async ele => {
            //     // console.log(ele);
            //     const result = []
            //     let cursor = 'init';

            //     try {
            //         while (cursor) {
            //             i++
            //             if (i> proxyList.length-1) {
            //                 i = 0;
            //             }
            //             console.log(i);


            //         const res = await apiImmutable.get_assets_for_name(ele.name, helper.initAgent(helper.proxyInit(proxyList[i])), cursor);
            //         console.log(cursor);
            //         if (i >= 20) {
            //             cursor = null;

            //         } else {
            //         cursor = res.data.cursor;


            //         }
            //         if (Array.isArray(res?.data?.result)) {
            //         result.push(res.data.result)


            //         }




            //         }

            //     } catch (e) {
            //         console.log(e);

            //     }



            //     arrayPromise.push(worker_pull.run({ array_item: result.flat() }).then(() => {

            //     }).catch(e => {
            //         console.log(e);
            //     }))




            // });

        }).catch(e => {
            console.log(e.message);
            reject()
        });
        // await Promise.allSettled(arrayPromise).then(() => {
        //       resolve()
        // }).catch(e => {
        //     console.log(e);
        //       resolve()
        // })





    }).catch(e => {
        console.log(e);
    })

}

function init() {
    return new Promise((resolve) => get_Items_My_Wallet_and_start_watcher_workers().then((res) => resolve(res)).catch(e => []))
    // return await get_Items_My_Wallet_and_start_watcher_workers() 
}
// module.exports = { init }

module.exports = () => {
    return new Promise((resolve, reject) => {
        let end = new Date().getTime()




        init().then((res) => {
            console.log('Worker startWatcherMyItems end');

            resolve(res);
        }).catch(e => {
            console.log('Worker Error startWatcherMyItems');

            reject(e);
        })
    })
};



 