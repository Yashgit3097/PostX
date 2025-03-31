const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const session = require('express-session');
const user = require('./models/user');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Use session middleware

// Serve static files (like CSS, images)
app.use(express.static('public'));
app.use(cookieParser());
// Session setup
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
}));

app.use((req, res, next) => {
  if (!req.session.firstVisit) {
      req.session.firstVisit = true;
  } else {
      req.session.firstVisit = false;
  }
  next();
});

//for render register page
app.get('/', (req, res) => {
  res.render('index');
});
// for register the user into database
app.post('/register', async (req, res) => {
  const { username, name, age, email, password } = req.body;
 const user = await userModel.findOne({ email });
 const userNmae = await userModel.findOne({ username });
 if (user || userNmae) return res.send('User already exists');

 bcrypt.genSalt(10, (err, salt) => {
  bcrypt.hash(password, salt, async (err, hash) => {
     let user = userModel.create({
      username,
      name,
      age,
      email,
      password: hash
     });

    let token = jwt.sign({email: email, userid: user._id},"shhhh");
      res.cookie('token', token);
      res.redirect('/login');
  });
 });
 
});
//for render Login page
app.get('/login', (req, res) => {
    res.render('login');
  });
//for login user with help uof registered user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
 const user = await userModel.findOne({ email });
 if (!user) return res.send('Something went wrong');

bcrypt.compare(password, user.password , (err, result) => {
  if (result){
      let token = jwt.sign({email: email, userid: user._id},"shhhh");
      res.cookie('token', token);
      return res.redirect('/profile');
  }
  else res.redirect('/login');
});
  
 
});

app.get('/comment/:id', async (req, res) => {
  try {
    const post = await postModel.findOne({ _id: req.params.id }).populate("comments").populate("user").populate({
      path: "comments.user", // 👈 Nested population
      model: "user" // 👈 Ensure this matches your schema
    });

    
    
    if (!post) {
      return res.status(404).send("Post not found");
    }

    res.render('comment', { post });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
app.post('/comment/:id',isLoggedin, async (req, res) => {
  try {
    const { comment } = req.body;
    const post = await postModel.findById(req.params.id);
    const user = await userModel.findOne({ email: req.user.email });

    if (!post || !user) {
      return res.status(404).send("Post or User not found");
    }

    const newComment = {
      text: comment,
      user: user._id,
      
    };

    post.comments.push(newComment);
    await post.save();

    res.redirect(`/comment/${post._id}`); // Reload the comment page
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
app.get('/comment/delete/:postId/:commentId', isLoggedin, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Find and remove the comment
    post.comments = post.comments.filter(comment => comment._id.toString() !== commentId);
    
    await post.save();
    res.redirect(`/comment/${postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
// for render profile page for perticular user
app.get('/profile', isLoggedin, async (req, res) => {
  // Check if firstVisit is set in the session
  if (req.session.firstVisit === undefined) {
      req.session.firstVisit = true; // Mark as first visit
  } else {
      req.session.firstVisit = false; // If it's not the first visit, set it to false
  }

  // Fetch user and their posts
  let user = await userModel.findOne({ email: req.user.email }).populate("posts");
  
  // Pass firstVisit flag to EJS template
  res.render('profile', { user, firstVisit: req.session.firstVisit });
});


//for creating posts
// app.post('/post', isLoggedin, async (req, res) => {
//   let user = await userModel.findOne({email: req.user.email});
//  let post = await postModel.create({
//     user: user._id,
//     content: req.body.content,
//   });

//   user.posts.push(post._id);
//    await user.save();
//    res.redirect('/profile')
//  });

app.post('/post', isLoggedin, upload.single('image'), async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let image = req.file  
  let newPost = {
      user: user._id,
      content: req.body.content,
      title: req.body.title
  };

 //If an image is uploaded, store it in memory
  if (image) {
      newPost.image = {
          data: req.file.buffer, 
          contentType: req.file.mimetype
      };
  }

  let post = await postModel.create(newPost);

  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile');
});

// for likes any posts
app.get('/like/:id', isLoggedin, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

    if(post.likes.indexOf(req.user.userid) === -1){

      post.likes.push(req.user.userid);
      
    }
    else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    
    await post.save();
     res.redirect('/profile');
   });

   app.get('/likes/:id', isLoggedin, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

    if(post.likes.indexOf(req.user.userid) === -1){

      post.likes.push(req.user.userid);
      
    }
    else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    
    await post.save();
     res.redirect('/feed');
   });
//for render edit page for particular post
app.get('/edit/:id', isLoggedin, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

    res.render("edit",{post});
  });
//for update content and redirect to profilepage 
app.post('/update/:id', isLoggedin, async (req, res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.content})

    res.redirect("/profile");
  });

  app.get('/feed', isLoggedin, async (req, res) => {
    try {
        // Check if firstVisit is set in the session
        
        // Fetch all posts to display in the feed
        let posts = await postModel.find().populate('user').exec();

        // Pass firstVisit flag to EJS template
        res.render('feed', {user: req.user, posts, firstVisit: req.session.firstVisit });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).send('Something went wrong while fetching posts');
    }
});




// For deleting a post
app.get('/delete/:id', isLoggedin, async (req, res) => {
  try {
      // Find the post by id and remove it
      let post = await postModel.findOneAndDelete({_id: req.params.id});
     
      
      // Remove the post reference from the user's posts array
      let user = await userModel.findOne({email: req.user.email});
      user.posts = user.posts.filter(postId =>  postId.toString() !== req.params.id );
      
      await user.save();

      // Redirect to the profile page after deletion
      res.redirect('/profile');
  } catch (err) {
       console.error('Error deleting post:', err);
       res.status(500).send('Internal Server Error');
   }
 });

  
// for logout user
app.get('/logout', (req, res) => {
  // Destroy session and clear cookies
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to logout');
    }
    res.clearCookie('token');
    res.redirect('/login');
  });
});
//Middleware for protected routes work for user logged in or not
  function isLoggedin(req, res, next){
    if(req.cookies.token === "") res.redirect('/login');
    else{
       let data = jwt.verify(req.cookies.token, "shhhh");
       req.user = data;
       next();
    }

  }



app.listen(3000);