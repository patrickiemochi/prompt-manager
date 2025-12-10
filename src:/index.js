// index.js - React 應用入口點

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 建立 React 根元素並掛載應用
const root = ReactDOM.createRoot(
  document.getElementById('root')
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
