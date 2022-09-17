
const { default: axios } = require("axios");
const fs = require('fs')
const helper = require('../helper');
const { init } = require('../controller/startWatcherforSalse');
const { MessageChannel } = require('worker_threads');
const channel = new MessageChannel();
const { checktProxy } = require("../get_proxyInit");

const Piscina = require('piscina');
const path = require('path');

const worker_watcher = new Piscina({
    filename: path.resolve('./worker_dir', 'watcher_list_order.js'),
    maxQueue: 2,
    maxThreads: 10
});


function start() {
    const arrayPromise = []; // прмисы глобальных воркеров

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
                const userListItems = await helper.timeout(500).then(() => init())  // получение карточек нашего кошелька
                console.log('userListItems count ' + userListItems.length);
                // setInterval(() => {
                    // i++

                    // arrayPromise.forEach(worker => {
                    //     console.log(worker);
                    // console.log(worker.destroy());

                        
                    // });
                    // console.log('start');
                    console.log('Global worker count ' + worker_watcher.threads.length);

                    if (worker_watcher.threads.length < 10) {
                        let start = new Date().getTime();

                        arrayPromise.push(worker_watcher.run({ 
                            // port: channel.port1,
                            starttime: start,
                             userListItems: userListItems }, 
                            //  {transferList: [channel.port1]}
                             ).then((message) => {
                            console.log(message);

                        }).catch(e => {
                            console.log(e);
                        }));
                    }



                // }, 60000);


                

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
}

module.exports = { start }