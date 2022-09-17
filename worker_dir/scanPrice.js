const apiImmutable = require('../controller/apiClass');
const fs = require('fs');
const helper = require('../helper');


function start(array_item) {
    return new Promise((resolve, reject)=> {
        let list = fs.readFileSync(`./proxy/proxyValid.txt`, { encoding: 'utf8', flag: 'r' });
        console.log(typeof list);
        const proxyList = list.split('\n', 5000);
        let index = proxyList.indexOf('');
        proxyList.splice(index, 1);

        let i = 0;
        const arrayRes = [];
        array_item.forEach(async item => {
              helper.shuffle(proxyList);
          
              const agent = helper.initAgent(helper.proxyInit(proxyList[i >= proxyList.length - 1? helper.getRandomInt(1, proxyList.length - 1): i]));
            //   console.log(agent);

            // console.log(item.token_id);
            
            await apiImmutable.get_list_order_for_id(item.token_id, agent).then(res=> {
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
                    // здесь надо запписывать результат в базу -- средняя цена.
                    resolve(arrayRes[0])
                }
                

            }).catch(e=> {
                console.log(e.message);
                i++
                if (i==array_item.length) {
                    resolve()

                }
            })

            
        });





    })

}


module.exports = ({array_item}) => {
    return new Promise((resolve, reject) => {
        console.log('Start scan price');

       
  
  
      start(array_item).then((res) => {
        console.log('Worker scanPrice end');
  
        resolve(res);
      }).catch(e => {
        console.log('Worker Error scanPrice');
  
        reject(e);
      })
    })
  };