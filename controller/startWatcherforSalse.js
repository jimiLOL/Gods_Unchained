const apiImmutable = require('./apiClass');
const fs = require('fs');
const helper = require('../helper');


const Piscina = require('piscina');
const path = require('path');
const worker_pull = new Piscina({
    filename: path.resolve('./worker_dir', 'watcherPrice.js'),
    maxQueue: 50,
    maxThreads: 100
});

function get_Items_My_Wallet_and_start_watcher_workers() {
    return new Promise(async (resolve) => {



        let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
        console.log(typeof list);
        const proxyList = list.split('\n', 3000);
        helper.shuffle(proxyList);

        // const arrayResultFindForName = [];
        const arrayPromise = [];
       
        await apiImmutable.get_list_my_item('0xb8F202dC3242A6b17d7Be5e2956aC2680EAf223c',  helper.initAgent(helper.proxyInit(proxyList[helper.getRandomInt(1, proxyList.length-1)]))).then(r => {
            // console.log(r.data.result);
            const filterArray = [];
            r.data.result.forEach(e=> {
            //    const filter = filterArray.filter(x=> x.metadata.name == e.metadata.name);
               if (!filterArray.some(x=> x.metadata.name == e.metadata.name)) {
                filterArray.push(e)


               }
                

            })
            let i = 0;
            console.log(filterArray.length);
            // process.exit(0)
            filterArray.forEach(async ele => {
                // console.log(ele);
                
                const res = await apiImmutable.get_assets_for_name(ele.name, helper.initAgent(helper.proxyInit(proxyList[i])));
                console.log(res.data.result.length);
                // console.log(res.data.result[0]);
                arrayPromise.push(worker_pull.run({ array_item: res.data.result }).then(() => {

                }).catch(e => {
                    console.log(e);
                }))
                i++
 



            });
           
        }).catch(e=> {
            console.log(e.message);
        })
        await Promise.allSettled(arrayPromise).then(() => {
              resolve()
        }).catch(e => {
            console.log(e);
              resolve()
        })





    }).catch(e => {
        console.log(e);
    })

}

function init() {
    console.log('init');
    get_Items_My_Wallet_and_start_watcher_workers().then(arr => {
        console.log('arr');

    })
}
module.exports = { init }