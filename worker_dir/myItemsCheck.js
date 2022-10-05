

  const { init_Order } = require('../controller/createOrder');
  const Redis = require("ioredis");
  const clientRedis = new Redis("redis://:kfKtB1t2li8s6XgoGdAmQrFAV8SzsvdiTBvJcFYlL1yOR78IP@85.10.192.24:6379");
const { utils } = require("ethers");


function start() {
    return new Promise(async (resolve) => {

      
        const keys_db = await clientRedis.keys('my_item_*');

        keys_db.forEach(async (ele, index) => {
            const price = await clientRedis.lrange(ele, 0, -1);
            price.forEach((element, i) => {
                let itemData = JSON.parse(element);
                if (itemData.date > new Date().getTime()-24*60*60*1000 && !itemData.init_order) {
                    setTimeout(async () => {
                        const average_price = await clientRedis.get(`average_price_${itemData.item_name.replace(' ', '_')}`);
                        if (average_price) {
                            await clientRedis.lrem(ele, 1, element);
                            itemData.init_order = true;
                            let item = JSON.parse(average_price);
                           
                            let sellPrice = item.GODS.average_big;
                           
                            let newPrice = utils.formatUnits(String(sellPrice), '18');
    
                            const result = await init_Order({tokenId: itemData.token_id, price: Number(newPrice).toFixed(8), workerType: 'myItemsCheck'}).then(async res=> {
                            await clientRedis.lpush(ele, JSON.stringify(itemData));
                            return res

                            });
                            console.log(result);

                        }
                       
                        if (index == price.length-1 && i == price.length-1) {
                            resolve()
                        }
                    }, 1000*i+1);
                  
                } else {
                    if (index == price.length-1) {
                        resolve()
                    }
                }
                
            });


            
        });
        if (keys_db.length == 0) {
            resolve()
        }




    })
}

module.exports = () => {
    return new Promise((resolve, reject) => {
        console.log('Worker myItemsCheck Start');





        start().then(() => {
            console.log('Worker myItemsCheck end');

            resolve();
        }).catch(e => {
            console.log('Worker Error myItemsCheck');

            reject(e);
        })
    })
};