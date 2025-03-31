
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
    comments: [{
        text: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
        createdAt: { type: Date, default: Date.now }
      }],
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