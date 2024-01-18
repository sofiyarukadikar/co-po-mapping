import pg from "pg";
import bcrypt from "bcrypt";
import LocalStrategy from "passport-local";

const db=new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"final_project",
    password:"admin",
    port:5432,
  });
db.connect();

function initialize(passport) {
    const authenticateUser = (Username, password, done) => {
      db.query(
        "SELECT * FROM users where name=$1",
        [Username],
        (err, results) => {
          if (err) {
            throw err;
          }
          console.log("reached here")
          console.log(results.rows);
          if (results.rows.length > 0) {
            const user = results.rows[0];
  
            bcrypt.compare(password,user.password,(err,isMatch)=>{
              if(err){
                  throw err;
              }
              else if(isMatch){
                  return done(null,user);
              }
              else{
                  return done(null,false,{message:"Invalid credentials"});
              }
            })
          }
          else{
              return done(null,false,{message:"User not found"})
          }
        }
      );
    };
    passport.use(
      new LocalStrategy(
        {
          usernameField: "Username",
          passwordField: "password",
        },
        authenticateUser
      )
    );
  
    passport.serializeUser((user,done)=>done(null,user.id));
    passport.deserializeUser((id,done)=>{
      db.query('SELECT * FROM users where id=$1',[id],(err,results)=>{
          if(err){
              throw err;
          }
          return done(null,results.rows[0]);
  
      })
    })
  }
export default initialize;