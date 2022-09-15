const apiImmutable = require('../controller/apiClass');
const fs = require('fs');
const helper = require('../helper');


function start(array_item) {
    return new Promise((resolve, reject)=> {
        let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
        console.log(typeof list);
        const proxyList = list.split('\n', 3000);
        helper.shuffle(proxyList);
        let i = 0;
        const arrayRes = [];
        array_item.forEach(async item => {
            // console.log(item.token_id);
            
            await apiImmutable.get_list_order(item.token_id, helper.initAgent(helper.proxyInit(proxyList[i]))).then(res=> {
                if (Array.isArray(res.data.result) && res.data.result.length > 0) {
                    arrayRes.push(res.data.result[0])

                } else {
                    // console.log(res.data);
                }
                i++
                if (i==array_item.length) {
                    console.log('Сортируем');
                    arrayRes.sort((a,b)=> a.buy.data.quantity_with_fees-b.buy.data.quantity_with_fees);
                    console.log(arrayRes[0]);
                    console.log(arrayRes[arrayRes.length-1]);
                    // resolve(arrayRes)
                }
                

            }).catch(e=> {
                console.log(e.message);
                i++
            })

            
        });





    })

}


module.exports = ({array_item}) => {
    return new Promise((resolve, reject) => {

       
  
  
      start(array_item).then((res) => {
        console.log('Worker watcher end');
  
        resolve(res);
      }).catch(e => {
        console.log('Worker Error watcher');
  
        reject(e);
      })
    })
  };