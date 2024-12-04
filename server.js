const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const path = require("path");
const moment = require('moment');

const app = express();


const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "id",
    password: "password"
});


connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

// Парсинг данных из тела запроса
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));


app.post("/auth", (req, res) => {
    console.log(req.body); 
    const { username, email, password, action } = req.body;

    if (action === "register") {
        const query = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
        const role = 'user';
        connection.query(query, [username, email, password, role], (error, results, fields) => {
            if (error) {
                console.error("Error registering user:", error);
                res.status(500).json({ error: "Internal Server Error" });
            } else {
                res.sendFile(path.join(__dirname, 'public','index2.html'));
            }
        });
    } else if (action === "login") {
        const query = "SELECT * FROM users WHERE email = ? AND password = ?";
        connection.query(query, [email, password], (error, results, fields) => {
            if (error) {
                console.error("Error authenticating user:", error);
                res.status(500).json({ error: "Internal Server Error" });
            } else {
                if (results.length > 0) {
                    if (results[0].role === 'admin') {
                        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
                    } else {
                        res.sendFile(path.join(__dirname, 'public', 'index2.html'));
                    }
                } else {
                    res.status(401).json({ error: "Authentication failed" });
                }
            }
        });
    } else {
        res.status(400).json({ error: "Action not specified" });
    }
});

app.get('/timetable', (req, res) => {
    connection.query('SELECT * FROM timetable', (error, results, fields) => {
        if (error) {
            console.error('Error fetching data from database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('timetable.ejs', { timetable: results });
    });
});


app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');

app.get('/reviews', (req, res) => {
    connection.query('SELECT * FROM reviews', (error, results, fields) => {
        if (error) {
            console.error('Error fetching reviews from database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('reviews', { reviews: results });
    });    
});


app.post('/reviews', (req, res) => {
    const { name, message } = req.body;
    connection.query('INSERT INTO reviews (name, message) VALUES (?, ?)', [name, message], (error, results, fields) => {
        if (error) {
            console.error('Error adding review to database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/reviews');
    });
});


app.post('/submit-form', (req, res) => {
    const { email, phone, full_name, topic, message } = req.body;
  
    const query = `INSERT INTO consultation (email, phone, full_name, topic, message) VALUES (?, ?, ?, ?, ?)`;
    connection.query(query, [email, phone, full_name, topic, message], (error, results, fields) => {
      if (error) {
        console.error('Error saving data to database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.status(200).json({ message: 'Data saved successfully' });
      }
    });
  });

app.post('/submit-application', (req, res) => {
    const { name, phone } = req.body;
    
    connection.query('INSERT INTO application (name, phone) VALUES (?, ?)', [name, phone], (error, results, fields) => {
        if (error) {
            console.error('Ошибка при добавлении данных в базу данных:', error);
            res.status(500).send('Internal Server Error');
            return;
        }
       res.redirect('index2.html'); 
    });
});

app.get('/timetable_admin', (req, res) => {

    connection.query('SELECT * FROM timetable', (error, results, fields) => {
        if (error) {
            console.error('Error fetching data from database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('timetable_admin.ejs', { timetable: results });
    });
});
app.post('/add-schedule', (req, res) => {
    const { time, date, teacher } = req.body;

    connection.query('INSERT INTO timetable (time, date, teacher) VALUES (?, ?, ?)', [time, date, teacher], (error, results, fields) => {
        if (error) {
            console.error('Error adding schedule to database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/timetable_admin'); 
    });
});


app.get('/consultation', (req, res) => {
    connection.query('SELECT * FROM consultation', (error, results, fields) => {
        if (error) {
            console.error('Error fetching data from database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('consultation.ejs', { consultations: results });
    });
});

app.get('/orders', (req, res) => {
    connection.query('SELECT * FROM application', (error, results, fields) => {
        if (error) {
            console.error('Error fetching data from database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('orders.ejs', { orders: results });
    });
});

app.get('/users', (req, res) => {
    connection.query('SELECT * FROM users', (error, results, fields) => {
        if (error) {
            console.error('Error fetching data from database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('users.ejs', { users: results });
    });
});

app.post('/add-user', (req, res) => {
    const { username, email, password, role } = req.body;
  
    const query = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`;
    connection.query(query, [username, email, password, role], (error, results, fields) => {
        if (error) {
            console.error('Error adding user to database:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({ message: 'User added successfully' });
        }
    });
});

app.post('/delete-user', (req, res) => {
    const email = req.body.email;
  
    const query = `DELETE FROM users WHERE email = ?`;
    connection.query(query, [email], (error, results, fields) => {
        if (error) {
            console.error('Error deleting user from database:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({ message: 'User deleted successfully' });
        }
    });
});


app.post('/delete-consultation', (req, res) => {
    const { email, full_name } = req.body;

    connection.query('DELETE FROM consultation WHERE email = ? AND full_name = ?', [email, full_name], (error, results) => {
        if (error) {
            console.error('Ошибка при удалении данных из базы данных:', error);
            res.status(500).send('Внутренняя ошибка сервера');
            return;
        }
        res.redirect('/consultation'); 
    });
});

app.post('/delete-order', (req, res) => {
    const { name, phone } = req.body;
    connection.query('DELETE FROM application WHERE name = ? AND phone = ?', [name, phone], (error, results) => {
        if (error) {
            console.error('Error deleting data from database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/orders');
    });
});

app.post('/delete-schedule', (req, res) => {
    const { time, date } = req.body; 

    if (!time || !date) {
        return res.status(400).send("Не указаны время и/или дата для удаления из расписания.");
    }

    const formattedDate = moment(date).format('YYYY-MM-DD');

    const sql = `DELETE FROM timetable WHERE time = ? AND date = ?`;

    connection.query(sql, [time, formattedDate], (err, result) => {
        if (err) {
            console.error("Ошибка удаления данных из базы данных:", err);
            return res.status(500).send("Ошибка удаления данных из базы данных.");
        }
        console.log("Данные успешно удалены из базы данных.");
        res.redirect('/timetable_admin'); 
    });
});


app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
/*http://localhost:3000*/















