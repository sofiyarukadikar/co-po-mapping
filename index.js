import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import { check, validationResult } from "express-validator";
import pg from "pg";
import session from "express-session";
import flash from "express-flash";
import bcrypt from "bcrypt";
import LocalStrategy from "passport-local";


const port = 4000;
const app=express();
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

let final = [];
// database connectivity
const db=new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"final_project",
    password:"admin",
    port:5432,
  });
db.connect();

// formatting input data
async function transform(inputData){
inputData.forEach((item) => {
    const { po, title, description, com, comp_desc, skill, skill_desc } = item;

    // Check if the PO already exists in the 'final' array
    let poExists = final.find((entry) => entry[`PO${po}`]);
    
    if (!poExists) {
        const newPoEntry = {
            [`PO${po}`]: {
                po_desc: description,
                comp: []
            }
        };
        final.push(newPoEntry);
        poExists = newPoEntry;
    }
    // Check if the COM already exists for the current PO
    let comExists = poExists[`PO${po}`].comp.find((comp) => comp[`COM${com}`]);
    if (!comExists) {
        const newComEntry = {
            [`COM${com}`]: {
                comp_desc,
                skills: []
            }
        };
        poExists[`PO${po}`].comp.push(newComEntry);
        comExists = newComEntry;
    }

    // Adding the skill entry under the current COM
    comExists[`COM${com}`].skills.push({
        [`skill${skill}`]: {
            skill_desc
        }
    });
});

return final;
}

// get co 
async function getCo(){
    const result=db.query("select year_sem_wise_sub.year_sem ,year_sem_wise_sub.subject,course_code,id,co_desc from year_sem_wise_sub join course_out on year_sem_wise_sub.year_sem=course_out.year_sem");
const data=(await result).rows;

}

// get input data
async function getData(){
const result=db.query("select prog_out.id as po,title,description,competancies.id as com,comp_desc,skills.id as skill,skill_desc from prog_out  join competancies on prog_out.id=competancies.po_id join skills on prog_out.id=skills.po_id ORDER BY prog_out.id, competancies.id, skills.id;");
const data=(await result).rows;
const d= await transform(data);
return d;
}

app.post("/sign-up-data",async(req,res)=>{
    const name=req.body.Username;
    const email=req.body.email;
    const pass=req.body.password;
    var message="";
    const userExists=await db.query('SELECT * FROM users WHERE name = $1', [name]);
    console.log(userExists.rows.length);
    if(userExists.rows.length>0){
       message="unsuccessful"
    }
    else{
        message="success";
        let hashedPassword= await bcrypt.hash(pass,10);
        await db.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hashedPassword])
    }
   
    res.json({message:message});
})
app.post("/sign-in-data",async(req,res)=>{
    const name=req.body.Username;
    console.log(name)
    const pass=req.body.password;
    var message="";
    const userExists=await db.query('SELECT * FROM users WHERE name =$1', [name]);
    const checkPass=await db.query('SELECT password FROM users WHERE name = $1 ', [name]);
    const checkAdmin=await db.query('SELECT isAdmin FROM users WHERE name = $1 ', [name]);
    const details=userExists.rows[0];
    // console.log(userExists.rows[0]);
    // console.log(checkPass.rows[0].password);
    // console.log(checkAdmin.rows[0].isadmin);
    if(userExists.rows.length>0 && checkPass.rows[0].password===pass){
       message="success"
    }
    else if(userExists.rows.length>0){
        message="invalid"
    }
    else{   
        message="unsuccessful";
    }
   
    res.json({message:message,name:name,userInfo:details});
})

// fetch data
app.get("/data/:id", async(req,res)=>{
    const id=req.params.id;
    const result=await db.query('SELECT * FROM users where id=$1 ',[id]);
    res.json({userInfo:result.rows[0]});

})

// edit user profile
app.patch("/data/:id",async(req,res)=>{
    const id=req.params.id;
    const uname=req.body.Username;
    const email=req.body.email;
    const pass=req.body.password;
    let hashedPassword= await bcrypt.hash(pass,10);
    var isAdmin=false;
    if(uname==="admin"){
        isAdmin=true
    }
    console.log(uname);
    if (!id) return res.status(404).json({ message: "Post not found" });
    else{
    const result=await db.query('UPDATE users SET name=$1,email=$2,password=$3,isadmin=$4 where id=$5',[uname,email,hashedPassword,isAdmin,id]);
    console.log(result.data);
    }

})

app.post("/select-year",async(req,res)=>{
    console.log("reached select-year");
    const year=req.body.year
    const user=req.body.name
    const result=await db.query('SELECT * FROM user_subject where year=$1 and uname=$2',[year,user]);
    res.json({subjects:result.rows})
})
app.post("/assign-sub",async(req,res)=>{
    console.log("reached assign-sub");
    
    // console.log(req.body.FY[0])
    const userId=req.body.userId;
    const FYSEM1=req.body.FYSEM1;
    const FYSEM2=req.body.FYSEM2;
    const SYSEM1=req.body.SYSEM1;
    const SYSEM2=req.body.SYSEM2;
    const TYSEM1=req.body.TYSEM1;
    const TYSEM2=req.body.TYSEM2;
    const result=await db.query('SELECT name from users where id=$1',[userId]);
    const uname=(result.rows[0].name)
    // console.log(FYSEM1[0].length)
    async function check(sub,year){
        const existingSubject = await db.query('SELECT * FROM user_subject WHERE id = $1 AND subname = $2 ', [userId, sub]);
        if (existingSubject.rows.length === 0) {
            // Subject doesn't exist, insert into the database
            await db.query('INSERT INTO user_subject VALUES ($1, $2, $3, $4)', [userId, uname, sub, year]);
            console.log(`Data inserted into the database for userId`);
        } else {
            console.log(`Subject already exists for userId: ${userId}, subject: ${sub}`);
        }
    }
  console.log  (FYSEM1)
    try {
        
       if(FYSEM1!=undefined){
        FYSEM1.forEach(fy=>{
             check(fy,"FYSEM1")
        })
       }
       if(FYSEM2!=undefined){
        FYSEM2.forEach(fy=>{
             check(fy,"FYSEM2")
        })
       }
       if(SYSEM1!=undefined){
        SYSEM1.forEach(fy=>{
             check(fy,"SYSEM1")
        })
       }
       if(SYSEM2!=undefined){
        SYSEM2.forEach(fy=>{
             check(fy,"SYSEM2")
        })
       }
       if(TYSEM1!=undefined){
        TYSEM1.forEach(fy=>{
             check(fy,"TYSEM1")
        })
       }
       if(TYSEM2!=undefined){
        TYSEM2.forEach(fy=>{
             check(fy,"TYSEM2")
        })
       }
            
        

        // Send a response when all insertions are done
        res.json({message:"success"})
    }
     catch (error) {
        console.error('Error during subject assignment:', error);
        res.status(500).send('Internal Server Error');
    }
//     if(SY >0){SY.forEach(sy => {
//         const year= db.query("SELECT year from subjects where course_name=$1",[sy]);
//         const year_name=year.rows[0].year;
//         const check=db.query('SELECT * from user_subject where subname=$1',[sy])

// if(check.rows<=0){
//          db.query('INSERT INTO user_subject VALUES ($1,$2,$3,$4)', [userId,uname,sy,year_name])

// }
        
//     });}
//     if(TY >0){TY.forEach(ty => {
//         const year= db.query("SELECT year from subjects where course_name=$1",[ty]);
//         const year_name=year.rows[0].year;
//         const check=db.query('SELECT * from user_subject where subname=$1',[ty])
//         if(check.rows<=0){
//                  db.query('INSERT INTO user_subject VALUES ($1,$2,$3,$4)', [userId,uname,ty,year_name])

//         }
        
//     });}
    // res.json({message:"success"})

})

app.get("/assigned/:id",async(req,res)=>{
    const id=req.params.id;
    console.log(id)
    
      const result=await db.query('SELECT * FROM users');
      const FYSEM1=await db.query("SELECT * FROM subjects where year='FYSEM1'");
      const FYSEM2=await db.query("SELECT * FROM subjects where year='FYSEM2'");
      const SYSEM1=await db.query("SELECT * FROM subjects where year='SYSEM1'");
      const SYSEM2=await db.query("SELECT * FROM subjects where year='SYSEM2'");
      const TYSEM1=await db.query("SELECT * FROM subjects where year='TYSEM1'");
      const TYSEM2=await db.query("SELECT * FROM subjects where year='TYSEM2'");
      res.json({userInfo:result.rows,FYSEM1:FYSEM1.rows,FYSEM2:FYSEM2.rows,SYSEM1:SYSEM1.rows,SYSEM2:SYSEM2.rows,TYSEM1:TYSEM1.rows,TYSEM2:TYSEM2.rows});
    
    // {console.log("no users found")}
   
    

})

app.post("/table/data",async(req,res)=>{
  final = []
  const data=await getData();
  console.log(data);
 
 
   
})
// sign-up














// listening
app.listen(port,(req,res)=>{
    console.log(`listening on port ${port}`)
})