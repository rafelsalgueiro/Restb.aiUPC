const express = require('express'); //Import the express dependency
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const app = express();              //Instantiate an express app, the main work horse of this server
const port = 5000;                  //Save the port number where your server will be listening

app.set('view engine', 'ejs');

//Idiomatic expression in express to route and respond to a client request
app.get('/', (req, res) => {        //get requests to the root ("/") will route here
    res.sendFile('index.html', {root: __dirname});      //server responds by sending the index.html file to the client's browser
                                                        //the .sendFile method needs the absolute path to the file, see: https://expressjs.com/en/4x/api.html#res.sendFile 
});

// Configure multer storage
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
// Initialize multer upload
const upload = multer({
    storage: storage,
    limits: { files: 5 } // Limiting to a maximum of 5 files
  }).array('images', 5);
  

// Serve static files
app.use(express.static('public'));

// Handle POST request to /upload
app.post('/upload', upload, (req, res) => {

    if (!req.files || req.files.length === 0) {

      res.status(400).send('No files uploaded.');
      return;

    }

    const resizedImages = [];

  req.files.forEach((file) => {
    const filePath = file.path;
    const outputFileName = `${file.filename}`;
    const outputPath = `public/images/${outputFileName}`;

    sharp(filePath)
      .resize(800, 600, {fit: 'inside'})
      .toFile(outputPath, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error resizing the image.');
        } else {
          const resizedImage = {
            originalName: file.originalname,
            resizedFileName: outputFileName,
            resizedFilePath: outputPath
          };
          resizedImages.push(resizedImage);

          // Delete the original uploaded file
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file: ${filePath}`, err);
            } else {
              console.log(`File deleted: ${filePath}`);

              // Schedule the removal of the resized image after 5 minutes
              setTimeout(() => {
                fs.unlink(outputPath, (err) => {
                  if (err) {
                    console.error(`Error deleting file: ${outputPath}`, err);
                  } else {
                    console.log(`Resized image deleted: ${outputPath}`);
                  }
                });
              }, 15 * 1000); // 5 minutes (converted to milliseconds)
            }
          });
        }
      });
    });

    // Send success response with message
    res.redirect('/index.html?message=Image uploaded successfully!');

});

app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`); 
});