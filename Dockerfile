FROM node:16

# Create the application directory
RUN mkdir -p /usr/src/app

# Set the application directory as the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json /usr/src/app/

# Install dependencies
RUN npm install

# Copy the rest of the application files to the working directory
COPY . /usr/src/app

# Set the port on which the application will run
EXPOSE 3000

# Start the application server
CMD [ "npm", "start" ]