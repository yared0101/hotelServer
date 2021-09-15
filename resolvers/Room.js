const Room = {
    reservations: async ({ _id }, {}, { _client }) => {
        const client = _client();
        try {
            await client.connect();
            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            filter = { roomId: _id, date: { $gt: yesterday } };
            const cursor = client
                .db("myHotel")
                .collection("reservations")
                .find(filter);
            return await cursor.toArray();
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
};
module.exports = Room;
