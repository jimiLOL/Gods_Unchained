const apiImmutable = require('./apiClass');
const fs = require('fs');
const helper = require('../helper');
const { rejects } = require('assert');
// этот контроллер сканирует все похожие карточки. не оптимальный алгоритм!


// const Piscina = require('piscina');
// const path = require('path');
// const worker_pull = new Piscina({
//     filename: path.resolve('./worker_dir', 'scanPrice.js'),
//     maxQueue: 50,
//     maxThreads: 100
// });


function get_Items_My_Wallet_and_start_watcher_workers() {
    return new Promise(async (resolve, reject) => {



        let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
        console.log(typeof list);
        const proxyList = list.split('\n', 5000);
        helper.shuffle(proxyList);

        // const arrayResultFindForName = [];
        // const arrayPromise = []; // прмисы глобальных воркеров
       
        await apiImmutable.get_list_my_item('0xb8F202dC3242A6b17d7Be5e2956aC2680EAf223c',  helper.initAgent(helper.proxyInit(proxyList[helper.getRandomInt(1, proxyList.length-1)]))).then(r => {
            // console.log(r.data.result);
              let i = 0;

            const filterArray = [];
            r.data.result.forEach(e=> {
            //    const filter = filterArray.filter(x=> x.metadata.name == e.metadata.name);
               if (!filterArray.some(x=> x.metadata.name == e.metadata.name)) {
                filterArray.push(e)


               };
               i++
               if (r.data.result.length == i) {
                   console.log(filterArray.length);

                   return resolve(filterArray)


               }
                

            })
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
           
        }).catch(e=> {
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
    return new Promise((resolve)=> get_Items_My_Wallet_and_start_watcher_workers().then((res)=> resolve(res)).catch(e=> []) )
    console.log('init');
    // return await get_Items_My_Wallet_and_start_watcher_workers() 
}
module.exports = { init }