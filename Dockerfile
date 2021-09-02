FROM node:12-slim

# Create and change to the app directory.
WORKDIR /usr/src/app-proxy

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.

RUN npm install --only=production

ENV LISTEN_PORT=4447

EXPOSE 4447

# Copy local code to the container image.
COPY . ./

# Run the web service on container startup.
CMD [ "npm", "start" ]