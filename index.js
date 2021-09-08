const { ApolloServer } = require("apollo-server");
const pgp = require("pg-promise")();
const { PubSub } = require("graphql-subscriptions");
const error = require("./error");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const pubsub = new PubSub();
const typeDefs = require("./schema");
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const Subscription = require("./resolvers/Subscription");
const OrderedFoodAndDrink = require("./resolvers/OrderedFoodAndDrink");

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
};
const foodAndDrinksColNames = {
    name: 1,
    title: 1,
    description: 1,
    price: 1,
    isFasting: 1,
    rate: 1,
    time: 1,
    type: 1,
};
const orderedFoodAndDrinkColNames = {
    amount: 1,
    foodId: 1,
    orderer: 1,
    status: 1,
    orderedTime: 1,
};
const right = {
    accessTokenRights: async (payLoad, identifier) => {
        //TODO this code checks if the payload person has access to manage the identifier(if not exist throw error) person
        return true;
    },
    accessTokenPower: async (payLoad, role, accessNumber = 1) => {
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
        Subscription,
    },
    context: {
        pubsub,
        _client,
        right,
        userColNames,
        roomTypeColNames,
        roomColNames,
        foodAndDrinksColNames,
        orderedFoodAndDrinkColNames,
        ...contextFunctions,
    },
});

server.listen().then(({ url }) => {
    console.log(`server ready at ${url}`);
});
