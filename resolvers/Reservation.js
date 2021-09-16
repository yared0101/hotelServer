const Reservation = {
    user: async ({ userId }, {}, { _client }) => {
        const client = _client();
        try {
            await client.connect();
            filter = { _id: userId };
            const data = await client
                .db("myHotel")
                .collection("users")
                .findOne(filter);
            return data;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    room: async ({ roomId }, {}, { _client }) => {
        const client = _client();
        try {
            await client.connect();
            filter = { _id: roomId };
            const data = await client
                .db("myHotel")
                .collection("rooms")
                .findOne(filter);
            return data;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
};
module.exports = Reservation;
