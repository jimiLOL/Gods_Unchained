



function start(port) {

    return new Promise((resolve) => {
        const { default: axios } = require("axios");

        class getPrice {

            constructor() {
                this.prices = {
                    "gods-unchained": {
                        usd: 0.475686,
                        token_address: '0xccc8cb5229b0ac8069c51fd58367fd1e622afd97',
                        symbol: "GODS",
                        decimals: "18",
                        quantum: "100000000"
                    },
                    "usd-coin": {
                        usd: 0.999544,
                        token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                        symbol: "USDC",
                        decimals: "6",
                        quantum: "1"
                    },
                    "guild-of-guardians": {
                        usd: 0.161647,
                        token_address: "0x9ab7bb7fdc60f4357ecfef43986818a2a3569c62",
                        symbol: "GOG",
                        decimals: "18",
                        quantum: "100000000"
                    },
                    "apecoin": {
                        usd: 5.13,
                        token_address: "0x4d224452801aced8b2f0aebe155379bb5d594381",
                        symbol: "APE",
                        decimals: "18",
                        quantum: "100000000"
                    },
                    "ethereum": {
                        usd: 1315.44,
                        symbol: "ETH",
                        token_address: '',
                        decimals: "18",
                        quantum: "100000000"
                    },
                    "immutable-x": {
                        usd: 0.752336,
                        symbol: "IMX",
                        token_address: "0xf57e7e7c23978c3caec3c3548e3d615c346e79ff",
                        decimals: "18",
                        quantum: "100000000"
                    }
                }

            }
            getExchange(res) {
                if (typeof res == 'object') {
                    Object.keys(this.prices).forEach(e => {
                        // console.log(this.prices[e]);
                        this.prices[e].usd = res[e].usd;
    
                    })

                }
              
                return this.prices;

            }
            // getBalance(res) {
            //     res.forEach(ele => {
            //         ele.token_address

            //     });
            //     return this.prices
            // }
        }
        let actualExchange;
        // let Exchange;
        let actualBalance = {};



        port.on('message', (rpc) => {
            // console.log(rpc);
            rpc['set_price'] = true;
            rpc['price'] = actualExchange;
            rpc['walletBalance'] = actualBalance;
            port.postMessage(rpc)

        });
        axios.get('https://api.coingecko.com/api/v3/simple/price?ids=immutable-x%2Cethereum%2Cgods-unchained%2Cguild-of-guardians%2Cusd-coin%2Cecomi%2Capecoin&vs_currencies=usd').then((res) => {
            let Exchange = new getPrice();
            actualExchange = Exchange.getExchange(res.data)
            // console.log(actualExchange);

        }).catch(e => {
            console.log(e);
        });
        axios.get('https://api.x.immutable.com/v2/balances/0xb8F202dC3242A6b17d7Be5e2956aC2680EAf223c').then((res) => {
            // Exchange.getBalance()
            if (Array.isArray(res.data.result)) {
                res.data.result.forEach(e => {
                    actualBalance[e.symbol] = e.balance;
                });
            }


        }).catch(e => {
            console.log(e.message);
        });
        setInterval(async () => {
            await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=immutable-x%2Cethereum%2Cgods-unchained%2Cguild-of-guardians%2Cusd-coin%2Cecomi%2Capecoin&vs_currencies=usd').then((res) => {
                let Exchange = new getPrice();
                actualExchange = Exchange.getExchange(res.data)
                // console.log(actualExchange);

            }).catch(e => {
                console.log(e);
            });
            await axios.get('https://api.x.immutable.com/v2/balances/0xb8F202dC3242A6b17d7Be5e2956aC2680EAf223c').then((res) => {
                // Exchange.getBalance()
                if (Array.isArray(res.data.result)) {
                    res.data.result.forEach(e => {
                        actualBalance[e.symbol] = e.balance;
                    });
                }


            }).catch(e => {
                console.log(e.message);
            });


        }, 10000);





    })
}



module.exports = ({ port }) => {
    return new Promise((resolve, reject) => {





        start(port).then((res) => {

            resolve(res);
        }).catch(e => {

            reject(e);
        })
    })
};