const fs = require('fs');
// const { SocksProxyAgent } = require('socks-proxy-agent');

const helper = require('./helper');

const checktProxy = (name_worker) => {
  return new Promise((resolve) => {

    // fs.writeFileSync(`./proxy/${name_worker}.txt`, '');
    fs.writeFileSync(`./proxy/proxyValid.txt`, '');



    // if (fs.existsSync(`./proxy/${name_worker}.txt`)) {
    let list = fs.readFileSync(`./proxy/${name_worker}.txt`, { encoding: 'utf8', flag: 'r' });
    // console.log(typeof list);
    const proxy = list.split('\n', 10000);
    console.log(proxy.length);
    const filterProxy = [];
    let i = 0;
    proxy.forEach(async p => {
      // let p = e.replace(' ', '')
      if (p != undefined && typeof p == 'string' && p.length > 3) {

        try {

          const proxyItem = helper.proxyInit(p);
          // const agent = new SocksProxyAgent(proxy);
          await helper.getIP(helper.initAgent(proxyItem)).then(res => {
            if (res.hasOwnProperty('title')) {
              fs.appendFile(`./proxy/proxyValid.txt`, `${p}\n`, function (error) {
                if (error) throw error;
                i++
                if (i == proxy.length) {
                  resolve()
                }
              });

            } else {
              i++
              if (i == proxy.length) {
                resolve()
              }
            }

            // filterProxy.push(e);
          
        

          }).catch(e => {
            i++
            if (i == proxy.length) {
              resolve()
            }
            console.log(e.message);
          });

        
        } catch (e) {
          i++
          if (i == proxy.length) {
            resolve()
          }
          console.log(e);

        }

      } else {
        proxy.splice((i+1), 1)
      }
    })
    return filterProxy



    // } else {
    //   setTimeout(() => {
    //     return checktProxy(name_worker)
    //   }, 1000);
    // }

  })




}


module.exports = { checktProxy }