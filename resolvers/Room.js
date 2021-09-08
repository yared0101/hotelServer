const Room = {
    reserved: async ({ _id }, _, { client }) => {
        try {
            await client.connect();
            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            filter = { _id, date: { $gt: yesterday } };
            const result = await client
                .db("myHotel")
                .collection("reservations")
                .countDocuments(filter);
            return Boolean(result);
        } catch (e) {
            console.log(e);
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
};
module.exports = Room;
