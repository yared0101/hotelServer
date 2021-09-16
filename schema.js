const { gql } = require("apollo-server");
const typeDefs = gql`
    input UserRoleInput {
        users: Int
        rooms: Int
        reservedRooms: Int
        foodAndDrinks: Int
        orderedFoodAndDrinks: Int
        roomServices: Int
        orderedRoomServices: Int
        roomType: Int
    }
    type UserRole {
        users: Int
        rooms: Int
        reservedRooms: Int
        foodAndDrinks: Int
        orderedFoodAndDrinks: Int
        roomServices: Int
        orderedRoomServices: Int
        roomType: Int
    }
    type User {
        _id: ID!
        name: String
        email: String
        phoneNumber: String
        image: String
        role: UserRole! # stringify and send this for maybe some convenience
    }
    input UserSort {
        _id: Boolean
        name: Boolean
        email: Boolean
        phoneNumber: Boolean
        type: Boolean
    }
    input UserLikeSearch {
        name: String
        email: String
        phoneNumber: String
    }
    input UserRangeSearch {
        role: UserRoleInput
    }
    input UserInput {
        name: String
        email: String
        phoneNumber: String
        image: String
        role: UserRoleInput #the data sent here will rewrite everything!
        password: [String] # array of strings, the first one being the old password
    }
    type Amenities {
        freeGym: Boolean
        freeSpa: Boolean
        freePool: Boolean
    }
    input AmenitiesInput {
        freeGym: Boolean
        freeSpa: Boolean
        freePool: Boolean
    }
    type RoomType {
        _id: ID!
        name: String!
        image: String!
        rooms: [Room]!
        description: String!
        price: [Float!]!
        holidayPriceAndDay: [[String!]]
        amenities: Amenities!
    }
    input RoomTypeSort {
        name: Boolean
        description: Boolean
        price: Boolean
    }
    input RoomTypeLikeSearch {
        name: String
        description: String
    }
    input RoomTypeRangeSearch {
        weekdayPrice: Float
        weekendPrice: Float
    }
    input RoomTypeInput {
        name: String!
        description: String!
        price: [Float!]!
        amenities: AmenitiesInput!
        image: String!
    }
    input RoomTypeUpdate {
        name: String
        image: String
        description: String
        price: [Float!] #the whole array will be changed, weekend and weekday price must be sent equally
        amenities: AmenitiesInput
        holidayPriceAndDay: [[String!]]
    }
    type Room {
        _id: ID!
        floor: Int!
        roomId: String!
        inside: Boolean!
        availability: Boolean!
        reserved: Boolean!
        reservations: [Reservation]!
        type: String!
    }
    input RoomInput {
        floor: Int!
        roomId: String!
        inside: Boolean!
        availability: Boolean!
        type: String!
    }
    input RoomUpdate {
        floor: Int
        roomId: String
        inside: Boolean
        availability: Boolean
        type: String
    }
    input RoomSort {
        floor: Boolean
        roomId: Boolean
        inside: Boolean
        availability: Boolean
        reserved: Boolean
        type: Boolean
    }
    input RoomLikeSearch {
        roomType: String
        roomId: String
    }
    input RoomRangeSearch {
        floor: Int
        # sreservedDates: String # use this format trust me year/month/day not year-month-day
    }
    type Reservation {
        date: String!
        user: User!
        room: Room!
        guests: [Int!]!
    }
    type HallReservation {
        from: String! #send timestamp please :(
        to: String!
        userId: String!
        hallId: String!
    }
    input HallReservationRangeSearch {
        from: String
        to: String
    }
    input HallReservationLikeSearch {
        userId: String
        hallId: String
    }
    input HallReservationSort {
        from: Boolean
        to: Boolean
        userId: Boolean
        hallId: Boolean
    }
    input ReservationRangeSearch {
        date: String
        childrenGuest: Int
        adultGuest: Int
    }
    input ReservationSort {
        date: Boolean
        roomId: Boolean
        userId: Boolean
    }
    input ReservationLikeSearch {
        roomId: String
        userId: String
    }
    type FoodAndDrink {
        _id: ID!
        name: String!
        title: String!
        description: String!
        price: Float!
        isFasting: Boolean!
        rate: Float!
        time: Int!
        type: String!
        image: String!
        status: Boolean!
    }
    input FoodAndDrinkInput {
        name: String!
        title: String!
        description: String!
        price: Float!
        isFasting: Boolean!
        rate: Float!
        time: Int!
        type: String!
        image: String!
    }
    input FoodAndDrinkUpdate {
        name: String
        title: String
        description: String
        price: Float
        isFasting: Boolean
        rate: Float
        time: Int
        type: String
        status: Boolean
    }
    input FoodAndDrinkSort {
        name: Boolean
        title: Boolean
        description: Boolean
        price: Boolean
        isFasting: Boolean
        rate: Boolean
        time: Boolean
        type: Boolean
        status: Boolean
    }
    input FoodAndDrinkLikeSearch {
        name: String
        title: String
        description: String
        type: String
    }
    input FoodAndDrinkRangeSearch {
        price: Float
        rate: Float
        time: Int
    }
    type OrderedFoodAndDrink {
        _id: ID!
        amount: Int!
        orderer: User!
        status: String!
        orderedTime: String!
        food: FoodAndDrink!
    }
    input OrderedFoodAndDrinkRangeSearch {
        amount: Int
        orderedTime: String
    }
    input OrderedFoodAndDrinkLikeSearch {
        status: String
    }
    input OrderedFoodAndDrinkSort {
        amount: Boolean
        orderer: Boolean
        status: Boolean
        orderedTime: Boolean
        foodId: Boolean
    }
    type RoomService {
        _id: ID!
        name: String!
        active: Boolean!
        description: String!
        price: Float!
    }
    input RoomServiceInput {
        name: String!
        active: Boolean!
        description: String!
        price: Float!
    }
    input RoomServiceUpdate {
        name: String
        active: Boolean
        description: String
        price: Float
    }
    input RoomServiceLikeSearch {
        name: String
    }
    input RoomServiceRangeSearch {
        price: Float
    }
    input RoomServiceSort {
        name: Boolean
        active: Boolean
        price: Boolean
    }
    type OrderedRoomService {
        _id: ID!
        amount: Int!
        orderer: User!
        status: String!
        orderedTime: String!
        roomService: RoomService!
    }
    input OrderedRoomServiceRangeSearch {
        amount: Int
        orderedTime: String
    }
    input OrderedRoomServiceLikeSearch {
        status: String
    }
    input OrderedRoomServiceSort {
        amount: Boolean
        orderer: Boolean
        status: Boolean
        orderedTime: Boolean
        roomServiceId: Boolean
    }
    type Service {
        name: String!
        image: String!
        miniDescription: String!
        description: String!
    }
    input ServiceInput {
        name: String!
        image: String!
        miniDescription: String!
        description: String!
    }
    input ServiceUpdate {
        name: String
        image: String
        miniDescription: String
        description: String
    }
    input ServiceLikeSearch {
        name: String
        miniDescription: String
        description: String
    }
    input ServiceSort {
        name: Boolean
        miniDescription: Boolean
        description: Boolean
    }
    type Query {
        hello: String!
        getUsers(
            accessToken: String!
            limit: Int!
            skip: Int
            sort: UserSort
            likeSearch: UserLikeSearch
            minSearch: UserRangeSearch
            maxSearch: UserRangeSearch
            sort: ReservationSort
        ): [User]!
        getRoomTypes(
            limit: Int!
            skip: Int
            sort: RoomTypeSort
            likeSearch: RoomTypeLikeSearch
            minSearch: RoomTypeRangeSearch
            maxSearch: RoomTypeRangeSearch
        ): [RoomType]!
        getRooms(
            limit: Int!
            skip: Int
            sort: RoomSort
            likeSearch: RoomLikeSearch
            minSearch: RoomRangeSearch
            maxSearch: RoomRangeSearch
        ): [Room]!
        getReservations(
            limit: Int!
            skip: Int
            minSearch: ReservationRangeSearch
            maxSearch: ReservationRangeSearch
            likeSearch: ReservationLikeSearch
            sort: ReservationSort
        ): [Reservation]!
        getHallReservations(
            limit: Int!
            skip: Int
            minSearch: HallReservationRangeSearch
            maxSearch: HallReservationRangeSearch
            likeSearch: HallReservationLikeSearch
        ): [HallReservation]!
        getFoodAndDrinks(
            limit: Int!
            skip: Int
            minSearch: FoodAndDrinkRangeSearch
            maxSearch: FoodAndDrinkRangeSearch
            likeSearch: FoodAndDrinkLikeSearch
            sort: FoodAndDrinkSort
        ): [FoodAndDrink]!
        getOrderedFoodAndDrinks(
            accessToken: String!
            limit: Int!
            skip: Int
            minSearch: OrderedFoodAndDrinkRangeSearch
            maxSearch: OrderedFoodAndDrinkRangeSearch
            likeSearch: OrderedFoodAndDrinkLikeSearch
            sort: OrderedFoodAndDrinkSort
            my: Boolean
        ): [OrderedFoodAndDrink]!
        getRoomServices(
            limit: Int!
            skip: Int
            minSearch: RoomServiceRangeSearch
            maxSearch: RoomServiceRangeSearch
            sort: RoomServiceSort
            likeSearch: RoomServiceLikeSearch
        ): [RoomService]!
        getOrderedRoomServices(
            accessToken: String!
            limit: Int!
            skip: Int
            minSearch: OrderedRoomServiceRangeSearch
            maxSearch: OrderedRoomServiceRangeSearch
            likeSearch: OrderedRoomServiceLikeSearch
            sort: OrderedRoomServiceSort
        ): [OrderedRoomService]!
        getServices(
            limit: Int!
            skip: Int
            likeSearch: ServiceLikeSearch
            sort: ServiceSort
        ): [Service]!
    }
    type Mutation {
        domutate(slug: String!): String!
        login(email: String, phoneNumber: String, password: String!): String!
        signUp(
            email: String
            phoneNumber: String
            password: String!
            type: Int
        ): String!
        forgotPassword(email: String, phoneNumber: String): Boolean!
        sendCode(email: String, phoneNumber: String, code: Int!): String!
        changeForgottenPassword(
            tempAccessToken: String!
            password: String!
        ): Boolean!
        updateUser(
            accessToken: String!
            _id: String!
            updateData: UserInput!
        ): Boolean!
        deleteUser(accessToken: String!, _id: String!): Boolean!
        addRoomType(accessToken: String!, newData: RoomTypeInput!): String!
        updateRoomType(
            accessToken: String!
            _id: String!
            updateData: RoomTypeUpdate!
        ): Boolean!
        deleteRoomType(accessToken: String!, _id: String!): Boolean!
        addRoom(accessToken: String!, newData: RoomInput!): String!
        updateRoom(
            accessToken: String!
            _id: String!
            updateData: RoomUpdate!
        ): Boolean!
        deleteRoom(accessToken: String!, _id: String!): Boolean!
        reserveRoom(
            accessToken: String!
            _id: String!
            from: String!
            to: String!
            guests: [Int!]! #Array of [adult, children] allowed in the room
            reserver: String
        ): Boolean! #default reserver is accesstoken
        updateReservation(
            accessToken: String!
            _id: String! #this is room id
            reserver: String #this is the reserver(if not provided it's accesstoken's id thats taken(admin's use this to change another's reservation))
            newDates: [String!] #@all  -   give date in year/month/date format
            cancelDates: [String!]
            currentDates: [String!] # if guests are getting updated set the dates in the array. for convenience dont send cancel dates and current dates
            guests: [Int!]! # this is the updated guests data
        ): [Boolean!]! #[edited?,cancelled?,inserted?]
        reserveHall(
            accessToken: String!
            from: String!
            to: String!
            reserver: String
            hallId: String!
        ): String!
        editHallReservation(
            accessToken: String!
            reservationId: String!
            from: String!
            to: String!
        ): Boolean!
        cancelHallReservation(
            accessToken: String!
            reservationId: String!
        ): Boolean!
        addFoodAndDrink(
            accessToken: String!
            newData: FoodAndDrinkInput!
        ): String!
        updateFoodAndDrink(
            accessToken: String!
            updateData: FoodAndDrinkUpdate!
            _id: String!
        ): Boolean!
        deleteFoodAndDrink(accessToken: String!, _id: String!): Boolean!
        orderFood(
            accessToken: String!
            foodId: String!
            amount: Int!
            orderer: String
        ): String!
        updateOrderedFood(
            accessToken: String!
            orderId: String!
            foodId: String
            amount: Int
            status: String
        ): Boolean!
        addRoomService(
            accessToken: String!
            newData: RoomServiceInput!
        ): String!
        updateRoomService(
            accessToken: String!
            updateData: RoomServiceUpdate!
            _id: String!
        ): Boolean!
        deleteRoomService(accessToken: String!, _id: String!): Boolean!
        orderRoomService(
            accessToken: String!
            roomServiceId: String!
            amount: Int!
            orderer: String
        ): String!
        updateOrderedRoomService(
            accessToken: String!
            orderId: String!
            roomServiceId: String
            amount: Int
            status: String
        ): Boolean!
        addService(accessToken: String!, newData: ServiceInput!): String!
        updateService(
            accessToken: String!
            updateData: ServiceUpdate!
            _id: String!
        ): Boolean!
        deleteService(accessToken: String!, _id: String!): Boolean!
    }
    type Subscription {
        animalAdded: String
    }
`;
module.exports = typeDefs;
