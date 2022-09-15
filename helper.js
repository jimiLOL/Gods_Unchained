const { default: axios } = require("axios");
const tunnel = require('tunnel');
const fs = require('fs');

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // случайный индекс от 0 до i

        // поменять элементы местами
        // мы используем для этого синтаксис "деструктурирующее присваивание"
        // подробнее о нём - в следующих главах
        // то же самое можно записать как:
        // let t = array[i]; array[i] = array[j]; array[j] = t
        [array[i], array[j]] = [array[j], array[i]];
    }
};

function proxyInit(proxy) {
    try {
        let proxyArray = proxy.split(":", 4);

        return { host: proxyArray[0], port: proxyArray[1] }

    } catch (e) {
        console.log(e);
        console.log(proxy);
        process.exit(1)
    }


};
async function getIP(agent) {
    return await axios.get('https://api.ipify.org', { httpsAgent: agent }).then(res => {
        console.log('PROXY IP^ ' + res.data);
        return res.data
    }).catch(e => {
        console.log(e.message);
        return e.message
    })
};

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

function initAgent(proxyOptions) {
    let agent = tunnel.httpsOverHttp({
        proxy: proxyOptions,
    });
    return agent
}


function delDublicateProxy(proxy) {
    const newProxyArray = [];
    proxy.forEach((ele, i) => {
        let filter = proxy.filter(x => x == ele);

        if (filter.length == 1) {
            newProxyArray.push(ele)
        }

    });
    return newProxyArray
};


 

function filterProxy(arrayProxy) {
    const proxyFile = fs.readFileSync('./errorProxy.txt', { encoding: 'utf8', flag: 'r' });
    const proxy = proxyFile.split('\n', 100200);
    // console.log(proxy);
    let proxyF = delDublicateProxy(arrayProxy);
    const newProxy = [];
    proxyF.forEach(element => {
        let filter = proxy.filter(x => x == element);
        if (filter.length == 0) {
            newProxy.push(element);
        }

    });
    console.log(newProxy.length);
    return newProxy

}

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

  const helper = { shuffle, proxyInit, getIP, uuid, getRandomInt, initAgent, timeout, delDublicateProxy, filterProxy };
  module.exports = helper;

