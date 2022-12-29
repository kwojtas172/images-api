import express from 'express';
const app = express();
import mysql from 'mysql2';
const port = process.env.PORT || 3000;
import { v4 } from 'uuid';
import fs from 'fs';
import axios from 'axios';
import bodyParser from 'body-parser';
import Queue from 'bull';
const queue = new Queue('image-downloader');

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('<form action="/add-image" method="POST"><input name="imageUrl"></input><button type="submit">send</button></form>');
});

// connection to MySQL database created
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mysql',
  port: '3306'
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + connection.threadId);
});

app.post('/add-image', async (req, res) => {
  const imageUrl = req.body.imageUrl;
  const startDate = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const fileName = v4();
  queue.add({ imageUrl, fileName, startDate });
  res.redirect(`/image/${fileName}.jpg`);
});

queue.process(async (task) => {
  const {imageUrl, fileName, startDate} = task.data;
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  if (!response.headers['content-type'] || !response.headers['content-type'].startsWith('image/')) {
    await task.moveToCompleted();
    await task.remove();
    return;
  }
  await new Promise((resolve, reject) => {
    fs.writeFile(`./images/${fileName}.jpg`, response.data, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    })
  })
  .then(() => {
    const endDate = new Date().toISOString().slice(0, 19).replace('T', ' ')
    connection.query(
    `INSERT INTO images (name, url, source, dateStart, dateEnd) VALUES ('${fileName}', 'image/${fileName}.jpg', '${imageUrl}', '${startDate}', '${endDate}')`,
      function(err, results) {
        if(err) {
          console.log(err);
          return
        }
        console.log(results); // results contains rows returned by server
      }
    );
  })
  .catch(err => {
    console.log(err);
  })
});

queue.on('error', (err) => {
  console.error(err);
});

app.get('/image/:name', async (req, res) => {
  const name = req.params.name;
  const allTasks = await tasksFromQueue();
  const filterTasks = allTasks.filter(task => task.data.fileName+'.jpg' === name);
  if (filterTasks.length>0) {
    await new Promise((resolve, reject) => {
      connection.query(
        `SELECT * FROM images WHERE name = "${name.substring(0,name.length-4)}"`, (err, results) => {
          if(err) {
            console.log(err);
            reject(err)
          }
          resolve(results)// results contains rows returned by server
        }
      );
    }).catch(err=>{
      console.log(err);
    })
    .then(results => {
      if(results.length>0) {
        const filePath = `./images/${name}`;
        fs.readFile(filePath, function(error, data) {
          if (error) {
            res.sendStatus(404);
            return;
          }
          res.contentType('image/jpeg');
          res.send(data);
        });
      } else {
        res.send("<h2>It's pending...</h2>")
      }
    })
  } else {
    res.send("<h2>Bad content type</h2>")
  }
  
});

app.get('/images', (req, res) => {
  connection.query(
    'SELECT * FROM images',
    function(err, results) {
      if(err) {
        console.log(err);
        return;
      }
      console.log(results); // results contains rows returned by server
      const list = results.map(result => {
        return `<li>ID: ${result.id}, image name: ${result.name}, <a href="${result.url}">download from server</a></li>`
      })
      res.send(`<ul>${list}</ul>`)
    }
  );
});

async function tasksFromQueue() {
  const tasks = await queue.getJobs();
  return tasks;
};

app.listen(port, () => {
  console.log('The Express server is running on port 3000.');
});

