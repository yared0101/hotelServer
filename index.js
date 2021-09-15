const { ApolloServer } = require("apollo-server");
const pgp = require("pg-promise")();
const { PubSub } = require("graphql-subscriptions");
const error = require("./error");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const pubsub = new PubSub();
const typeDefs = require("./schema");
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const Subscription = require("./resolvers/Subscription");
const OrderedFoodAndDrink = require("./resolvers/OrderedFoodAndDrink");
const OrderedRoomService = require("./resolvers/OrderedRoomService");
const Room = require("./resolvers/Room");
const RoomType = require("./resolvers/RoomType");
const Reservation = require("./resolvers/Reservation");

const _client = () => {
    try {
        const uri = "mongodb://localhost:27017";
        return new MongoClient(uri);
    } catch (e) {
        throw "couldn't connect to database";
    }
};

const userColNames = {
    _id: 1,
    name: 1,
    email: 1,
    phoneNumber: 1,
    type: 1,
    role: 1,
};
const roomColNames = {
    floor: 1,
    roomId: 1,
    inside: 1,
    type: 1,
    availability: 1,
    reservedDates: 1,
};
const roomTypeColNames = {
    _id: 1,
    name: 1,
    description: 1,
    price: 1,
    holidayPriceAndDay: 1,
    amenities: 1,
    image: 1,
};
const foodAndDrinkColNames = {
    name: 1,
    title: 1,
    description: 1,
    price: 1,
    isFasting: 1,
    rate: 1,
    time: 1,
    type: 1,
};
const serviceColNames = {
    _id: 1,
    name: 1,
    image: 1,
    miniDescription: 1,
    description: 1,
};
const orderedFoodAndDrinkColNames = {
    amount: 1,
    _id: 1,
    foodId: 1,
    orderer: 1,
    status: 1,
    orderedTime: 1,
};
const roomServiceColNames = {
    _id: 1,
    name: 1,
    active: 1,
    description: 1,
    price: 1,
};
const orderedRoomServiceColNames = {
    amount: 1,
    _id: 1,
    roomServiceId: 1,
    orderer: 1,
    status: 1,
    orderedTime: 1,
};
const right = {
    accessTokenRights: async (payLoad, identifier) => {
        const client = _client();
        for (let i in identifier) {
            var identifierKey = i;
            break;
        }
        try {
            await client.connect();
            const projectionObject = { _id: 0, role: 1 };
            projectionObject[identifierKey] = 1;
            const result = await client
                .db("myHotel")
                .collection("users")
                .findOne(
                    { _id: new ObjectId(payLoad._id) },
                    { projection: projectionObject }
                );
            if (!result) {
                throw {
                    type: "myError",
                    error: error("User already deleted account", "accessToken"),
                };
            }
            if (result[identifierKey] === identifier[identifierKey]) {
                return true;
            }
            if (result["role"]["users"] >= 2) {
                return true;
            }
            throw {
                type: "myError",
                error: error(
                    "User doesn't have access for the operation",
                    "accessToken",
                    "ACCESS_DENIED"
                ),
            };
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
        // this code checks if the payload person has access to manage the identifier(if not exist throw error) person
    },
    accessTokenPower: async (payLoad, role, accessNumber = 1) => {
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("users")
                .findOne(
                    { _id: new ObjectId(payLoad._id) },
                    { projection: { role: 1, _id: 0 } }
                );
            if (!result) {
                throw {
                    type: "myError",
                    error: error("User already deleted account", "accessToken"),
                };
            }
            if (result["role"][role] >= accessNumber) {
                return true;
            }
            throw {
                type: "myError",
                error: error(
                    "User doesn't have access for the operation",
                    "accessToken",
                    "ACCESS_DENIED"
                ),
            };
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
        //TODO this code checks if the payloader has access to that role( access number is the type of access) 2 is management(add,delete,edit)
        return true;
    },
    accessTokenType: async (payLoad) => {},
};
const contextFunctions = {
    checkSize: (checkedObject, maxSize = 30, errorType = "BAD_USER_INPUT") => {
        for (let i in checkedObject) {
            if (String(checkedObject[i]).length > maxSize) {
                throw error("data too large", i, errorType);
            }
        }
    },
    returnDisallowedUserColumns: ({ _id }) => {
        return {};
    },
};
const server = new ApolloServer({
    subscriptions: {
        path: "/subscriptions",
    },
    typeDefs,
    resolvers: {
        Query,
        Mutation,
        OrderedFoodAndDrink,
        OrderedRoomService,
        RoomType,
        Room,
        Reservation,
        Subscription,
    },
    context: {
        pubsub,
        _client,
        right,
        userColNames,
        roomTypeColNames,
        roomColNames,
        roomServiceColNames,
        serviceColNames,
        foodAndDrinkColNames,
        orderedRoomServiceColNames,
        orderedFoodAndDrinkColNames,
        ...contextFunctions,
    },
});

server.listen().then(({ url }) => {
    console.log(`server ready at ${url}`);
});
