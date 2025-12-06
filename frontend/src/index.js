import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
//import AppProviders from "./components/providers/AppProviders";


import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* <AppProviders> */}
        <App />
        {/* </AppProviders> */}
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
