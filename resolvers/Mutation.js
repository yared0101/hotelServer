const pgp = require("pg-promise")();
const { sign, verify } = require("jsonwebtoken");
const error = require("../error");
const { compare, genSalt, hash } = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
try {
    const uri = "mongodb://localhost:27017";
    var client = new MongoClient(uri);
} catch (e) {
    throw "couldn't connect to database";
}
const validation = {
    //checked email,name,phone no, dateofbirth
    checkPhoneNumber: (phone_number) => {
        if (phone_number.length !== 9)
            throw error("Phone number Length must be 9", "phone_number");
        if (phone_number[0] !== "9")
            throw error("Phone number must start with 9", "phone_number");
        if (phone_number.match("[0-9]{9}")) {
            return { success: true };
        }
        throw error("phone number characters must be Numbers", "phone_number");
    },
    checkTime: (time) => {
        return true;
    },
    checkAmount: (amount) => {
        return true;
    },
    checkRate: (rate) => {
        if (rate < 0 || rate > 5)
            throw error("rate should be in 0-5 range", "rate");
        return true;
    },
    checkPrice: (price) => {
        if (price.length != 2)
            throw error(
                "please enter [weekday,weekend] price format",
                "price",
                "BAD_PROGRAMMER_INPUT"
            );
    },
    checkNormalPrice: (price) => {
        return true;
    },
    checkAccountNumber: (account_number) => {
        if (account_number.length !== 9)
            throw error("Account number Length must be 9", "account_number");
        if (account_number.match("[0-9]{9}")) {
            return { success: true };
        }
        throw error(
            "Account number characters must be numbers",
            "account_number"
        );
    },
    checkEmail: (email) => {
        if (email.match(".+@.+[.].+")) return { success: true };
        else {
            throw error(
                "email format must contain @ and . in the middle somewhere",
                "email"
            );
        }
    },
    checkUserType: async (user_type) => {
        return { success: true };
    },
    checkName: (name) => {
        //used for protector_duties
        return { success: true };
    },
    checkPassword: (password) => {
        if (password.length < 8)
            throw error("password length must be at least 8", "password");
        return { success: true };
    },
    checkAddress: (address) => {
        return { success: true };
    },
    checkDateOfBirth: (date_of_birth) => {
        const dates = date_of_birth.split("/");
        // const year =Number(dates[0]);
        // const month =Number(dates[1]);
        // const date =Number(dates[2]);
        // const currentTime = new Date();
        // if(!year || year<1000 || year > currentTime.getFullYear())
        //     throw error( "Date - Year data is wrong",)
        // if(!month || month < 1 || month > 12){
        //     throw error( "Date - Month data is wrong",)
        // }
        // if(!date || date < 1 || date > 31)
        //     throw error( "Date - day data is wrong",)
        // if(year === currentTime.getFullYear()){
        //     if(month > currentTime.getMonth()+1 || (month == currentTime.getMonth()+1 && date > currentTime.getDate()))
        //         throw error( "Date - Ahead of time",)
        // }
        let tempDate;
        try {
            tempDate = new Date(date_of_birth);
        } catch {
            throw error(
                "Date - Parsing Incorrect(Should be MM/DD/YYYY format)",
                "date_of_birth"
            );
        }
        if (!tempDate.getDate()) {
            throw error(
                "Date - Parsing Incorrect(Should be MM/DD/YYYY format)",
                "date_of_birth"
            );
        }
        const current_date = new Date();
        if (current_date < tempDate) {
            throw error("Date - Ahead of time", "date_of_birth");
        }

        return { success: true, value: tempDate.toLocaleDateString() };
    },
    checkPinCode: (pin_code) => {
        if (pin_code > 10000 && pin_code < 100000) return { success: true };
        throw error("PinCode out of range", "pin_code");
    },
    returnIdentifier: (phoneNumber, email) => {
        const phone_val =
            phoneNumber && validation.checkPhoneNumber(phoneNumber).success;
        const email_val = email && validation.checkEmail(email).success;
        if (phone_val) return { phoneNumber };
        else if (email_val) return { email };
        else
            throw error(
                "No identifier(phone_number or email) has been given",
                "identifier"
            );
    },
    returnUpdatePassword: async (password, identifier, _client) => {
        const client = _client();
        if (password.length != 2) {
            throw error(
                "follow the format of [old,new] password",
                "password",
                "BAD_PROGRAMMER_INPUT"
            );
        }
        try {
            await client.connect();
            const data = await client
                .db("myHotel")
                .collection("user")
                .findOne(identifier, { projection: { password: 1, _id: 0 } });
            const passwordIsValid = await compare(password[0], data.password);
            if (!passwordIsValid)
                throw {
                    error: error("wrong Password", "password[0]"),
                    type: "myError",
                };
            try {
                validation.checkPassword(password[1]);
            } catch (e) {
                throw { error: e, type: "myError" };
            }
            const salt = await genSalt(10);
            return await hash(password[1], salt);
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    checkRoles: async () => {
        //TODO check if the roles given for update are valid and are from the table roles
        return true;
    },
    checkRoomType: async (roomType, _client) => {
        const client = _client();
        try {
            await client.connect();
            const { name } = await client
                .db("myHotel")
                .collection("roomType")
                .findOne(
                    { name: roomType },
                    { projection: { name: 1, _id: -1 } }
                );
            if (name) return true;
            else
                throw {
                    type: "myError",
                    error: error("room type doesn't exist", "roomType"),
                };
        } catch (e) {
            console.log(e);
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
};
const dateArrayCompare = (array, element) => {
    for (let i in array) {
        if (array[i].getTime() == element.getTime()) return Number(i);
    }
    return -1;
};
const Mutation = {
    domutate: (_, { slug }, { pubsub }) => {
        pubsub.publish("ANIMAL_CREATED", { animalAdded: "mutated" });
        return slug;
    },
    login: async (
        _,
        { email, phoneNumber, password },
        { _client, ACCESS_KEY, checkSize }
    ) => {
        const { returnIdentifier } = validation;
        const expireDate = "1y";
        const identifier = returnIdentifier(phoneNumber, email);
        checkSize({ ...identifier, password });
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("user")
                .findOne(identifier, { projection: { password: 1, _id: 1 } });
            if (!result) {
                let identifierKey;
                for (let i in identifier) {
                    identifierKey = i;
                    break;
                }
                throw {
                    error: error(
                        `${identifierKey} isn't registered`,
                        identifierKey
                    ),
                    type: "myError",
                };
            }
            const passwordIsValid = await compare(password, result.password);
            if (!passwordIsValid)
                throw {
                    error: error("wrong Password", "password"),
                    type: "myError",
                };
            const accessToken = sign(
                {
                    _id: result._id,
                },
                process.env.ACCESS_KEY,
                { expiresIn: expireDate }
            );
            return accessToken;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    signUp: async (
        _,
        { email, phoneNumber, password, type = 1 },
        { _client, checkSize }
    ) => {
        const { returnIdentifier, checkPassword } = validation;
        checkSize({ password, email, type, phoneNumber });
        const identifier = returnIdentifier(phoneNumber, email);
        checkPassword(password);
        let sendData = { type };
        if (email) sendData["email"] = email;
        if (phoneNumber) sendData["phoneNumber"] = phoneNumber;
        const salt = await genSalt(10);
        const hashPassword = await hash(password, salt);
        sendData["password"] = hashPassword;
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("user")
                .countDocuments(identifier);
            if (result) {
                let identifierKey;
                for (let i in identifier) {
                    identifierKey = i;
                    break;
                }
                throw {
                    error: error(
                        `user already registered with this ${identifierKey}`,
                        identifierKey
                    ),
                    type: "myError",
                };
            }
            const data = await client
                .db("myHotel")
                .collection("user")
                .insertOne(sendData);
            if (data.acknowledged) return data.insertedId;
            throw "error";
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    forgotPassword: async (
        _,
        { email, phoneNumber },
        { _client, checkSize }
    ) => {
        const { returnIdentifier } = validation;
        const identifier = returnIdentifier(phoneNumber, email);
        checkSize(identifier);
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("user")
                .countDocuments(identifier);
            if (!result) {
                let identifierKey;
                for (let i in identifier) {
                    identifierKey = i;
                    break;
                }
                throw {
                    error: error(
                        `${identifierKey} doesn't exist`,
                        identifierKey
                    ),
                    type: "myError",
                };
            }
            const date = new Date();
            let code = 123434;
            //todo... use the below code instead and send the code really to the email
            //const code = Math.floor(Math.random()*1000000)
            if (code < 100000) {
                code += 100000;
            }
            const salt = await genSalt(10);
            code = await hash(String(code), salt);
            const sendData = { volatileCode: { date, code } };
            const setCode = await client
                .db("myHotel")
                .collection("user")
                .updateOne(identifier, { $set: sendData });
            if (!setCode.acknowledged) throw "error";
            return true;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    sendCode: async (
        _,
        { email, phoneNumber, code },
        { _client, ACCESS_KEY, checkSize }
    ) => {
        const maxAllowedTime = 1000 * 60 * 30; //30 minutes after forgot password called
        const { returnIdentifier } = validation;
        const identifier = returnIdentifier(phoneNumber, email);
        checkSize({ ...identifier, code });
        const client = _client();
        try {
            await client.connect();
            const { volatileCode, _id } = await client
                .db("myHotel")
                .collection("user")
                .findOne(identifier, {
                    projection: { _id: 1, volatileCode: 1 },
                });
            if (!volatileCode) {
                let identifierKey;
                for (let i in identifier) {
                    identifierKey = i;
                    break;
                }
                throw {
                    error: error(
                        `no code has been sent to this ${identifierKey}`,
                        identifierKey
                    ),
                    type: "myError",
                };
            }
            const now = new Date();
            if (now - volatileCode.date > maxAllowedTime)
                throw {
                    error: error("the code has expired", "code"),
                    type: "myError",
                };
            const passwordIsValid = await compare(
                String(code),
                volatileCode.code
            );
            if (!passwordIsValid)
                throw {
                    error: error("Wrong code given", "code"),
                    type: "myError",
                };
            const tempAccessToken = sign(
                {
                    tempId: _id,
                },
                ACCESS_KEY,
                { expiresIn: "1h" }
            );
            return tempAccessToken;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    changeForgottenPassword: async (
        _,
        { tempAccessToken, password },
        { _client, checkSize }
    ) => {
        const { checkPassword } = validation;
        checkPassword(password);
        checkSize({ password });
        const salt = await genSalt(10);
        password = await hash(password, salt);
        let payLoad;
        try {
            payLoad = verify(tempAccessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "tempAccessToken");
        }
        const client = _client();
        try {
            await client.connect();
            const data = await client
                .db("myHotel")
                .collection("user")
                .updateOne(
                    { _id: new ObjectId(payLoad.tempId) },
                    { $set: { password } }
                );
            if (!data.modifiedCount) throw "error";
            return true;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    updateUser: async (
        _,
        { accessToken, _id, updateData },
        { _client, checkSize, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const {
            returnUpdatePassword,
            checkName,
            checkRoles,
            checkEmail,
            checkPhoneNumber,
        } = validation;
        const { accessTokenRights } = right;
        const identifier = { _id: new ObjectId(_id) };
        accessTokenRights(payLoad, identifier);
        if (updateData["password"]) {
            updateData["password"] = await returnUpdatePassword(
                updateData["password"],
                identifier,
                _client
            );
        }
        updateData.name &&
            checkName(updateData.name) &&
            checkSize({ name: updateData.name });
        updateData.email &&
            checkEmail(updateData.email) &&
            checkSize({ email: updateData.email });
        updateData.phoneNumber &&
            checkPhoneNumber(updateData.phoneNumber) &&
            checkSize({ phoneNumber: updateData.phoneNumber });
        updateData.role && checkRoles(updateData.role);
        const client = _client();
        try {
            await client.connect();
            let result = null;
            let key = "";
            if (updateData.email) {
                key = "email";
                result = await client
                    .db("myHotel")
                    .collection("user")
                    .countDocuments({
                        email: updateData.email,
                        _id: { $ne: identifier._id },
                    });
            } else if (updateData.phoneNumber) {
                key = "phoneNumber";
                result = await client
                    .db("myHotel")
                    .collection("user")
                    .countDocuments({
                        phoneNumber: updateData.phoneNumber,
                        _id: { $ne: identifier._id },
                    });
            }
            if (result) {
                throw {
                    error: error(
                        `user already registered with this ${key}`,
                        key
                    ),
                    type: "myError",
                };
            }
            const data = await client
                .db("myHotel")
                .collection("user")
                .updateOne(identifier, { $set: updateData });
            return Boolean(data.modifiedCount);
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    deleteUser: async (_, { accessToken, _id }, { _client, right }) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const { accessTokenRights } = right;
        const identifier = { _id: new ObjectId(_id) };
        accessTokenRights(payLoad, identifier);
        const client = _client();
        try {
            await client.connect();
            const data = await client
                .db("myHotel")
                .collection("user")
                .deleteOne(identifier);
            return Boolean(data.deletedCount);
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    addRoomType: async (
        _,
        { accessToken, newData },
        { _client, checkSize, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const { accessTokenPower } = right;
        accessTokenPower(payLoad, "roomType", 2);
        const { checkName, checkPrice } = validation;
        checkSize({ name: newData.name });
        checkSize({ description: newData.description }, 300);
        checkName(newData.name);
        checkPrice(newData.price);
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("roomType")
                .countDocuments({ name: newData.name });
            if (result) {
                throw {
                    error: error(
                        `room type already exists with this name`,
                        "name"
                    ),
                    type: "myError",
                };
            }
            const data = await client
                .db("myHotel")
                .collection("roomType")
                .insertOne(newData);
            return data.insertedId;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    updateRoomType: async (
        _,
        { accessToken, _id, updateData },
        { _client, checkSize, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const { accessTokenPower } = right;
        accessTokenPower(payLoad, "roomType", 2);
        const { checkName, checkPrice } = validation;
        updateData.name && checkSize({ name: updateData.name });
        updateData.description &&
            checkSize({ description: updateData.description }, 300);
        updateData.name && checkName(updateData.name);
        updateData.price && checkPrice(updateData.price);
        if (updateData.holidayPriceAndDay) {
            const { holidayPriceAndDay } = updateData;
            for (let i = 0; i < holidayPriceAndDay.length; i++) {
                let element = holidayPriceAndDay[i];
                if (Number(element[0]) !== 0 && !Number(element[0]))
                    throw error(
                        "the first index of the array must be float",
                        "holidayPriceAndDay",
                        "BAD_PROGRAMMER_INPUT"
                    );
                const temp = (updateData.holidayPriceAndDay[i][1] = new Date(
                    element[1]
                ));
                if (!temp.getDate())
                    throw error(
                        "the second index of the array must be date",
                        "holidayPriceAndDay",
                        "BAD_PROGRAMMER_INPUT"
                    );
            }
        }
        const identifier = { _id: new ObjectId(_id) };
        const client = _client();
        try {
            await client.connect();
            let nameResult;
            if (updateData.name)
                nameResult = await client
                    .db("myHotel")
                    .collection("roomType")
                    .countDocuments({
                        name: updateData.name,
                        _id: { $ne: identifier._id },
                    });
            if (nameResult) {
                throw {
                    error: error(
                        `room type already exists with this name`,
                        "name"
                    ),
                    type: "myError",
                };
            }
            const result = await client
                .db("myHotel")
                .collection("roomType")
                .countDocuments(identifier);
            if (!result) {
                throw {
                    error: error("no room type exists with this _id", "_id"),
                    type: "myError",
                };
            }
            const data = await client
                .db("myHotel")
                .collection("roomType")
                .updateOne(identifier, { $set: updateData });
            return Boolean(data.modifiedCount);
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    deleteRoomType: async (_, { accessToken, _id }, { _client, right }) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const identifier = { _id: new ObjectId(_id) };
        const { accessTokenPower } = right;
        accessTokenPower(payLoad, "roomType", 2);
        const client = _client();
        try {
            await client.connect();
            const data = await client
                .db("myHotel")
                .collection("roomType")
                .deleteOne(identifier);
            return Boolean(data.deletedCount);
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    addRoom: async (
        _,
        { accessToken, newData },
        { _client, right, checkSize }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const { accessTokenPower } = right;
        accessTokenPower(payLoad, "rooms", 2);
        const { checkName, checkPrice, checkRoomType } = validation;
        checkSize({ roomId: newData.roomId });
        await checkRoomType(newData.type, _client);
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("rooms")
                .countDocuments({ roomId: newData.roomId });
            if (result) {
                throw {
                    error: error(`room already exists with this id`, "roomId"),
                    type: "myError",
                };
            }
            const data = await client
                .db("myHotel")
                .collection("rooms")
                .insertOne(newData);
            return data.insertedId;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    updateRoom: async (
        _,
        { accessToken, _id, updateData },
        { _client, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const { accessTokenPower } = right;
        accessTokenPower(payLoad, "rooms", 2);

        if (updateData.type) {
            const { checkRoomType } = validation;
            await checkRoomType(updateData.type, client);
        }
        const identifier = { _id: new ObjectId(_id) };
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("rooms")
                .countDocuments(identifier);
            if (!result) {
                throw {
                    error: error("no room exists with this _id", "_id"),
                    type: "myError",
                };
            }
            let roomIdResult;
            if (updateData.roomId)
                roomIdResult = await client
                    .db("myHotel")
                    .collection("rooms")
                    .countDocuments({
                        roomId: updateData.roomId,
                        _id: { $ne: identifier._id },
                    });
            if (roomIdResult) {
                console.log({
                    roomId: updateData.roomId,
                    _id: { $ne: identifier._id },
                });
                throw {
                    error: error(
                        `room already exists with this roomId`,
                        "roomId"
                    ),
                    type: "myError",
                };
            }
            const data = await client
                .db("myHotel")
                .collection("rooms")
                .updateOne(identifier, { $set: updateData });
            return Boolean(data.modifiedCount);
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    reserveRoom: async (
        _,
        { accessToken, _id, from, to, reserver, guests },
        { _client, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        if (!(guests.length == 2)) {
            throw error(
                "send guests in the format [adult number,children number]",
                "guests"
            );
        }
        from = new Date(from);
        to = new Date(to);
        const now = new Date();
        if (!to.getDate()) {
            throw error("to isn't a valid date", "to");
        }
        if (!from.getDate()) {
            throw error("from isn't a valid date", "from");
        }
        if (from < now && from.getDate() < now.getDate()) {
            throw error("from can't be an already passed date", "from");
        }
        if (to < from && to.getDate() < from.getDate()) {
            throw error("to can't be less than from", "to");
        }
        if (reserver) {
            //check if access token person has right to register a reserver person!
        }
        const identifier = { roomId: new ObjectId(_id) };
        const reserverIdentifier = {
            userId: reserver
                ? new ObjectId(reserver)
                : new ObjectId(payLoad._id),
        };
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("rooms")
                .countDocuments({ _id: identifier.roomId });
            if (!result) {
                throw {
                    error: error("no room exists with this _id", "_id"),
                    type: "myError",
                };
            }
            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const reservedCursor = client
                .db("myHotel")
                .collection("reservations")
                .find(
                    { date: { $gt: yesterday }, ...identifier },
                    {
                        projection: { _id: -1, date: 1 },
                    }
                );
            const reservedData = await reservedCursor.toArray();
            reservedData.map((element) => {
                if (element.date >= from && element.date <= to) {
                    throw {
                        error: error(
                            `room has already been reserved in ${element.date}`,
                            "from"
                        ),
                        type: "myError",
                    };
                }
            });
            const reservationData = {
                ...identifier,
                ...reserverIdentifier,
                guests,
            };
            let newReservationData = [{ date: from, ...reservationData }];
            let a = new Date(from);
            const diff = (to.getTime() - from.getTime()) / (1000 * 3600 * 24);
            for (let i = 0; i < diff; i++) {
                a.setDate(a.getDate() + 1);
                newReservationData.push({ date: a, ...reservationData });
            }
            const data = await client
                .db("myHotel")
                .collection("reservations")
                .insertMany(newReservationData);
            return Boolean(data.insertedCount);
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    updateReservation: async (
        _,
        {
            accessToken,
            _id,
            newDates,
            cancelDates,
            currentDates,
            guests,
            reserver,
        },
        { _client, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        if (!currentDates && !newDates && !cancelDates) {
            throw error("No data has been sent for update", "updateData");
        }
        const identifier = { roomId: new ObjectId(_id) };
        const reserverIdentifier = {
            userId: reserver
                ? new ObjectId(reserver)
                : new ObjectId(payLoad._id),
        };
        //TODO check if access token person has right to register/update a reserver person's reservation! i dont wanna figure this out yet
        if (!(guests.length == 2)) {
            throw error(
                "send guests in the format [adult number,children number]",
                "guests"
            );
        }
        const now = new Date();
        if (newDates)
            newDates = newDates.map((element) => {
                const temp = new Date(element);
                if (!temp.getDate()) {
                    throw error("newDates data isn't a valid date", "newDates");
                }
                if (temp < now && temp.getDate() < now.getDate()) {
                    throw error(
                        "newDates data can't be an already passed date",
                        "newDates"
                    );
                }
                return temp;
            });
        if (currentDates)
            currentDates = currentDates.map((element) => {
                const temp = new Date(element);
                if (!temp.getDate()) {
                    throw error(
                        "currentDates data isn't a valid date",
                        "currentDates"
                    );
                }
                if (temp < now && temp.getDate() < now.getDate()) {
                    throw error(
                        "currentDates data can't be an already passed date",
                        "currentDates"
                    );
                }
                return temp;
            });
        if (cancelDates)
            cancelDates = cancelDates.map((element) => {
                const temp = new Date(element);
                if (!temp.getDate()) {
                    throw error(
                        "cancelDates data isn't a valid date",
                        "cancelDates"
                    );
                }
                if (temp < now && temp.getDate() < now.getDate()) {
                    throw error(
                        "cancelDates data can't be an already passed date",
                        "cancelDates"
                    );
                }
                return temp;
            });
        const client = _client();
        try {
            await client.connect();
            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const reservedCursor = client
                .db("myHotel")
                .collection("reservations")
                .find({
                    date: { $gt: yesterday },
                    ...identifier,
                    ...reserverIdentifier,
                });
            const reservedData = await reservedCursor.toArray();
            const dateArray = reservedData.map((element) => element.date);
            let returnData = [];
            if (currentDates) {
                currentDates.forEach((element) => {
                    if (dateArrayCompare(dateArray, element) === -1) {
                        throw {
                            type: "myError",
                            error: error(
                                `currentDates ${element} isn't already reserved`,
                                "currentDates"
                            ),
                        };
                    }
                });
                const currentResult = await client
                    .db("myHotel")
                    .collection("reservations")
                    .updateMany(
                        { date: { $in: currentDates }, ...identifier },
                        { $set: { guests } }
                    );
                returnData.push(Boolean(currentResult.modifiedCount));
            } else {
                returnData.push(false);
            }
            if (cancelDates) {
                cancelDates.forEach((element) => {
                    if (dateArrayCompare(dateArray, element) === -1) {
                        throw {
                            type: "myError",
                            error: error(
                                `cancelDates ${element} isn't already reserved`,
                                "cancelDates"
                            ),
                        };
                    }
                });
                const cancelResult = await client
                    .db("myHotel")
                    .collection("reservations")
                    .deleteMany({ date: { $in: cancelDates }, ...identifier });
                returnData.push(Boolean(cancelResult.deletedCount));
            } else {
                returnData.push(false);
            }
            if (newDates) {
                console.log(dateArray);
                newDates.forEach((element) => {
                    console.log(dateArrayCompare(dateArray, element));
                    if (dateArrayCompare(dateArray, element) !== -1) {
                        throw {
                            type: "myError",
                            error: error(
                                `newDates ${element} is already reserved`,
                                "newDates"
                            ),
                        };
                    }
                });
                const newData = {
                    ...identifier,
                    ...reserverIdentifier,
                    guests,
                };
                const insertData = newDates.map((element) => {
                    return { date: element, ...newData };
                });
                const newResult = await client
                    .db("myHotel")
                    .collection("reservations")
                    .insertMany(insertData);
                returnData.push(Boolean(newResult.insertedCount));
            } else {
                returnData.push(false);
            }
            return returnData;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    reserveHall: async (
        _,
        { accessToken, hallId, from, to, reserver },
        { _client, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        from = new Date(from);
        to = new Date(to);
        const now = new Date();
        if (!to.getDate()) {
            throw error("to isn't a valid datetime", "to");
        }
        if (!from.getDate()) {
            throw error("from isn't a valid datetime", "from");
        }
        if (from < now) {
            throw error("from can't be an already passed datetime", "from");
        }
        if (to < from) {
            throw error("to can't be less than from", "to");
        }
        if (reserver) {
            //check if access token person has right to register a reserver person!
        }
        const identifier = { hallId: new ObjectId(hallId) };
        const reserverIdentifier = {
            userId: reserver
                ? new ObjectId(reserver)
                : new ObjectId(payLoad._id),
        };
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("halls")
                .countDocuments({ _id: identifier.hallId });
            if (!result) {
                throw {
                    error: error("no hall exists with this _id", "hallId"),
                    type: "myError",
                };
            } // continue from this point im about to die!
            const reservationData = {
                ...identifier,
                ...reserverIdentifier,
                from,
                to,
            };
            const data = await client
                .db("myHotel")
                .collection("hallReservations")
                .insertOne(reservationData);
            return data.insertedId;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    editHallReservation: async (
        _,
        { accessToken, from, to, reservationId },
        { _client, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        from = new Date(from);
        reservationId = new ObjectId(reservationId);
        to = new Date(to);
        const now = new Date();
        if (!to.getDate()) {
            throw error("to isn't a valid datetime", "to");
        }
        if (!from.getDate()) {
            throw error("from isn't a valid datetime", "from");
        }
        if (from < now) {
            throw error("from can't be an already passed datetime", "from");
        }
        if (to < from) {
            throw error("to can't be less than from", "to");
        }
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("hallReservations")
                .findOne(
                    { _id: reservationId },
                    { projection: { _id: 0, userId: 1 } }
                );
            if (!result) {
                throw {
                    error: error(
                        "no reservation exists with this _id",
                        "reservationId"
                    ),
                    type: "myError",
                };
            }
            if (String(result.userId) !== String(payLoad._id)) {
                const { accessTokenPower } = right;
                accessTokenPower(payLoad, "hallReservation", 2);
            }
            const data = await client
                .db("myHotel")
                .collection("hallReservations")
                .updateOne({ _id: reservationId }, { $set: { from, to } });
            return Boolean(data.modifiedCount);
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    cancelHallReservation: async (
        _,
        { accessToken, reservationId },
        { _client, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        reservationId = new ObjectId(reservationId);
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("hallReservations")
                .findOne(
                    { _id: reservationId },
                    { projection: { _id: 0, userId: 1 } }
                );
            if (!result) {
                throw {
                    error: error(
                        "no reservation exists with this _id",
                        "reservationId"
                    ),
                    type: "myError",
                };
            }
            if (String(result.userId) !== String(payLoad._id)) {
                const { accessTokenPower } = right;
                accessTokenPower(payLoad, "hallReservation", 2);
            }
            const data = await client
                .db("myHotel")
                .collection("hallReservations")
                .deleteOne({ _id: reservationId });
            return Boolean(data.deletedCount);
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    addFoodAndDrink: async (
        _,
        { accessToken, newData },
        { _client, checkSize, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const { accessTokenPower } = right;
        accessTokenPower(payLoad, "foodAndDrinks", 2);
        const { checkName, checkNormalPrice, checkRate, checkTime } =
            validation;
        checkSize({
            name: newData.name,
            title: newData.title,
            type: newData.type,
        });
        checkSize({ description: newData.description }, 300);
        checkRate(newData.rate);
        checkTime(newData.time);
        checkName(newData.name);
        checkNormalPrice(newData.price);
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("foodAndDrinks")
                .countDocuments({ name: newData.name });
            if (result) {
                throw {
                    error: error(`food already exists with this name`, "name"),
                    type: "myError",
                };
            }
            const data = await client
                .db("myHotel")
                .collection("foodAndDrinks")
                .insertOne(newData);
            return data.insertedId;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    updateFoodAndDrink: async (
        _,
        { accessToken, updateData, _id },
        { _client, checkSize, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const { accessTokenPower } = right;
        accessTokenPower(payLoad, "foodAndDrinks", 2);
        const { checkName, checkNormalPrice, checkRate, checkTime } =
            validation;
        checkSize({
            name: updateData.name || " ",
            title: updateData.title || " ",
            type: updateData.type || " ",
        });
        updateData.description
            ? checkSize({ description: updateData.description }, 300)
            : {};
        updateData.rate ? checkRate(updateData.rate) : {};
        updateData.time ? checkTime(updateData.time) : {};
        updateData.name ? checkName(updateData.name) : {};
        updateData.price ? checkNormalPrice(updateData.price) : {};
        const identifier = { _id: new ObjectId(_id) };
        const client = _client();
        try {
            await client.connect();
            if (updateData.name) {
                const result = await client
                    .db("myHotel")
                    .collection("foodAndDrinks")
                    .countDocuments({
                        name: updateData.name,
                        _id: { $ne: identifier._id },
                    });
                if (result) {
                    throw {
                        error: error(
                            `food already exists with this name`,
                            "name"
                        ),
                        type: "myError",
                    };
                }
            }
            const data = await client
                .db("myHotel")
                .collection("foodAndDrinks")
                .updateOne(identifier, { $set: updateData });
            return data.modifiedCount;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    deleteFoodAndDrink: async (_, { accessToken, _id }, { _client, right }) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const identifier = { _id: new ObjectId(_id) };
        const { accessTokenPower } = right;
        accessTokenPower(payLoad, "foodAndDrink", 2);
        const client = _client();
        try {
            await client.connect();
            const data = await client
                .db("myHotel")
                .collection("foodAndDrinks")
                .deleteOne(identifier);
            return Boolean(data.deletedCount);
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    orderFood: async (
        _,
        { accessToken, amount, foodId, orderer },
        { _client, checkSize, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        orderer = orderer ? new ObjectId(orderer) : new ObjectId(payLoad._id);
        const { checkAmount } = validation;
        checkAmount(amount);
        foodId = new ObjectId(foodId);
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("foodAndDrinks")
                .countDocuments({ _id: foodId });
            if (!result) {
                throw {
                    error: error(`food doesn't exist with this id`, "foodId"),
                    type: "myError",
                };
            }
            const data = await client
                .db("myHotel")
                .collection("orderedFoodAndDrinks")
                .insertOne({
                    foodId,
                    amount,
                    orderer,
                    status: "ordered",
                    orderedTime: new Date(),
                });
            return data.insertedId;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
    updateOrderedFood: async (
        _,
        { accessToken, orderId, amount, foodId, status },
        { _client, checkSize, right }
    ) => {
        let payLoad;
        try {
            payLoad = verify(accessToken, process.env.ACCESS_KEY);
        } catch (e) {
            throw error("Invalid or Expired Access Token", "accessToken");
        }
        const { checkAmount } = validation;
        if (!amount && !status && !foodId) {
            throw error("no data sent for update", "updateData");
        }
        amount ? checkAmount(amount) : {};
        const client = _client();
        try {
            await client.connect();
            const result = await client
                .db("myHotel")
                .collection("orderedFoodAndDrinks")
                .findOne(
                    { _id: new ObjectId(orderId) },
                    { projection: { status: 1, _id: 0, orderer: 1 } }
                );
            if (!result) {
                throw {
                    error: error(`order doesn't exist with this id`, "orderId"),
                    type: "myError",
                };
            }
            if (status) {
                const allStatus = [
                    "ordered",
                    "started",
                    "completed",
                    "cancelled",
                ];
                if (allStatus.indexOf(status) === -1) {
                    throw {
                        error: error(
                            'status must be one of "ordered", "completed", "cancelled"',
                            "status"
                        ),
                        type: "myError",
                    };
                }
            }
            const notChangedStatus = ["completed", "started"];
            if (notChangedStatus.indexOf(result.status) !== -1)
                throw {
                    error: error(
                        `order is already ${result.status}`,
                        "orderId"
                    ),
                    type: "myError",
                };
            if (foodId) {
                const result = await client
                    .db("myHotel")
                    .collection("foodAndDrinks")
                    .countDocuments({ _id: foodId });
                if (!result) {
                    throw {
                        error: error(
                            `food doesn't exist with this id`,
                            "foodId"
                        ),
                        type: "myError",
                    };
                }
            }
            let updateData = {};
            if (foodId) updateData["foodId"] = new Object(foodId);
            if (amount) updateData["amount"] = amount;
            if (status) updateData["status"] = status;
            const data = await client
                .db("myHotel")
                .collection("orderedFoodAndDrinks")
                .updateOne(
                    { _id: new ObjectId(orderId) },
                    { $set: updateData }
                );
            return data.modifiedCount;
        } catch (e) {
            if (e.type === "myError") throw e.error;
            throw "something went wrong";
        } finally {
            await client.close();
        }
    },
};
module.exports = Mutation;
/*
My God level code
for (
                    let i = result.reservedDates.length - 1;
                    i >= 0 && result.reservedDates[i].to > now;
                    i--
                ) {
                    if (from <= result.reservedDates[i].to) {
                        if (from == result.reservedDates[i].to)
                            throw {
                                error: error(
                                    "room has already been reserved in this dates",
                                    "from"
                                ),
                                type: "myError",
                            };
                        else if (
                            to >= result.reservedDates[i].from ||
                            from >= result.reservedDates[i].from
                        ) {
                            throw {
                                error: error(
                                    "room has already been reserved in this dates",
                                    "from"
                                ),
                                type: "myError",
                            };
                        } else if (from > result.reservedDates[i - 1].to) {
                            break;
                        }
                    }
                }
*/
