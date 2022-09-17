

const apiImmutable = require('../controller/apiClass');
const helper = require('../helper');
const Piscina = require('piscina');
const path = require('path');
const workerWhile = new Piscina({
    filename: path.resolve('./worker_dir', 'whileWorker.js'),
    // maxQueue: 2,
    // maxThreads: 50
});
const worker_scanPrice = new Piscina({
    filename: path.resolve('./worker_dir', 'scanPrice.js'),
    // maxQueue: 2,
    // maxThreads: 50
});

function start(itemsArray) {
    return new Promise((resolve) => {
        const arrayPromise = [];

        const filterArray = [];

        itemsArray.forEach(async item => {

            if (!filterArray.some(x => x.name == item.name)) {
                filterArray.push(item)


            };

        });
        console.log('Будет создано ' + filterArray.length + '  задач для сбора');

        filterArray.forEach(async ele => {
            // console.log(ele);
            // workerWhile.run({item: ele})

           workerWhile.run({ item: ele }).then((res)=> {
            if (Array.isArray(res)) {
                arrayPromise.push(worker_scanPrice.run({ array_item: res.flat() }))

            }

 
            });




            // arrayPromise.push(worker_pull.run({ array_item: result.flat() }).then(() => {

            // }).catch(e => {
            //     console.log(e);
            // }))




        });

        helper.timeout(60000).then(async ()=> {
            await Promise.allSettled(arrayPromise).then(() => {
                return resolve()
            }).catch(e => {
                console.log(e);
                return resolve()
            })
        })

     

    })
}






module.exports = ({ itemsArray }) => {
    return new Promise((resolve, reject) => {
        console.log('Начинаем сбор карточек с такими же именами');
        let startTime = new Date().getTime();





        start(itemsArray).then((res) => {
            let end = new Date().getTime();
            console.log(`Worker getItemsinWhile end ${end-startTime}`);

            resolve(res);
        }).catch(e => {
            console.log('Worker getItemsinWhile check');

            reject(e);
        })
    })
};