

const apiImmutable = require('../controller/apiClass');

const Piscina = require('piscina');
const path = require('path');
const workerWhile = new Piscina({
    filename: path.resolve('./worker_dir', 'whileWorker.js'),
    maxQueue: 2,
    maxThreads: 50
});

function start(itemsArray) {
    return new Promise(async (resolve) => {
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

            arrayPromise.push(workerWhile.run({ item: ele }).then(() => {
                resolve()

            }).catch(e => {
                console.log(e);
                resolve()

            }));




            // arrayPromise.push(worker_pull.run({ array_item: result.flat() }).then(() => {

            // }).catch(e => {
            //     console.log(e);
            // }))




        });

        await Promise.allSettled(arrayPromise).then(() => {
            resolve()
        }).catch(e => {
            console.log(e);
            resolve()
        })

    })
}






module.exports = ({ itemsArray }) => {
    return new Promise((resolve, reject) => {
        console.log('Начинаем сбор карточек с такими же именами');




        start(itemsArray).then((res) => {
            console.log('Worker getItemsinWhile end');

            resolve(res);
        }).catch(e => {
            console.log('Worker getItemsinWhile check');

            reject(e);
        })
    })
};