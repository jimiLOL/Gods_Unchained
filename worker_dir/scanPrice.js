const apiImmutable = require('../controller/apiClass');
const helper = require('../helper');

 
function start(array_item, port, name) {
    return new Promise(async (resolve, reject) => {
        

        const arrayRes = [];
        const getProxy = () => new Promise((resolve, reject) => {
            port.once('message', (rpc) => {
                if (rpc.get) {
                    resolve(rpc.proxy)
                }

            })
        });
        console.log(`Start scan in ${name} array_item ` + array_item.length);
        try {
            while (array_item.length != 0) {
                try {
                    port.postMessage({ get: true, worker_children_name: name });


                    const proxy = await getProxy();
    
    
    
    
                    const agent = helper.initAgent(proxy);
    
                 
              
    
    
                    const res = await apiImmutable.get_list_order_for_id(array_item[array_item.length-1].token_id, agent);
    
     
                    port.postMessage({ set: true, proxy: `${proxy.host}:${proxy.port}` });
    
                    if (Array.isArray(res.data.result) && res.data.result.length > 0) {
                        arrayRes.push(res.data.result[0])
    
                    } 
                    array_item.splice(array_item.length-1, 1);

                    // console.log(array_item.length);
    

                } catch (e) {
                    console.log(e.message);
                    // console.log(array_item);
                    console.log(array_item.length);


                }
              



            }
         
            // здесь надо запписывать результат в базу -- средняя цена.
            resolve(arrayRes)

        } catch (e) {
            console.log(e);
            console.log(array_item.length);
        }

        // array_item.forEach((item, index) => {
        //     //   helper.shuffle(proxyList);
        //     helper.timeout(100*index).then(async ()=> {

        //     })



        // });





    })

}


module.exports = ({ array_item, port, name }) => {
    return new Promise((resolve, reject) => {
        console.log('Start scan price');




        start(array_item, port, name).then((res) => {
            console.log('Worker scanPrice end');

            resolve(res);
        }).catch(e => {
            console.log('Worker Error scanPrice');

            reject(e);
        })
    })
};