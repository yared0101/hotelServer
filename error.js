const  {UserInputError, ApolloError} = require('apollo-server')
const error=(message,key,errorCode = 'BAD_USER_INPUT')=>{
    if(errorCode == 'BAD_USER_INPUT'){
        return new UserInputError(message,{
            argumentName:key
        })
    }
    else{
        return new ApolloError(message,errorCode,{
            argumentName:key
        })
    }
}
module.exports = error;