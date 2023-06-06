//Firebase setup
const firebase = require('firebase');

const firebaseConfig = {
    apiKey: "AIzaSyAc99z4R1CXSHMAK 1414q8D14pTd_1jJYI",
    authDomain: "scobserver-5dbal.firebaseapp.com", 
    projectId: "scobserver-5dba1",
    storageBucket: "scobserver-5dba1.appspot.com",
    messagingSenderId: "745458496868",
    appId: "1:745458496868:web:75399abc2413fa54ea4211", 
    measurementId: "G-M3V8MF4332"
}

firebase.initializeApp(firebaseConfig);

//importing required packages and collections
const express = require('express')
const cors=require('cors')
const User=require('./user')
const Transaction=require('./transaction')
const Deviceinfo=require('./deviceinfo')
const Apistats=require('./apistats')
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const cookieParser = require('cookie-parser');
//var client = new XMLHttpRequest();
//sessions setup
const sessionconfig={
    name:'session',
    secret:'scbmobileapp',
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly:true,
        //secure:true,
        expires: Date.now()+1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
}

//starting the app
const app=express()
app.use(express.json())
app.use(cors())
app.use(cookieParser());
app.use(session(sessionconfig));

//middleware for setting the headers
const setHeaders = async (req,res,next)=>{
    const enteredemail = req.body.email || req.session.user.email; 
    const uniqueId = uuidv4();
    const method = req.method;
    const path = req.path;
    const id = enteredemail+uniqueId+method+path
    //client.setRequestHeader('coreltnid', id)

   // await req.setHeader('coreltnid',id);
    await res.setHeader('coreltnid',id);
    next();
}

//middleware for restricted links
const requirelogin = async (req,res,next)=>{
    if(!req.session.user){
        return res.send("you are not logged in");
    }
    next();
}

//setting up the headers
/*const headers = {
    'coreltnid':'uuidv4()',
};*/

//signup api
app.post('/signup',setHeaders,async(req,res)=>{
    const email = req.body.email;
    const name = req.body.name;
    const pass = req.body.password;

    await User.doc(email).set({
        "email": email,
        "name": name,
        "password":pass
    });
    req.session.user={email,id:'scb'}
    res.send(email);
})

//login api
app.get('/login',setHeaders,async(req,res)=>{
    
    const email = req.body.email;
    const pass = req.body.password;
    let user1 = {};
    let comparepsd = false;
    User.get().then(async(q)=>{
        q.forEach(async(user)=>{
           if(user.id===email && user.data().password === pass){
             comparepsd=true;
             user1=user;
           }
        })
        if(!comparepsd){
            res.send("wrong id/password")
        }
        else{
            req.session.user={email,id:'scb'}
            res.send("logged in!");
        }
    })
})

//logout api
app.get('/logout',(req,res)=>{
    const user= req.session.user;
    res.send(`${user}logged out!`)
    req.session.user=null;
    //console.log(req.session.user);
})

//creating the transaction api
app.post('/transaction',requirelogin,setHeaders,async(req,res)=>{
    const amount = req.body.amount;
    const paynm = req.body.payeeName;
    const userid = req.session.user.email;
    const status = "Pending";
    const transactionid = uuidv4();

    await Transaction.doc(transactionid).set({
        "amount":amount,
        "payeeName":paynm,
        "userid":userid,
        "status":status,
        "transactionid" : transactionid
    });

    res.send("done");

})

//fetching the transactionlist
app.get('/transactionlist',requirelogin,setHeaders,async(req,res)=>{
    var transactions = [];
    var fields = {};
    Transaction.get().then(async(q)=>{
        q.forEach(async(transaction)=>{
            fields={
                "amount":transaction.data().amount,
                "payeeName":transaction.data().payeeName,
                "id":transaction.data().transactionid
            }
            transactions.push(fields)
        })
        res.send(transactions)
    })
})

//details of perticular transaction
app.get('/transactionlist/:id',requirelogin,setHeaders,async(req,res)=>{
    const {id} =req.params;
    const transaction = Transaction.doc(id)
    const snapshot = await transaction.get();
    res.send(snapshot.data());
})

//approving transaction
app.post('/transactionlist/:id/approve',requirelogin,setHeaders,async(req,res)=>{
    const {id} =req.params;
    const transaction = Transaction.doc(id);
    await transaction.update({ status: 'Approve' });
    const snapshot = await transaction.get();
    res.send(snapshot.data());
})

//*********************OBSERVABILITY SECTION**********************//

//Initializ App
app.post('/intialization',async(req,res)=>{
    const pkgid = req.body.packageid;
    const ostype=req.body.ostype;
    const deviceid=uuidv4();
    await Deviceinfo.doc(deviceid).set({
        "packageid":pkgid,
        "ostype":ostype,
        "deviceid":deviceid
    });
})

//Deviceinfo Api
app.post('/deviceinfo',async(req,res)=>{
    const ram = req.body.ram;
    const storage=req.body.storage;
    const deviceid=req.body.deviceid;
    await Deviceinfo.doc(deviceid).set({
        "ram":ram,
        "storage":storage,
        "deviceid":deviceid
    });
})

//API statastics
app.post('/apistats',async(req,res)=>{
    const ram = req.body.ram;
    const networkspeed=req.body.networkspeed;
    const reqtime=req.body.reqtime;
    const restime=req.body.restime;
    const rendertime=req.body.rendertime;
    const deviceid=req.body.deviceid;
    await Apistats.doc(deviceid).set({
        "ram":ram,
        "networkspeed":networkspeed,
        "reqtime":reqtime,
        "restime":restime,
        "rendertime":rendertime,
        "deviceid":deviceid
    });
})

app.listen(process.env.PORT || 3000,()=>{
    console.log("welcome to port 3000");
})