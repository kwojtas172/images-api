

# Images Api

This application is based on the Express.js framework and is used to download images from the internet and save them to the local disk.

## Description

When an image URL is submitted through an HTML form, the image is downloaded and checked to see if it is a graphic file. If it is, the image is saved to the local disk and information about it is saved to the database. If not, the task is removed from the queue.

The application also handles a GET request for a specific URL, which is used to display the image on a website. To do this, the application checks if the image is already saved to the disk and then responds with the appropriate graphic file.

The port on which the application runs is set using an environment variable and the password and database name for the MySQL database are set using environment variables. The application terminates when the npm start command is entered.



## Run Locally

Clone the project

```bash
  git clone https://github.com/kwojtas172/images-api
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

**Its neccessary to have installed MySQL Server and Redis Server.**

**Or use Docker**

## Docker running

When you downloaded project and inside in this directory, you can use command:

```bash
docker compose up
```
