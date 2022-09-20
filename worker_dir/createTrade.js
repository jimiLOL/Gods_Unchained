
const Redis = require("ioredis");
const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");

function start(port, name, item) {
    return new Promise(async (resolve) => {
        port.on('message', (data)=> {
           console.log(data);


        })

    })
}









module.exports = ({ port, name }) => {
    return new Promise((resolve, reject) => {




        start(port, name).then((res) => {
            console.log('Worker createTrade end');
            port.close()

            resolve({name: name});
        }).catch(e => {
            console.log('Worker Error createTrade');

            reject(e);
        })
    })
};