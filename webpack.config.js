const path = require('path');

module.exports = {
  // Entry point: React app starts here
  entry: './src/index.jsx',

  // Output: compiled bundle goes into public/ folder
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'app.bundle.js',
  },

  module: {
    rules: [
      // Rule 1: Compile all .js and .jsx files using Babel
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' },
      },
      // Rule 2: Bundle CSS files (imported inside JSX)
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  resolve: {
    // Allow importing .js and .jsx without specifying extension
    extensions: ['.js', '.jsx'],
  },
};
