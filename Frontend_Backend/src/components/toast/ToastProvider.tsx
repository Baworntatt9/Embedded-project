"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function ToastProvider() {
  return (
    <ToastContainer
      position="top-left"
      theme="colored"
      autoClose={3000}
      newestOnTop
      pauseOnHover
      className="onbedded-toast-container"
    />
  );
}
