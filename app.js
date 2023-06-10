const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
let db = null;
app.use(express.json());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dbpath = path.join(__dirname, "covid19India.db");
const init = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is starting ");
    });
  } catch (error) {
    console.log("error");
    process.exit(1);
  }
};
init();
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const p = `select * from user where username = '${username}';`;
  const q = await db.get(p);
  if (q !== undefined) {
    const pass = await bcrypt.compare(
      password,
      q.password
    );
    if (pass) {
      
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "vinay");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send(`Invalid password`); 
    }
  } else {
    response.status(400);
    response.send("Invalid user"); 
});

const state = (a) => {
  return {
    stateId: a.state_id,
    stateName: a.state_name,
    population: a.population,
  };
};
app.get("/states/", async (request, response) => {
  const a = `select * from state`;
  const p = await db.all(a);
  const q = p.map((i) => state(i));
  response.send(q);
});
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const p = `select * from state where state_id= ${stateId};`;
  const q = await db.get(p);
  response.send(state(q));
});
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const p = `insert into district(district_name,state_id,cases,cured,active,deaths) values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const q = await db.run(p);
  response.send("District Successfully Added");
});

const district = (a) => {
  return {
    districtId: a.district_id,
    districtName: a.district_name,
    stateId: a.state_id,
    cases: a.cases,
    cured: a.cured,
    active: a.active,
    deaths: a.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const p = `select * from district where district_id=${districtId}`;
  const q = await db.get(p);
  response.send(district(q));
});
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const p = `delete from district where district_id=${districtId}`;
  const q = await db.run(p);
  response.send("District Removed");
});
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const p = `update district 
    set district_name='${districtName}',state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} where district_id=${districtId}`;
  const q = await db.run(p);
  response.send("District Details Updated");
});

const d = (a) => {
  return {
    totalCases: a.cases,
    totalCured: a.cured,
    totalActive: a.active,
    totalDeaths: a.deaths,
  };
};
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const p = `select sum(cases) as cases,sum(cured) as cured,sum(active) as active ,sum(deaths) as deaths from state s inner join district d on s.state_id=d.state_id where d.state_id=${stateId}`;
  const q = await db.get(p);
  response.send(d(q));
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const p = `select state_name from state s inner join district d on s.state_id=d.state_id where district_id=${districtId}`;
  const q = await db.get(p);
  response.send({ stateName: q.state_name });
});
module.exports = app;
