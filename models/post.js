
const mongoose = require('mongoose');



const postSchema = mongoose.Schema({
    image: { 
        data: Buffer, 
        contentType: String 
    }, 
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    title: String,

    content: String,
    
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ]
});

module.exports = mongoose.model('post', postSchema);