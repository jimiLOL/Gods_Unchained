
const { default: axios } = require("axios");
const fs = require('fs')
const helper = require('../helper');
const {init} = require('../controller/startWatcherforSalse');

const { checktProxy } = require("../get_proxyInit");


function start() {
    getProxy().then(res => {
        fs.writeFileSync(`./proxy/proxy.txt`, '');


        let newArray = res.data.split("\n", 500);
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
        checktProxy('proxy').then(()=> {
           helper.timeout(500).then(()=> init())  // запускаем Watcher

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