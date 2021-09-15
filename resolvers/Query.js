const pgp = require("pg-promise")();
const { verify } = require("jsonwebtoken");
const error = require("../error");
const { MongoClient, ObjectId } = require("mongodb");
try {
    const uri = "mongodb://localhost:27017";
    var client = new MongoClient(uri);
} catch (e) {
    throw "couldn't connect to database";
}
const Query = {
    hello: () => {
        return "Hello people!";
    },
    getUsers: async (
        _,
        { accessToken, limit, skip, likeSearch, minSearch, maxSearch, sort },
        { userColNames, _client, checkSize, returnDisallowedUserColumns, right }
    ) => {
        //TODO u can let them send an array to give multiple choises(or) name :$in:['adsf'],if sent morename :$in:['adsf','asddd']
        likeSearch = likeSearch || {};
        minSearch = minSearch || {};
        maxSearch = maxSearch || {};
        sort = sort || {};
        skip = skip || 0;
        limit = limit > 20 ? 20 : limit;
        checkSize(likeSearch, "INTERNAL_SERVER_ERROR");
        for (let i in likeSearch) {
            likeSearch[i] = {
                $regex: "_*" + likeSearch[i] + "_*",
                $options: "i",
            };
        }
        for (let i in sort) {
            if (sort[i]) sort[i] = 1;
            else sort[i] = -1;
        }
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "tempAccessToken");
        }
        const { accessTokenPower } = right;
        await accessTokenPower(payLoad, "users");
        let filter = { ...likeSearch };
        for (let i in minSearch) {
            if (i === "role") {
                for (let k in minSearch[i]) {
                    filter[`${i}.${k}`] = { $gt: minSearch[i][k] };
                }
            } else filter[i] = { $gt: minSearch[i] };
        }
        for (let i in maxSearch) {
            if (i === "role") {
                for (let k in maxSearch[i]) {
                    filter[`${i}.${k}`] = {
                        ...filter[`${i}.${k}`],
                        $lt: maxSearch[i][k],
                    };
                }
            } else filter[i] = { ...filter[i], $lt: maxSearch[i] };
        }
        const client = _client();
        try {
            await client.connect();
            const cursor = client
                .db("myHotel")
                .collection("users")
                .find(filter, {
                    projection: { ...userColNames },
                    sort,
                    limit,
                    skip,
                });
            return await cursor.toArray();
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    getRoomTypes: async (
        _,
        { limit, skip, likeSearch, minSearch, maxSearch, sort },
        { roomTypeColNames, _client }
    ) => {
        likeSearch = likeSearch || {};
        minSearch = minSearch || {};
        maxSearch = maxSearch || {};
        sort = sort || {};
        skip = skip || 0;
        limit = limit > 20 ? 20 : limit;
        for (let i in likeSearch) {
            likeSearch[i] = {
                $regex: "_*" + likeSearch[i] + "_*",
                $options: "i",
            };
        }
        for (let i in sort) {
            if (sort[i]) sort[i] = 1;
            else sort[i] = -1;
        }
        let filter = { ...likeSearch };
        for (let i in minSearch) {
            if (i === "weekdayPrice") {
                filter[`price.0`] = { $gt: minSearch[i] };
            } else if (i === "weekendPrice") {
                filter["price.1"] = { $gt: minSearch[i] };
            } else filter[i] = { $gt: minSearch[i] };
        }
        for (let i in maxSearch) {
            if (i === "weekdayPrice") {
                filter[`price.0`] = { ...filter[`price.0`], $lt: maxSearch[i] };
            } else if (i === "weekendPrice") {
                filter["price.1"] = { ...filter["price.1"], $lt: maxSearch[i] };
            } else filter[i] = { ...filter[i], $lt: maxSearch[i] };
        }
        const client = _client();
        try {
            await client.connect();
            const cursor = client
                .db("myHotel")
                .collection("roomTypes")
                .find(filter, {
                    projection: { ...roomTypeColNames },
                    sort,
                    limit,
                    skip,
                });
            return await cursor.toArray();
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    getRooms: async (
        _,
        { limit, skip, likeSearch, minSearch, maxSearch, sort },
        { roomColNames, _client }
    ) => {
        likeSearch = likeSearch || {};
        minSearch = minSearch || {};
        maxSearch = maxSearch || {};
        sort = sort || {};
        skip = skip || 0;
        limit = limit > 20 ? 20 : limit;
        for (let i in likeSearch) {
            likeSearch[i] = {
                $regex: "_*" + likeSearch[i] + "_*",
                $options: "i",
            };
        }
        let newSort = {};
        for (let i in sort) {
            if (i === "reserved") continue;
            if (sort[i]) newSort[i] = 1;
            else newSort[i] = -1;
        }
        let filter = { ...likeSearch };
        for (let i in minSearch) {
            filter[i] = { $gt: minSearch[i] };
        }
        for (let i in maxSearch) {
            filter[i] = { ...filter[i], $lt: maxSearch[i] };
        }
        const client = _client();
        try {
            await client.connect();
            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const reservedCursor = client
                .db("myHotel")
                .collection("reservations")
                .find(
                    { date: { $gt: yesterday } },
                    {
                        projection: { _id: -1, roomId: 1 },
                    }
                );
            const reservedData = await reservedCursor.toArray();
            const newDataArray = reservedData.map((element) => {
                let temp = new ObjectId(element.roomId);
                return String(temp);
            }); //i have messed with this, do regression testing!
            const cursor = client
                .db("myHotel")
                .collection("rooms")
                .find(filter, {
                    projection: { ...roomColNames },
                    sort: newSort,
                    limit,
                    skip,
                });
            const data = await cursor.toArray();
            const wholeRoomData = data.map((element) => {
                const { _id } = element;
                return {
                    ...element,
                    reserved:
                        newDataArray.indexOf(String(_id)) == -1 ? false : true,
                };
            });
            if (sort["reserved"] || sort["reserved"] === false) {
                const reservedRooms = wholeRoomData.filter(
                    (element) => element.reserved
                );
                const notReservedRooms = wholeRoomData.filter(
                    (element) => !element.reserved
                );
                if (sort["reserved"])
                    return reservedRooms.concat(notReservedRooms);
                return notReservedRooms.concat(reservedRooms);
            }
            return wholeRoomData;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    getReservations: async (
        _,
        { limit, skip, minSearch, maxSearch, likeSearch, sort },
        { _client }
    ) => {
        likeSearch = likeSearch || {};
        minSearch = minSearch || {};
        maxSearch = maxSearch || {};
        sort = sort || {};
        skip = skip || 0;
        limit = limit > 20 ? 20 : limit;
        let newSort = {};
        for (let i in sort) {
            if (sort[i]) newSort[i] = 1;
            else newSort[i] = -1;
        }
        for (let i in likeSearch) {
            likeSearch[i] = new ObjectId(likeSearch[i]);
        }
        let filter = { ...likeSearch };
        for (let i in minSearch) {
            if (i === "childrenGuest") filter[`${i}.1`] = { $gt: minSearch[i] };
            else if (i === "adultGuest")
                filter[`${i}.0`] = { $gt: minSearch[i] };
            else if (i === "date") {
                const tempDate = new Date(minSearch[i]);
                if (!tempDate.getDate())
                    throw error("Invalid date given", "minSearch");
                filter[i] = { $gt: tempDate };
            } else filter[i] = { $gt: minSearch[i] };
        }
        for (let i in maxSearch) {
            if (i === "childrenGuest")
                filter[`${i}.1`] = { ...filter[`${i}.1`], $lt: maxSearch[i] };
            else if (i === "adultGuest")
                filter[`${i}.0`] = { ...filter[`${i}.0`], $lt: maxSearch[i] };
            else if (i === "date") {
                const tempDate = new Date(maxSearch[i]);
                if (!tempDate.getDate())
                    throw error("Invalid date given", "maxSearch");
                filter[i] = { ...filter[i], $lt: tempDate };
            } else filter[i] = { ...filter[i], $lt: maxSearch[i] };
        }
        const client = _client();
        try {
            await client.connect();
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
    getHallReservations: async (
        _,
        { limit, skip, minSearch, maxSearch, likeSearch, sort },
        { _client }
    ) => {
        likeSearch = likeSearch || {};
        minSearch = minSearch || {};
        maxSearch = maxSearch || {};
        sort = sort || {};
        skip = skip || 0;
        limit = limit > 20 ? 20 : limit;
        let newSort = {};
        for (let i in sort) {
            if (sort[i]) newSort[i] = 1;
            else newSort[i] = -1;
        }
        for (let i in likeSearch) {
            likeSearch[i] = new ObjectId(likeSearch[i]);
        }
        let filter = { ...likeSearch };
        for (let i in minSearch) {
            const tempDate = new Date(minSearch[i]);
            if (!tempDate.getDate())
                throw error("Invalid date given", "minSearch");
            filter[i] = { $gt: tempDate };
        }
        for (let i in maxSearch) {
            const tempDate = new Date(maxSearch[i]);
            if (!tempDate.getDate())
                throw error("Invalid date given", "maxSearch");
            filter[i] = { ...filter[i], $lt: tempDate };
        }
        const client = _client();
        try {
            await client.connect();
            const cursor = client
                .db("myHotel")
                .collection("hallReservations")
                .find(filter);
            return await cursor.toArray();
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    getFoodAndDrinks: async (
        _,
        { limit, skip, likeSearch, minSearch, maxSearch, sort },
        { foodAndDrinkColNames, _client }
    ) => {
        likeSearch = likeSearch || {};
        minSearch = minSearch || {};
        maxSearch = maxSearch || {};
        sort = sort || {};
        skip = skip || 0;
        limit = limit > 20 ? 20 : limit;
        for (let i in likeSearch) {
            likeSearch[i] = {
                $regex: "_*" + likeSearch[i] + "_*",
                $options: "i",
            };
        }
        let newSort = {};
        for (let i in sort) {
            if (sort[i]) newSort[i] = 1;
            else newSort[i] = -1;
        }
        let filter = { ...likeSearch };
        for (let i in minSearch) {
            filter[i] = { $gt: minSearch[i] };
        }
        for (let i in maxSearch) {
            filter[i] = { ...filter[i], $lt: maxSearch[i] };
        }
        const client = _client();
        try {
            await client.connect();
            const cursor = client
                .db("myHotel")
                .collection("foodAndDrinks")
                .find(filter, {
                    projection: { ...foodAndDrinkColNames },
                    sort: newSort,
                    limit,
                    skip,
                });
            return await cursor.toArray();
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    getOrderedFoodAndDrinks: async (
        _,
        { accessToken, limit, skip, likeSearch, minSearch, maxSearch, sort },
        { orderedFoodAndDrinkColNames, _client, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const { accessTokenPower } = right;
        await accessTokenPower(payLoad, "orderedFoodAndDrinks", 1);
        likeSearch = likeSearch || {};
        minSearch = minSearch || {};
        maxSearch = maxSearch || {};
        sort = sort || {};
        skip = skip || 0;
        limit = limit > 20 ? 20 : limit;
        for (let i in likeSearch) {
            likeSearch[i] = {
                $regex: "_*" + likeSearch[i] + "_*",
                $options: "i",
            };
        }
        let newSort = {};
        for (let i in sort) {
            if (sort[i]) newSort[i] = 1;
            else newSort[i] = -1;
        }
        let filter = { ...likeSearch };
        for (let i in minSearch) {
            filter[i] = { $gt: minSearch[i] };
        }
        for (let i in maxSearch) {
            filter[i] = { ...filter[i], $lt: maxSearch[i] };
        }
        const client = _client();
        try {
            await client.connect();
            const cursor = client
                .db("myHotel")
                .collection("orderedFoodAndDrinks")
                .find(filter, {
                    projection: { ...orderedFoodAndDrinkColNames },
                    sort: newSort,
                    limit,
                    skip,
                });
            return await cursor.toArray();
        } catch (e) {
            console.log(e);
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    getRoomServices: async (
        _,
        { limit, skip, likeSearch, minSearch, maxSearch, sort },
        { roomServiceColNames, _client }
    ) => {
        likeSearch = likeSearch || {};
        minSearch = minSearch || {};
        maxSearch = maxSearch || {};
        sort = sort || {};
        skip = skip || 0;
        limit = limit > 20 ? 20 : limit;
        for (let i in likeSearch) {
            likeSearch[i] = {
                $regex: "_*" + likeSearch[i] + "_*",
                $options: "i",
            };
        }
        let newSort = {};
        for (let i in sort) {
            if (sort[i]) newSort[i] = 1;
            else newSort[i] = -1;
        }
        let filter = { ...likeSearch };
        for (let i in minSearch) {
            filter[i] = { $gt: minSearch[i] };
        }
        for (let i in maxSearch) {
            filter[i] = { ...filter[i], $lt: maxSearch[i] };
        }
        const client = _client();
        try {
            await client.connect();
            const cursor = client
                .db("myHotel")
                .collection("roomServices")
                .find(filter, {
                    projection: { ...roomServiceColNames },
                    sort: newSort,
                    limit,
                    skip,
                });
            return await cursor.toArray();
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    getOrderedRoomServices: async (
        _,
        { accessToken, limit, skip, likeSearch, minSearch, maxSearch, sort },
        { orderedRoomServiceColNames, _client, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const { accessTokenPower } = right;
        await accessTokenPower(payLoad, "orderedRoomServices", 1);
        likeSearch = likeSearch || {};
        minSearch = minSearch || {};
        maxSearch = maxSearch || {};
        sort = sort || {};
        skip = skip || 0;
        limit = limit > 20 ? 20 : limit;
        for (let i in likeSearch) {
            likeSearch[i] = {
                $regex: "_*" + likeSearch[i] + "_*",
                $options: "i",
            };
        }
        let newSort = {};
        for (let i in sort) {
            if (sort[i]) newSort[i] = 1;
            else newSort[i] = -1;
        }
        let filter = { ...likeSearch };
        for (let i in minSearch) {
            filter[i] = { $gt: minSearch[i] };
        }
        for (let i in maxSearch) {
            filter[i] = { ...filter[i], $lt: maxSearch[i] };
        }
        const client = _client();
        try {
            await client.connect();
            const cursor = client
                .db("myHotel")
                .collection("orderedRoomServices")
                .find(filter, {
                    projection: { ...orderedRoomServiceColNames },
                    sort: newSort,
                    limit,
                    skip,
                });
            return await cursor.toArray();
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    getServices: async (
        _,
        { limit, skip, likeSearch, sort },
        { serviceColNames, _client }
    ) => {
        likeSearch = likeSearch || {};
        sort = sort || {};
        skip = skip || 0;
        limit = limit > 20 ? 20 : limit;
        for (let i in likeSearch) {
            likeSearch[i] = {
                $regex: "_*" + likeSearch[i] + "_*",
                $options: "i",
            };
        }
        for (let i in sort) {
            if (sort[i]) sort[i] = 1;
            else sort[i] = -1;
        }
        let filter = { ...likeSearch };
        const client = _client();
        try {
            await client.connect();
            const cursor = client
                .db("myHotel")
                .collection("services")
                .find(filter, {
                    projection: { ...serviceColNames },
                    sort,
                    limit,
                    skip,
                });
            return await cursor.toArray();
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
};
module.exports = Query;
