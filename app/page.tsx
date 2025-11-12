"use client";

import React, { useState, useEffect } from "react";
import {
  Camera,
  Flame,
  Users,
  Sun,
  Car,
  Package,
  Droplets,
  Bell,
  AlertTriangle,
  CheckCircle,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const [sensors, setSensors] = useState({
    fire: { status: "normal", temp: 24, detected: false },
    light: { status: "normal", lux: 450, mode: "auto" },
    humidity: { status: "normal", value: 65 },
    motion: { detected: false, lastDetection: null },
  });

  const [detections, setDetections] = useState({
    faces: [],
    vehicles: [],
    packages: [],
  });

  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Simulate real-time sensor updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) => ({
        ...prev,
        light: { ...prev.light, lux: Math.floor(Math.random() * 1000) },
        humidity: {
          ...prev.humidity,
          value: 60 + Math.floor(Math.random() * 20),
        },
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const addNotification = (type, message, icon) => {
    const newNotif = {
      id: Date.now(),
      type,
      message,
      icon,
      time: new Date().toLocaleTimeString(),
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
  };

  const simulateFireDetection = () => {
    setSensors((prev) => ({
      ...prev,
      fire: { status: "danger", temp: 85, detected: true },
    }));
    addNotification(
      "danger",
      "🔥 FIRE DETECTED! Emergency services notified",
      "fire"
    );
    sendLineNotification("Fire detected at entrance! Temperature: 85°C");
  };

  const simulateFaceDetection = () => {
    const faces = [
      { id: 1, name: "John Smith", type: "known", confidence: 98 },
      { id: 2, name: "Unknown Person", type: "unknown", confidence: 95 },
    ];
    const detected = faces[Math.floor(Math.random() * faces.length)];
    setDetections((prev) => ({
      ...prev,
      faces: [
        { ...detected, time: new Date().toLocaleTimeString() },
        ...prev.faces,
      ].slice(0, 5),
    }));
    addNotification(
      detected.type === "known" ? "success" : "warning",
      `Face detected: ${detected.name} (${detected.confidence}%)`,
      "face"
    );
    if (detected.type === "unknown") {
      sendLineNotification(
        `Unknown person detected at entrance - Confidence: ${detected.confidence}%`
      );
    }
  };

  const simulateVehicleDetection = () => {
    const vehicles = [
      { plate: "ABC-1234", type: "Car", color: "Blue" },
      { plate: "XYZ-5678", type: "Motorcycle", color: "Black" },
    ];
    const detected = vehicles[Math.floor(Math.random() * vehicles.length)];
    setDetections((prev) => ({
      ...prev,
      vehicles: [
        { ...detected, time: new Date().toLocaleTimeString() },
        ...prev.vehicles,
      ].slice(0, 5),
    }));
    addNotification(
      "info",
      `Vehicle: ${detected.plate} - ${detected.color} ${detected.type}`,
      "vehicle"
    );
  };

  const simulatePackageDetection = () => {
    const pkg = {
      id: `PKG-${Math.floor(Math.random() * 9999)}`,
      size: ["Small", "Medium", "Large"][Math.floor(Math.random() * 3)],
      time: new Date().toLocaleTimeString(),
    };
    setDetections((prev) => ({
      ...prev,
      packages: [pkg, ...prev.packages].slice(0, 5),
    }));
    addNotification(
      "success",
      `Package delivered: ${pkg.id} (${pkg.size})`,
      "package"
    );
    sendLineNotification(
      `Package delivered! ID: ${pkg.id} - Size: ${pkg.size}`
    );
  };

  const sendLineNotification = (message) => {
    console.log(`LINE Notification Sent: ${message}`);
    // In production, this would call LINE Notify API
  };

  const StatusCard = ({ title, icon: Icon, status, value, unit, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === "danger"
              ? "bg-red-100 text-red-700"
              : status === "warning"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {status === "danger"
            ? "ALERT"
            : status === "warning"
            ? "WARNING"
            : "NORMAL"}
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900">
        {value} <span className="text-lg text-gray-500">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">
                Smart Security System
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg">
                <Activity className="w-4 h-4" />
                <span className="font-semibold">System Active</span>
              </div>
              <button className="relative p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                <Bell className="w-5 h-5 text-white" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          {["dashboard", "detections", "notifications"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-blue-500 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Sensor Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatusCard
                title="Fire Detection"
                icon={Flame}
                status={sensors.fire.status}
                value={sensors.fire.temp}
                unit="°C"
                color={
                  sensors.fire.detected ? "border-red-500" : "border-green-500"
                }
              />
              <StatusCard
                title="Light Sensor"
                icon={Sun}
                status={sensors.light.status}
                value={sensors.light.lux}
                unit="Lux"
                color="border-yellow-500"
              />
              <StatusCard
                title="Humidity"
                icon={Droplets}
                status={sensors.humidity.status}
                value={sensors.humidity.value}
                unit="%"
                color="border-blue-500"
              />
            </div>

            {/* Live Camera Feed */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Live Camera Feed
              </h2>
              <div className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center border-2 border-slate-700">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500">
                    Camera feed would display here
                  </p>
                  <div className="mt-4 flex gap-2 justify-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-red-500 text-sm font-semibold">
                      REC
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Test Detection Systems
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button
                  onClick={simulateFireDetection}
                  className="flex flex-col items-center gap-2 bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg transition-colors"
                >
                  <Flame className="w-6 h-6" />
                  <span className="text-sm font-semibold">Fire Alert</span>
                </button>
                <button
                  onClick={simulateFaceDetection}
                  className="flex flex-col items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors"
                >
                  <Users className="w-6 h-6" />
                  <span className="text-sm font-semibold">Face Detect</span>
                </button>
                <button
                  onClick={simulateVehicleDetection}
                  className="flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors"
                >
                  <Car className="w-6 h-6" />
                  <span className="text-sm font-semibold">Vehicle</span>
                </button>
                <button
                  onClick={simulatePackageDetection}
                  className="flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors"
                >
                  <Package className="w-6 h-6" />
                  <span className="text-sm font-semibold">Package</span>
                </button>
                <button
                  onClick={() => {
                    setSensors((prev) => ({
                      ...prev,
                      fire: { status: "normal", temp: 24, detected: false },
                    }));
                    addNotification("success", "All systems cleared", "check");
                  }}
                  className="flex flex-col items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white p-4 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-sm font-semibold">Clear</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detections Tab */}
        {activeTab === "detections" && (
          <div className="space-y-6">
            {/* Face Recognition */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">
                  Face Recognition History
                </h2>
              </div>
              <div className="space-y-2">
                {detections.faces.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No face detections yet
                  </p>
                ) : (
                  detections.faces.map((face, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-700 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="text-white font-semibold">{face.name}</p>
                        <p className="text-gray-400 text-sm">
                          Confidence: {face.confidence}%
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            face.type === "known"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {face.type === "known" ? "Known" : "Unknown"}
                        </span>
                        <p className="text-gray-400 text-sm mt-1">
                          {face.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Vehicle Recognition */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Car className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">
                  Vehicle Detection History
                </h2>
              </div>
              <div className="space-y-2">
                {detections.vehicles.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No vehicle detections yet
                  </p>
                ) : (
                  detections.vehicles.map((vehicle, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-700 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="text-white font-semibold">
                          {vehicle.plate}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {vehicle.color} {vehicle.type}
                        </p>
                      </div>
                      <p className="text-gray-400 text-sm">{vehicle.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Package Detection */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">
                  Package Delivery History
                </h2>
              </div>
              <div className="space-y-2">
                {detections.packages.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No package deliveries yet
                  </p>
                ) : (
                  detections.packages.map((pkg, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-700 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="text-white font-semibold">{pkg.id}</p>
                        <p className="text-gray-400 text-sm">
                          Size: {pkg.size}
                        </p>
                      </div>
                      <p className="text-gray-400 text-sm">{pkg.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">
                LINE Notifications Log
              </h2>
            </div>
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No notifications yet
                </p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      notif.type === "danger"
                        ? "bg-red-900 border-red-500"
                        : notif.type === "warning"
                        ? "bg-yellow-900 border-yellow-500"
                        : notif.type === "success"
                        ? "bg-green-900 border-green-500"
                        : "bg-blue-900 border-blue-500"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-white">{notif.message}</p>
                      <span className="text-gray-400 text-sm whitespace-nowrap ml-4">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
