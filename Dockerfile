# Use Node 16
FROM node:16

# Working directory
WORKDIR /app

# Copy package.json and yarn.lock and install dependencies
COPY package*.json yarn.lock ./
RUN yarn

# Copy into the container
COPY . .

# Build the application
RUN yarn build

# Create dist directory if it doesn't exist (safety check)
RUN mkdir -p /app/dist

# Entrypoint for runtime env vars
ENTRYPOINT [ "/app/docker-entrypoint.sh" ]

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["yarn", "start"]
