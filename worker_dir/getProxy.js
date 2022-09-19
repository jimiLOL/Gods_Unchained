



function start(port) {
    const fs = require('fs');
const helper = require('../helper');


    let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
    // console.log(typeof list);
    const proxyList = list.split('\n', 5000);
    let index = proxyList.indexOf('');
    proxyList.splice(index, 1);
    helper.shuffle(proxyList)

    return new Promise((resolve) => {
        port.on('message', async (rpc) => {
            // console.log(rpc);
            if (rpc.set) {
                proxyList.push(rpc.proxy)


            }
            if (rpc.get) {
                while (proxyList.length == 0) {
                    await helper.timeout(50);
                    console.log('Ждем прокси...');

                }
                // const rndNumber = helper.getRandomInt(1, proxyList.length-1);
                // const rndNumber = helper.getRandomInt(1, proxyList.length-1);
                const proxy = helper.proxyInit(proxyList.shift());
                rpc['proxy'] = proxy;


                // proxyList.splice(rndNumber, 1);
    
                port.postMessage(rpc);

            }   

          
        })


    })
}



module.exports = ({ port }) => {
    return new Promise((resolve, reject) => {
        // console.log('Start scan price');




        start(port).then((res) => {
            console.log('Worker getProxy end');

            resolve(res);
        }).catch(e => {
            console.log('Worker getProxy scanPrice');

            reject(e);
        })
    })
};