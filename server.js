require ("dotenv").config();
const  express = require('express');
//const db = require('./db') remplacer client par db pour connexion à la db locale
const pg = require('pg')

const cors = require('cors');
const morgan = require('morgan');
const app = express()

app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());

var conString = process.env.DATABASE_URL //Can be found in the Details page
var client = new pg.Client(conString);
client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  client.query('SELECT NOW() AS "theTime"', function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    console.log(result.rows[0].theTime);
    // >> output: 2018-08-23T14:02:57.117Z
    
  



//Get all restaurants
app.get("/api/v1/restaurants", async (req, res) => {
    try {
        //const results = await db.query("select * from restaurants")
        const restaurantRatingData = await client.query("select * from restaurants left join (select restaurant_id, count(*), trunc(avg(rating), 1) as average_rating from reviews group by restaurant_id) reviews on restaurants.id = reviews.restaurant_id;")
        
        res.status(200).json({
            status: "success", 
            results: restaurantRatingData.rows.length,
            data: {
                restaurants: restaurantRatingData.rows
            }
        })
    } catch (err) {
        console.log(err);
    }
})

//Get a restaurant
app.get("/api/v1/restaurants/:id", async (req, res) => {
    console.log(req.params.id)

    try {
        const restaurant = await client.query("select * from restaurants left join (select restaurant_id, count(*), trunc(avg(rating), 1) as average_rating from reviews group by restaurant_id) reviews on restaurants.id = reviews.restaurant_id where id = $1", [req.params.id]);
        const reviews = await client.query("select * from reviews where restaurant_id = $1", [req.params.id]);
        
        res.status(200).json({
            status: "success", 
            data: {
                restaurant: restaurant.rows[0],
                reviews: reviews.rows
            }
        })
    } catch (err) {
        console.log(err);
    }

})


//create a restaurant
app.post("/api/v1/restaurants", async (req, res) => {
    console.log(req.body)
    try {
        const results = await client.query("insert into restaurants (name, location, price_range) values($1, $2, $3) returning *", 
        [req.body.name, req.body.location, req.body.price_range])
        console.log(results);
        res.status(201).json({
            status: "success", 
            data: {
                restaurant: results.rows[0]
            }
        })
    } catch (err) {
        console.log(err);
    }

    
})


//Update restaurants
app.put("/api/v1/restaurants/:id", async (req, res) => {
    try {
        const results = await client.query("UPDATE restaurants SET name = $1, location = $2, price_range = $3 where id = $4 returning *", 
        [req.body.name, req.body.location, req.body.price_range, req.params.id]);
        res.status(200).json({
            status: "success", 
            data: {
                restaurant: results.rows[0]
            }
        });
    }catch (err) {
        console.log(err)
    }

})

//Delete restaurants
app.delete("/api/v1/restaurants/:id", async (req, res) => {
    try {
        const results = client.query("DELETE FROM restaurants where id = $1", 
        [req.params.id]);
        res.status(204).json({
            status: "success", 
        })
    } catch(err) {
        console.log(err)
    }
    
})

app.post("/api/v1/restaurants/:id/addReview", async (req, res) => {
        try {
            const newReview = await client.query("INSERT INTO reviews (restaurant_id, name, review, rating) values ($1, $2, $3, $4) returning *;", [req.params.id, req.body.name, req.body.review, req.body.rating]);
            console.log(newReview.rows[0]);
            res.status(201).json({
                status: "success", 
                data: {
                    review: newReview.rows[0]
                }
            });
            
        } catch (err) {
            console.log(err);
    }
})

});
});
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`server is up and listening on port ${port}`);
});