import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import jsdom from "jsdom";
import session from "express-session";
import flash from "express-flash";
import passport from "passport";
import initializePassport from "./passport.js";
const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";
initializePassport(passport);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.use(bodyParser.json());

app.use(session({
  secret:'blueberry',
  resave:false,
  saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

// routes
// get home page
app.get("/",async(req,res)=>{
res.render("home.ejs");
})
// get login page
app.get("/login",checkAuthenticated,(req,res)=>{
    res.render("login.ejs")
})
// get registration page
app.get("/register",checkAuthenticated,(req,res)=>{
    res.render("register.ejs")
})
app.get("/index",checkNotAuthenticated,(req,res)=>{
    res.render("index.ejs",{user:req.user.id,name:
    req.user.name})
})
app.get("/logout", (req, res) => {
  req.logout(req.user, err => {
    if(err) return next(err);
    res.redirect("/login");
  });
});

app.get("/assign/:id", async (req, res) => {
  // console.log(" reached assign data")
  // console.log(req.params.id);
  try {
    const response = await axios.get(`${API_URL}/assigned/${req.params.id}`);
    const userInfo=response.data.userInfo;
    const FY1=response.data.FYSEM1;
    const FY2=response.data.FYSEM2;
    const SY1=response.data.SYSEM1;
    const SY2=response.data.SYSEM2;
    const TY1=response.data.TYSEM1;
    const TY2=response.data.TYSEM2;
    console.log(userInfo[0]);
   res.render("assign.ejs",{userInfo:userInfo,FYSEM1:FY1,FYSEM2:FY2,SYSEM1:SY1,SYSEM2:SY2,TYSEM1:TY1,TYSEM2:TY2})
  
  } catch (error) {
    res.status(500).json({ message: "Error fetching post" });
  }
});



// send data to edit page
app.get("/edit/:id", async (req, res) => {
    console.log(" reached")
    console.log(req.params.id);
    try {
      const response = await axios.get(`${API_URL}/data/${req.params.id}`);
      const userInfo=response.data.userInfo;
      console.log(userInfo);
     res.render("edit.ejs",{userInfo:userInfo})
    
    } catch (error) {
      res.status(500).json({ message: "Error fetching post" });
    }
  });

//   edit details
app.post("/edit/:id",async(req,res)=>{
    console.log("changing")
    console.log(req.params.id)
    try {
        const response = await axios.patch(`${API_URL}/data/${req.params.id}`,req.body);
        const userInfo=response.data.userInfo;
        console.log(userInfo);
       res.render("index.ejs",{name:userInfo}) //check again
      
      } catch (error) {
        res.status(500).json({ message: "Error fetching post" });
      }

})
// save details
app.post("/sign-up",async(req,res)=>{
    // console.log(req.body);
    try {
        const response = await axios.post(`${API_URL}/sign-up-data`, req.body);
        const data=response.data.message;
        console.log(data);
        const name=response.data.name;
        if(data==="success"){
            res.render("login.ejs",{message:data});        }
            else{
                res.render("register.ejs",{message:data},);
            }
      
      } catch (error) {
        res.status(500).json({ message: "Error creating post" });
      }

})
// post login data
app.post("/login",passport.authenticate("local",{
  successRedirect:"/index",
  failureRedirect:"/login",
  failureFlash:true
}))
    // console.log(req.body);
    // // try {
    //     const response = await axios.post(`${API_URL}/sign-in-data`, req.body);
    //     const data=response.data.message;
    //     const userInfo=response.data.userInfo;
    //     console.log(data);
    //     const name=response.data.name;
    //     if(data==="success"){
    //         res.redirect("index.ejs",{name:name,userInfo:userInfo});  
    //           }
    //     //  else if(data==="invalid"){
    //     //     res.render("login.ejs",{message:data});
    //     //  }     
    //         else{
    //             res.render("login.ejs",{message:data},);
    //         }
    //   } catch (error) {
    //     res.status(500).json({ message: "Error creating post" });
    //   }
   

// app.get("/index",(req,res)=>{
//     res.render("index.ejs",{name:"sofiya"});
// })
// AJAX
app.post("/try",async(req,res)=>{
    // console.log(req.body.year)
    console.log("reached /try")
    const selectedYear=req.body.year;
    const uname=req.body.name;
    console.log(uname);
    try {
        const response = await axios.post(`${API_URL}/select-year`, {year:selectedYear,name:uname});
        const data=response.data.subjects;
       
        res.json({subjects:data})
       
      } catch (error) {
        res.status(500).json({ message: "Error creating post" });
      }
    // res.json({response:req.body.year,
    // name:req.body.name});
})
app.post("/allocate",async(req,res)=>{
console.log("reached the ajax allocate route")
  try {
    const response = await axios.post(`${API_URL}/subjects`);
    const FY=response.data.FY;
    const SY=response.data.SY;
    const TY=response.data.TY;
 res.json({FY:FY,SY:SY,TY:TY})
    
  } catch (error) {
    res.status(500).json({ message: "Error creating post" });
  }

})

//post data to assign the subjects
app.post("/assign",async(req,res)=>{
  console.log("userid:"+req.body.userId)
  const userId=req.body.userId;
  const fy1=req.body.fysem1;
  const fy2=req.body.fysem2;
  const sy1=req.body.sysem1;
  const sy2=req.body.sysem2;
  const ty1=req.body.tysem1;
  const ty2=req.body.tysem2;
 
  console.log(fy2)
  try {
    const response = await axios.post(`${API_URL}/assign-sub`, {FYSEM1:fy1,FYSEM2:fy2,SYSEM1:sy1,SYSEM2:sy2,TYSEM1:ty1,TYSEM2:ty2,userId:userId});
    const data=response.data.message;
   if(data==="success"){
    const response = await axios.get(`${API_URL}/assigned/${userId}`);
    const userInfo=response.data.userInfo;
    const FY1=response.data.FYSEM1;
    const FY2=response.data.FYSEM2;
    const SY1=response.data.SYSEM1;
    const SY2=response.data.SYSEM2;
    const TY1=response.data.TYSEM1;
    const TY2=response.data.TYSEM2;
    console.log(userInfo[0]);
   res.render("assign.ejs",{userInfo:userInfo,FYSEM1:FY1,FYSEM2:FY2,SYSEM1:SY1,SYSEM2:SY2,TYSEM1:TY1,TYSEM2:TY2})
  
  }
    
   
  } catch (error) {
    res.status(500).json({ message: "Error creating post" });
  }


})













// route to get table data
app.post("/submit",async(req,res)=>{
    console.log("reached submit route")
    const year=req.body.year
    const subject=req.body.subject
    const user=req.body.userId
    if(user==undefined){
    res.redirect("/index")
    }
    else{ try {
        const response = await axios.get(`${API_URL}/table/data`);
        console.log(response.data);
        res.render("table1.ejs");
    }
    catch{}}
   
})






function checkAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return res.redirect('/index')
  }
  next();
}
function checkNotAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return next()
  }
  res.redirect('/login')
}











app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
  });
