
const fs = require('fs');
const helper = require('../helper');
const apiImmutable = require('../controller/apiClass');


function start(item) {
return new Promise(async (resolve)=> {
    let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
    console.log(typeof list);
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
            console.log(i);


            const res = await apiImmutable.get_assets_for_name(item.name, helper.initAgent(helper.proxyInit(proxyList[i])), cursor);
            console.log(cursor);
            if (i >= 20) {
                cursor = null;

            } else {
                cursor = res.data.cursor;


            }
            if (Array.isArray(res?.data?.result)) {
                result.push(res.data.result)


            }




        }
        resolve()

    } catch (e) {
        console.log(e);
        resolve()


    }
})
}


module.exports = ({ item }) => {
    return new Promise((resolve, reject) => {
        console.log('Начинаем сбор карточек с такими же именами');




        start(item).then((res) => {
            console.log('Worker whileWorker end');

            resolve(res);
        }).catch(e => {
            console.log('Worker Error whileWorker');

            reject(e);
        })
    })
};