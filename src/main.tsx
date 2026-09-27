import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/onest";
import App from "./app/App";
import "./styles.css";
const mobileEntry = matchMedia('(max-width: 699px)').matches ||
  matchMedia('(pointer: coarse) and (max-height: 500px)').matches;
// The public root opens the case; embedded previews always keep the app entry.
if (import.meta.env.PROD && window.top === window.self && !mobileEntry) {
  location.replace(new URL('./case.html', location.href).href);
} else ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
