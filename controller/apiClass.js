const { default: axios } = require("axios");
const moment = require('moment');
// const { encode, decode } = require('url-encode-decode')
const apiImmutable = {
    async get_list_order_for_id(id, agent) {
        let date = moment().subtract(2, 'days');
        date = date.format("YYYY-MM-DD[T]HH:mm:ss[Z]")
        return await axios.get(`https://api.x.immutable.com/v1/orders?&include_fees=true&order_by=created_at&sell_token_address=0xacb3c6a43d15b907e8433077b6d38ae40936fe2c&sell_token_id=${id}&status=filled&min_timestamp=${date}`, { httpsAgent: agent })


    },
    async get_list_my_item(wallet, cursor) {
        if (!cursor) {
            return await axios.get(`https://api.x.immutable.com/v1/assets?&order_by=created_at&user=${wallet}`)

        } else {
            console.log(cursor);
            return await axios.get(`https://api.x.immutable.com/v1/assets?&order_by=created_at&user=${wallet}&cursor=${cursor}`)


        }



    },
    async get_assets_for_name(name, agent, cursor) {
        // console.log(name);
        if (name.includes('"')) {
            name = name.replace('"', '');
        }
        if (name.includes(' ')) {
            name = name.replace(' ', '_');
        };
        if (cursor.length > 10) {
            return await axios.get(`https://api.x.immutable.com/v1/assets?name=${name}&status=imx&order_by=updated_at&metadata=%7B%22quality%22%3A%5B%22Meteorite%22%5D%7D&cursor=${cursor}`, { httpsAgent: agent })


        } else {
            return await axios.get(`https://api.x.immutable.com/v1/assets?name=${name}&status=imx&order_by=updated_at&metadata=%7B%22quality%22%3A%5B%22Meteorite%22%5D%7D`, { httpsAgent: agent })


        }

    },
    async get_list_order(agent) {
        const protoEncode = { "quality": ["Meteorite"] };

        const encodedQuery = encodeURIComponent(JSON.stringify(protoEncode)).replace(/'/g, "%27").replace(/"/g, "%22");
        return await axios.get(`https://api.x.immutable.com/v1/orders?direction=desc&include_fees=true&order_by=created_at&sell_token_address=0xacb3c6a43d15b907e8433077b6d38ae40936fe2c&sell_token_type=ERC721&sell_metadata=${encodedQuery}&status=active`, { httpsAgent: agent })
    },
    async get_one_item_for_id(id, agent) {
        return await axios.get(`https://api.x.immutable.com/v1/assets/0xacb3c6a43d15b907e8433077b6d38ae40936fe2c/${id}?include_fees=true`, { httpsAgent: agent })

    },
    async get_list_order_for_filter_proto(proto, agent) {

        let date = moment().subtract(2, 'days');
        date = date.format("YYYY-MM-DD[T]HH:mm:ss[Z]")
        const protoEncode = { "proto": [`${proto}`], "quality": ["Meteorite"] };
        // console.log(protoEncode);
        // const encodedQuery = encodeURIComponent(JSON.stringify(JSON.parse(protoEncode)));
        // const encodedQuery = encode(protoEncode)
        const encodedQuery = encodeURIComponent(JSON.stringify(protoEncode)).replace(/'/g, "%27").replace(/"/g, "%22");
        // console.log(encodedQuery);
        return axios.get(`https://api.x.immutable.com/v1/orders?direction=asc&include_fees=true&order_by=buy_quantity&page_size=200&sell_metadata=${encodedQuery}&sell_token_address=0xacb3c6a43d15b907e8433077b6d38ae40936fe2c&status=filled&min_timestamp=${date}`, { httpsAgent: agent })




    }


}

module.exports = apiImmutable