const { MongoClient, ObjectId } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const RoomType = {
    rooms: async ({ name }, {}, { _client }) => {
        try {
            await client.connect();
            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            filter = { date: { $gt: yesterday } };
            const reservedRoomsAsObjects = await client
                .db("myHotel")
                .collection("reservations")
                .distinct("roomId");
            const reservedRooms = reservedRoomsAsObjects.map((element) =>
                String(element)
            );
            const roomCursor = client
                .db("myHotel")
                .collection("rooms")
                .find({ type: name, availability: true });
            const allRooms = await roomCursor.toArray();
            const nonReserved = allRooms.filter(({ _id }) => {
                if (reservedRooms.indexOf(String(_id)) === -1) return true;
            });
            return nonReserved;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
};
module.exports = RoomType;
