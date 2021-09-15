const OrderedRoomService = {
    orderer: async ({ orderer }, {}, { _client }) => {
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("users")
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
    roomService: async ({ roomServiceId }, {}, { _client }) => {
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("roomServices")
                .findOne({ _id: roomServiceId });
            return result;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
};
module.exports = OrderedRoomService;
