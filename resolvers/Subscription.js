const Subscription = {
    animalAdded:{
        subscribe:(_parent,_args,{pubsub})=>pubsub.asyncIterator(['ANIMAL_CREATED']),
    }
}
module.exports = Subscription;