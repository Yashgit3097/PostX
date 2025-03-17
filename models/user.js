
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://yashgandhi907:tb8YvGPAN3vYMD56@yashclustre.wrock.mongodb.net/?retryWrites=true&w=majority&appName=YashClustre');

const userSchema = mongoose.Schema({
   
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'post'
        }
    ]
});

module.exports = mongoose.model('user', userSchema);