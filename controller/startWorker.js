
const { default: axios } = require("axios");
const fs = require('fs')
const helper = require('../helper');
// const { init } = require('./startWatcherMyItems');
const { MessageChannel } = require('worker_threads');
const channel = {};
const { checktProxy } = require("../get_proxyInit");

const CronJob = require("cron").CronJob;
const CronTime = require("cron").CronTime;

const Piscina = require('piscina');
const path = require('path');

const worker_watcher = new Piscina({
    filename: path.resolve('./worker_dir', 'watcher_list_order.js'),
    maxQueue: 1,
    maxThreads: 20
});
const worker_getExchange = new Piscina({
    filename: path.resolve('./worker_dir', 'getExcheange.js'),
    // maxQueue: 2,
    // maxThreads: 50
});

const worker_createTrade = new Piscina({
    filename: path.resolve('./worker_dir', 'createTrade.js'),
    // maxQueue: 2,
    maxThreads: 1
});
const worker_createOrder = new Piscina({
    filename: path.resolve('./worker_dir', 'createOrder.js'),
    // maxQueue: 2,
    maxThreads: 1
});
const check_my_items = new Piscina({
    filename: path.resolve('./worker_dir', 'myItemsCheck.js'),
    // maxQueue: 2,
    maxThreads: 1
});
const delete_sell_items = new Piscina({
    filename: path.resolve('./worker_dir', 'startWatcherMyItems.js'),
    // maxQueue: 2,
    maxThreads: 1
});
function start() {
    // const arrayPromise = []; // прмисы глобальных воркеров
    channel['create_trade'] = new MessageChannel();
    channel['create_order'] = new MessageChannel();


    worker_createTrade.run({ port: channel['create_trade'].port1 }, { transferList: [channel['create_trade'].port1] });
    worker_createOrder.run({ port: channel['create_order'].port1 }, { transferList: [channel['create_order'].port1] });

    channel['create_trade'].port2.on('message', (rpc) => {
        // console.log('proxy_port');
        // console.log(rpc);
        // console.log(channel[rpc.name_chanel]);
        // channel[rpc.globalWorker].port2.postMessage(rpc)

    });


    channel['price_port'] = new MessageChannel();

    worker_getExchange.run({ port: channel['price_port'].port1 }, { transferList: [channel['price_port'].port1] });

    channel['price_port'].port2.on('message', (rpc) => {
        // console.log('proxy_port');
        // console.log(rpc);
        // console.log(channel[rpc.name_chanel]);
        channel[rpc.globalWorker].port2.postMessage(rpc)

    })


    getProxy().then(res => {
        fs.writeFileSync(`./proxy/proxy.txt`, '');


        let newArray = res.data.split("\n", 3000);
        console.log(newArray[0]);

        console.log(newArray.length);
        newArray.forEach(p => {
            fs.appendFile(`./proxy/proxy.txt`, `${p}\n`, function (error) {
                if (error) {
                    console.log(error);
                };
            });

        });

        setTimeout(() => {
            // const task = {};
            // let i = 0;
            checktProxy('proxy').then(async () => {
                // const userListItems = await helper.timeout(500).then(() => init())  // получение карточек нашего кошелька
                // console.log('userListItems count ' + userListItems.length);
                const startWorkersPool = () => {
                    if (worker_watcher.threads.length < 8) {
                        let start = new Date().getTime();
                        const rndString = helper.makeid(8);
                        channel[`globalWorker_${rndString}`] = new MessageChannel();


                      worker_watcher.run({ 
                            port: channel[`globalWorker_${rndString}`].port1,
                            name: `globalWorker_${rndString}`,
                            starttime: start,
                            //  userListItems: userListItems
                             }, 
                             {transferList: [channel[`globalWorker_${rndString}`].port1]}
                             ).then((message) => {
                                startWorkersPool();
                                // console.log(message);
                                // channel[message.name].port2.close();
                            //    delete channel[message.name];
                            // let end = new Date().getTime()
                            // console.log(`Глобальный воркер работал ${(end-start)/1000} sec`);

                        }).catch(e => {
                            console.log(e);
                            startWorkersPool()

                        });
                        channel[`globalWorker_${rndString}`].port2.on('message', (rpc)=> {
                            if (rpc.get_price) {
                                channel['price_port'].port2.postMessage(rpc)

                            }
                            if (rpc.init_buy) {
                                channel['create_trade'].port2.postMessage(rpc)

                            }
                            if (rpc.init_order) {
                                channel['create_order'].port2.postMessage(rpc)

                            }

                        })
                    }
                    
                };
                for (let index = 0; index < 10; index++) {
                    startWorkersPool();

                    
                }

                // setInterval(() => {
                //     // i++

                //     // arrayPromise.forEach(worker => {
                //     //     console.log(worker);
                //     // console.log(worker.destroy());

                        
                //     // });
                //     // console.log('start');
                //     // console.log('Global worker count ' + worker_watcher.threads.length);

                   



                // }, 500);


                

            });

        }, 1000);



    })
}

function getProxy() {
    return new Promise((resolve, reject) => {
        axios
            .get("https://buy.fineproxy.org/api/getproxy/?format=txt&type=http_ip&login=mix117PNQ8EL6&password=f69VJ3OM")
            .then((res) => {
                console.log("Get proxy");

                return resolve(res);
            })
            .catch((e) => {
                console.log(e);
                reject();
            });
    });
};

const startCheck = new CronJob(new Date(), async ()=> {
    delete_sell_items.run({});
    check_my_items.run({}).then(()=> {
        startCron(startCheck, 900);
    }).catch(e=> {
        console.log(e);
        startCron(startCheck, 900);


    })

});
startCron(startCheck, 2)

function startCron(cron, time) {
    let d = new Date();
    d.setSeconds(d.getSeconds() + time);
    cron.setTime(new CronTime(d));
    cron.start();
    return cron.nextDates();
};

module.exports = { start }