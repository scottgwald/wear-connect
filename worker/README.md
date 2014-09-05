# Set up
1. Install [NodeJS](http://nodejs.org/download/)
2. Install a few global node modules:

   ```bash
   $ npm install -g bower grunt-cli http-server
   ```
3. Install local node dependencies, if any:

   ```bash
   $ npm install
   ```
4. Install bower dependencies:

   ```bash
   $ bower install
   ```
5. Start local server

   ```bash
   $ http-server
   ```
6. (Optional) Start file watcher and livereload:

   ```bash
   $ grunt watch
   ```
7. Go to `localhost:8080/` in the browser. If running `grunt watch` then any time a files is modified the browser will automatically reload the page.
