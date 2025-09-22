const express = require('express');
const app = express();
const path = require('path')
const { Pool } = require('pg');
require('dotenv').config({ path: './database.env' });

app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname)); //serve css from root of project
app.set('view engine', 'ejs');
//express.urlencoded() is a method inbuilt in express to recognize the incoming Request Object as strings or arrays
app.use(express.urlencoded({ extended: true }));

//from env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

//create table
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS sauces (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      type VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    console.log('Table created successfully!');
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

//Create sauces to populate table
const insertDummySauces = async () => {
  const query = `
    INSERT INTO sauces (name, type)
    VALUES 
      ('Ghost Pepper Inferno', 'superhot'),
      ('Mango Habanero', 'fruity'),
      ('Classic Buffalo', 'mild'),
      ('Smoky Chipotle', 'medium')
    ON CONFLICT (type) DO NOTHING;
  `;

  try {
    await pool.query(query);
    console.log('Dummy sauces inserted!');
  } catch (err) {
    console.error('Error inserting dummy sauces:', err);
  }
};

//render page and pass entries from table
app.get("/", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sauces ORDER BY id');
    console.log(result)
    res.render('index', { sauces: result.rows });
  } catch (err) {
    console.error('Error fetching sauces:', err);
    res.status(500).send("Something went wrong");
  }
  console.log(req.body)
});

//add sauce
app.post("/", async (req, res) => {
  const { brand, spice } = req.body;

  const query = `
    INSERT INTO sauces (name, type)
    VALUES ($1, $2)
    ON CONFLICT (type) DO NOTHING;
  `;
  try {
    await pool.query(query, [brand, spice]);
    console.log(`Added sauce: ${brand} (${spice})`);
    res.redirect("/"); // Refresh the page to show updated list
  } catch (err) {
    console.error("Error adding sauce:", err);
    res.status(500).send("Failed to add sauce");
  }

});
//delete sauce
app.post("/delete", async (req, res) => {
  const { id } = req.body;

  try {
    await pool.query('DELETE FROM sauces WHERE id = $1', [id]);
    console.log(`Deleted sauce with ID: ${id}`);
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting sauce:", err);
    res.status(500).send("Failed to delete sauce");
  }
});




createTable().then(() => {
  insertDummySauces().then(() => {
    app.listen(8000, () => {
      console.log("Listening on PORT 8000");
    });
  });
});
