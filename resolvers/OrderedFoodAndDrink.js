const { MongoClient } = require("mongodb");

const OrderedFoodAndDrink = {
    orderer: async ({ orderer }, {}, { _client }) => {
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("user")
                .findOne({ _id: orderer });
            return result;
        } catch (e) {
            console.log(e);
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    food: async ({ foodId }, {}, { _client }) => {
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("foodAndDrinks")
                .findOne({ _id: foodId });
            return result;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
};
module.exports = OrderedFoodAndDrink;
