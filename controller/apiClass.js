const { default: axios } = require("axios");

const apiImmutable = {
    async get_list_order_for_id(id, agent) {
       return await axios.get(`https://api.x.immutable.com/v1/orders?&include_fees=true&order_by=created_at&sell_token_address=0xacb3c6a43d15b907e8433077b6d38ae40936fe2c&sell_token_id=${id}&status=active&min_timestamp=2022-08-27T00:10:22Z`, {httpsAgent: agent})


    },
    async get_list_my_item(wallet, agent) {
        return await axios.get(`https://api.x.immutable.com/v1/assets?&order_by=created_at&user=${wallet}`, {httpsAgent: agent})

    

    },
    async get_assets_for_name(name, agent, cursor) {
        console.log(name);
        if (name.includes('"')) {
            name = name.replace('"', '');
        }
        if (name.includes(' ')) {
            name = name.replace(' ', '_');
        };
        if (cursor.length> 10) {
        return await axios.get(`https://api.x.immutable.com/v1/assets?name=${name}&status=imx&order_by=updated_at&buy_metadata=%7B%22quality%22%3A%5B%22Meteorite%22%5D%7D&cursor=${cursor}`, {httpsAgent: agent})


        } else {
        return await axios.get(`https://api.x.immutable.com/v1/assets?name=${name}&status=imx&order_by=updated_at&buy_metadata=%7B%22quality%22%3A%5B%22Meteorite%22%5D%7D`, {httpsAgent: agent})


        }
 
    },
    async get_list_order(agent) {
        return await axios.get(`https://api.x.immutable.com/v1/orders?direction=desc&include_fees=true&order_by=created_at&sell_token_address=0xacb3c6a43d15b907e8433077b6d38ae40936fe2c&sell_token_type=ERC721&status=active`, {httpsAgent: agent})
    }
    

}

module.exports = apiImmutable