import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import {
  Recycle,
  Leaf,
  AlertTriangle,
  RotateCcw,
  Camera,
  Droplets,
  Magnet,
  Eye,
  Zap,
  Activity,
  CheckCircle,
  XCircle,
  Archive,
  BarChart3,
  Lightbulb,
  Trash2,
} from "lucide-react";

const SmartWasteSystem = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const binsRef = useRef({});
  const wasteItemRef = useRef(null);
  const animationIdRef = useRef(null);

  const [selectedWasteType, setSelectedWasteType] = useState(null);
  const [selectedBin, setSelectedBin] = useState(null);
  const [currentWastePosition, setCurrentWastePosition] = useState(null);
  const [binStatus, setBinStatus] = useState({});
  const [ledStatus, setLedStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [counters, setCounters] = useState({
    correctDisposals: 0,
    wrongAttempts: 0,
    wrongDisposals: 0,
  });
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [isWasteOnIncorrectBin, setIsWasteOnIncorrectBin] = useState(false);

  const wasteTypes = {
    kitchen: {
      name: "Kitchen Waste",
      icon: Leaf,
      color: 0x8fbc8f,
      correctBin: "green",
      shape: "sphere",
    },
    garden: {
      name: "Garden Waste",
      icon: Leaf,
      color: 0x228b22,
      correctBin: "green",
      shape: "irregular",
    },
    paper: {
      name: "Paper",
      icon: Recycle,
      color: 0xffa500,
      correctBin: "blue",
      shape: "flat",
    },
    plastic: {
      name: "Plastic",
      icon: Recycle,
      color: 0x00ff00,
      correctBin: "blue",
      shape: "bottle",
    },
    glass: {
      name: "Glass",
      icon: Recycle,
      color: 0x87ceeb,
      correctBin: "blue",
      shape: "cylinder",
    },
    metal: {
      name: "Metal",
      icon: Magnet,
      color: 0x888888,
      correctBin: "blue",
      shape: "can",
    },
    clinical: {
      name: "Clinical Waste",
      icon: AlertTriangle,
      color: 0xff4444,
      correctBin: "yellow",
      shape: "box",
    },
    bandages: {
      name: "Bandages",
      icon: AlertTriangle,
      color: 0xffffff,
      correctBin: "yellow",
      shape: "irregular",
    },
  };

  const bins = {
    green: {
      name: "Biodegradable Waste",
      color: 0x00aa00,
      position: [-6, 0, 0], // Increased spacing
      sensors: [
        {
          type: "moisture",
          name: "Moisture Sensor",
          icon: Droplets,
          color: "#4488ff",
        },
        { type: "gas", name: "Gas Sensor", icon: Zap, color: "#ffaa00" },
      ],
    },
    blue: {
      name: "Recyclable Waste",
      color: 0x0066cc,
      position: [0, 0, 0],
      sensors: [
        {
          type: "inductive",
          name: "Inductive Sensor",
          icon: Magnet,
          color: "#888888",
        },
        { type: "ir", name: "IR Sensor", icon: Eye, color: "#ff6600" },
      ],
    },
    yellow: {
      name: "Clinical Waste",
      color: 0xffcc00,
      position: [6, 0, 0], // Increased spacing
      sensors: [
        { type: "gas", name: "Gas Sensor", icon: Zap, color: "#ff4444" },
        {
          type: "proximity",
          name: "Proximity Sensor",
          icon: Activity,
          color: "#00ff88",
        },
      ],
    },
  };

  useEffect(() => {
    initThreeJS();
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (
        rendererRef.current &&
        mountRef.current &&
        mountRef.current.contains(rendererRef.current.domElement)
      ) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  const initThreeJS = () => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 800 / 500, 0.1, 1000);
    camera.position.set(0, 8, 16); // Adjusted for larger bins
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 500);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create bins
    createBins();

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
  };

  const createBins = () => {
    // Clear any existing bins to prevent replication
    Object.values(binsRef.current).forEach((bin) => {
      if (bin.group) {
        sceneRef.current.remove(bin.group);
      }
    });
    binsRef.current = {};

    Object.entries(bins).forEach(([binId, binConfig]) => {
      const binGroup = new THREE.Group();

      // Main bin body (rectangular) - made larger
      const binGeometry = new THREE.BoxGeometry(3.5, 3, 3); // Increased size
      const binMaterial = new THREE.MeshLambertMaterial({
        color: binConfig.color,
        transparent: true,
        opacity: 0.8,
      });
      const binMesh = new THREE.Mesh(binGeometry, binMaterial);
      binMesh.position.y = 0;
      binMesh.castShadow = true;
      binMesh.receiveShadow = true;
      binGroup.add(binMesh);

      // Create two-flap lid
      const lidGroup = new THREE.Group();

      // Left flap
      const leftFlapGeometry = new THREE.BoxGeometry(1.75, 0.1, 3); // Adjusted for larger bin
      const flapMaterial = new THREE.MeshLambertMaterial({
        color: binConfig.color,
      });
      const leftFlap = new THREE.Mesh(leftFlapGeometry, flapMaterial);
      leftFlap.position.set(-0.875, 1.55, 0); // Adjusted position
      leftFlap.userData = { originalRotation: 0, isOpen: false };
      lidGroup.add(leftFlap);

      // Right flap
      const rightFlap = new THREE.Mesh(
        leftFlapGeometry.clone(),
        flapMaterial.clone()
      );
      rightFlap.position.set(0.875, 1.55, 0); // Adjusted position
      rightFlap.userData = { originalRotation: 0, isOpen: false };
      lidGroup.add(rightFlap);

      binGroup.add(lidGroup);

      // Camera above bin
      const cameraGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
      const cameraMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      const cameraMesh = new THREE.Mesh(cameraGeometry, cameraMaterial);
      cameraMesh.position.set(0, 4, 0); // Adjusted for larger bin
      binGroup.add(cameraMesh);

      // Camera support
      const supportGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2.3, 8); // Adjusted height
      const supportMaterial = new THREE.MeshLambertMaterial({
        color: 0x666666,
      });
      const supportMesh = new THREE.Mesh(supportGeometry, supportMaterial);
      supportMesh.position.set(0, 2.85, 0); // Adjusted position
      binGroup.add(supportMesh);

      // Sensors on the side
      binConfig.sensors.forEach((sensor, index) => {
        const sensorGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.2);
        const sensorMaterial = new THREE.MeshLambertMaterial({
          color: 0x444444,
          transparent: true,
          opacity: 0.8,
        });
        const sensorMesh = new THREE.Mesh(sensorGeometry, sensorMaterial);
        sensorMesh.position.set(1.8, 0.5 + index * 0.6, 0); // Adjusted position
        binGroup.add(sensorMesh);

        // Sensor indicator light
        const lightGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const lightMaterial = new THREE.MeshLambertMaterial({
          color: 0x333333,
          transparent: true,
          opacity: 0.5,
        });
        const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
        lightMesh.position.set(2.0, 0.5 + index * 0.6, 0); // Adjusted position
        binGroup.add(lightMesh);
      });

      // LED indicator
      const ledGeometry = new THREE.SphereGeometry(0.15, 8, 6);
      const ledMaterial = new THREE.MeshLambertMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.5,
      });
      const ledMesh = new THREE.Mesh(ledGeometry, ledMaterial);
      ledMesh.position.set(0, 2.2, 1.6); // Adjusted position
      binGroup.add(ledMesh);

      // Label - made more visible
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 128;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.font = "48px Arial";
      context.textAlign = "center";
      context.fillText(binConfig.name, 256, 70);

      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshLambertMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const labelGeometry = new THREE.PlaneGeometry(3, 0.8); // Larger label
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      labelMesh.position.set(0, -2.2, 1.6); // Adjusted position
      labelMesh.rotation.x = -Math.PI / 2; // Make it face upward
      binGroup.add(labelMesh);

      binGroup.position.set(...binConfig.position);
      sceneRef.current.add(binGroup);

      binsRef.current[binId] = {
        group: binGroup,
        leftFlap: leftFlap,
        rightFlap: rightFlap,
        led: ledMesh,
        sensors: binGroup.children.filter(
          (child) =>
            child.geometry &&
            child.geometry.type === "BoxGeometry" &&
            child.position.x === 1.8
        ),
      };
    });
  };

  const createWasteItem = (wasteType) => {
    const waste = wasteTypes[wasteType];
    let geometry;

    switch (waste.shape) {
      case "sphere":
        geometry = new THREE.SphereGeometry(0.4, 16, 12); // Slightly larger
        break;
      case "bottle":
        geometry = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 12); // Slightly larger
        break;
      case "flat":
        geometry = new THREE.BoxGeometry(0.8, 0.15, 1.0); // Slightly larger
        break;
      case "can":
        geometry = new THREE.CylinderGeometry(0.25, 0.25, 1.0, 12); // Slightly larger
        break;
      case "box":
        geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Slightly larger
        break;
      case "irregular":
        geometry = new THREE.SphereGeometry(0.3, 8, 6); // Slightly larger
        break;
      default:
        geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4); // Slightly larger
    }

    const material = new THREE.MeshLambertMaterial({ color: waste.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 5, 0);
    mesh.castShadow = true;

    sceneRef.current.add(mesh);
    wasteItemRef.current = mesh;
  };

  const placeWasteOnBin = async (binId) => {
    if (!selectedWasteType || !wasteItemRef.current || isWasteOnIncorrectBin)
      return;

    setIsProcessing(true);
    const binPosition = bins[binId].position;
    const waste = wasteTypes[selectedWasteType];
    const isCorrectBin = waste.correctBin === binId;

    // Move waste to bin top - positioned properly on the lid
    await animateWasteToPosition(binPosition[0], 2.5, binPosition[2]);
    setCurrentWastePosition(binId);

    // Simulate sensor detection
    setBinStatus((prev) => ({ ...prev, [binId]: "scanning" }));
    await delay(1500);

    // Simulate AI/ML camera analysis
    setBinStatus((prev) => ({ ...prev, [binId]: "ai_processing" }));
    await delay(2000);

    if (isCorrectBin) {
      // Correct waste type
      setLedStatus("correct");
      setBinStatus((prev) => ({ ...prev, [binId]: "correct" }));

      // Open lid
      await openBinLid(binId);
      await delay(2000);

      // Drop waste into bin
      await animateWasteToPosition(binPosition[0], -1, binPosition[2]);

      // Close lid
      await closeBinLid(binId);

      // Update counters
      setCounters((prev) => ({
        ...prev,
        correctDisposals: prev.correctDisposals + 1,
        wrongAttempts: prev.wrongAttempts + currentAttempts,
      }));

      // Clean up
      cleanupWaste();
      setCurrentAttempts(0);
      setSelectedWasteType(null); // Clear selection after correct disposal
      setIsWasteOnIncorrectBin(false);
    } else {
      // Wrong waste type
      setLedStatus("incorrect");
      setBinStatus((prev) => ({ ...prev, [binId]: "incorrect" }));
      setCurrentAttempts((prev) => prev + 1);
      setIsWasteOnIncorrectBin(true);

      // Buzzer simulation (red LED flash)
      for (let i = 0; i < 3; i++) {
        updateBinLED(binId, 0xff0000);
        await delay(200);
        updateBinLED(binId, 0x333333);
        await delay(200);
      }
    }

    setBinStatus((prev) => ({ ...prev, [binId]: "idle" }));
    setLedStatus("");
    setIsProcessing(false);
  };

  const animateWasteToPosition = (x, y, z) => {
    return new Promise((resolve) => {
      if (!wasteItemRef.current) {
        resolve();
        return;
      }

      const startPos = wasteItemRef.current.position.clone();
      const endPos = new THREE.Vector3(x, y, z);
      const duration = 1500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        if (wasteItemRef.current) {
          wasteItemRef.current.position.lerpVectors(
            startPos,
            endPos,
            easeProgress
          );
          wasteItemRef.current.rotation.x += 0.02;
          wasteItemRef.current.rotation.z += 0.01;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  };

  const openBinLid = (binId) => {
    return new Promise((resolve) => {
      const bin = binsRef.current[binId];
      if (!bin) {
        resolve();
        return;
      }

      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const angle = (progress * Math.PI) / 3; // 60 degrees

        bin.leftFlap.rotation.z = -angle;
        bin.rightFlap.rotation.z = angle;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  };

  const closeBinLid = (binId) => {
    return new Promise((resolve) => {
      const bin = binsRef.current[binId];
      if (!bin) {
        resolve();
        return;
      }

      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const angle = ((1 - progress) * Math.PI) / 3;

        bin.leftFlap.rotation.z = -angle;
        bin.rightFlap.rotation.z = angle;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  };

  const updateBinLED = (binId, color) => {
    const bin = binsRef.current[binId];
    if (bin && bin.led) {
      bin.led.material.color.setHex(color);
      bin.led.material.opacity = color === 0x333333 ? 0.5 : 1;
    }
  };

  const recollectWaste = () => {
    if (wasteItemRef.current && !isProcessing) {
      animateWasteToPosition(0, 5, 0);
      setCurrentWastePosition(null);
      setBinStatus({});
      setLedStatus("");
      setIsWasteOnIncorrectBin(false);
    }
  };

  const resetSystem = () => {
    if (currentWastePosition && selectedWasteType) {
      const waste = wasteTypes[selectedWasteType];
      if (waste.correctBin !== currentWastePosition) {
        setCounters((prev) => ({
          ...prev,
          wrongDisposals: prev.wrongDisposals + 1,
          wrongAttempts: prev.wrongAttempts + currentAttempts,
        }));
      }
    }

    cleanupWaste();
    setSelectedWasteType(null); // Clear selection on reset
    setSelectedBin(null);
    setCurrentWastePosition(null);
    setBinStatus({});
    setLedStatus("");
    setCurrentAttempts(0);
    setIsProcessing(false);
    setIsWasteOnIncorrectBin(false);
  };

  const resetDashboard = () => {
    setCounters({
      correctDisposals: 0,
      wrongAttempts: 0,
      wrongDisposals: 0,
    });
  };

  const cleanupWaste = () => {
    if (wasteItemRef.current) {
      sceneRef.current.remove(wasteItemRef.current);
      wasteItemRef.current = null;
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleWasteSelection = (wasteType) => {
    if (isProcessing || isWasteOnIncorrectBin) return;

    cleanupWaste();
    setSelectedWasteType(wasteType);
    createWasteItem(wasteType);
    setCurrentWastePosition(null);
    setBinStatus({});
    setLedStatus("");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="text-center py-6 bg-gradient-to-r from-green-800 via-blue-800 to-yellow-800">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 via-blue-400 to-yellow-400 bg-clip-text text-transparent">
          Smart Waste Segregation System
        </h1>
        <p className="text-gray-300">
          3 Bin IoT + AI/ML Waste Classification with Sensor Integration
        </p>
      </div>

      <div className="flex flex-wrap lg:flex-nowrap gap-6 p-6">
        {/* 3D Visualization */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-800 rounded-xl p-4">
            <div ref={mountRef} className="w-full flex justify-center" />

            {/* Status Display */}
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold">System Status:</span>
                {ledStatus === "correct" && (
                  <CheckCircle className="w-5 h-5 text-green-400 animate-pulse" />
                )}
                {ledStatus === "incorrect" && (
                  <XCircle className="w-5 h-5 text-red-400 animate-pulse" />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(bins).map(([binId, binConfig]) => {
                  const status = binStatus[binId] || "idle";
                  let statusText = "Ready";
                  let statusColor = "text-gray-400";
                  let bgColor = "bg-gray-600/20";
                  
                  if (status === "scanning") {
                    statusText = "Sensors Scanning...";
                    statusColor = "text-yellow-400";
                  } else if (status === "ai_processing") {
                    statusText = "AI/ML Processing...";
                    statusColor = "text-blue-400";
                  } else if (status === "correct") {
                    statusText = "Correct Waste - Lid Open";
                    statusColor = "text-green-400";
                  } else if (status === "incorrect") {
                    statusText = "Wrong Waste - Buzzer!";
                    statusColor = "text-red-400";
                  }

                  return (
                    <div
                      key={binId}
                      className={`p-3 rounded-lg border-2 bg-opacity-20 ${
                        binId === "green"
                          ? "border-green-500 bg-green-600/20"
                          : binId === "blue"
                          ? "border-blue-500 bg-blue-600/20"
                          : "border-yellow-500 bg-yellow-600/20"
                      }`}
                    >
                      <div className="font-semibold mb-1">{binConfig.name}</div>
                      <div className={`text-sm ${statusColor}`}>
                        {statusText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls - Moved below system status */}
            <div className="mt-4 bg-gray-800 rounded-xl p-4">
              <h3 className="text-xl font-bold mb-4">Controls</h3>
              <div className="space-y-3">
                <button
                  onClick={recollectWaste}
                  disabled={!isWasteOnIncorrectBin || isProcessing}
                  className="w-full p-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Archive className="w-5 h-5" />
                  Recollect Waste
                </button>

                <button
                  onClick={resetSystem}
                  disabled={isProcessing}
                  className="w-full p-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset System
                </button>
              </div>
            </div>

            {/* Instructions - Moved below system status */}
            <div className="mt-4 bg-gray-800 rounded-xl p-4">
              <h3 className="text-xl font-bold mb-4">Instructions</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>1. Select waste type from the grid above</p>
                <p>2. Choose target bin to place waste</p>
                <p>3. Watch sensors scan and AI/ML process</p>
                <p>4. Lid opens only for correct waste type</p>
                <p>5. Red LED buzzer for wrong waste</p>
                <p>6. Use recollect button to retrieve waste</p>
                <p>7. Counters track all attempts and disposals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="w-full lg:w-96 space-y-6">
          {/* Statistics Dashboard */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              Statistics Dashboard
              <button
                onClick={resetDashboard}
                className="ml-auto text-sm bg-red-600 hover:bg-red-700 px-2 py-1 rounded flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Reset
              </button>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-green-600/20 border border-green-600 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-green-300">Correct Disposals</span>
                  <span className="text-2xl font-bold text-green-400">
                    {counters.correctDisposals}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-600/20 border border-yellow-600 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-300">Wrong Attempts</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    {counters.wrongAttempts}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-red-600/20 border border-red-600 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-red-300">Wrong Disposals</span>
                  <span className="text-2xl font-bold text-red-400">
                    {counters.wrongDisposals}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Waste Selection */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Archive className="w-6 h-6 text-green-400" />
              Select Waste Type
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(wasteTypes).map(([key, waste]) => {
                const IconComponent = waste.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleWasteSelection(key)}
                    disabled={isProcessing || isWasteOnIncorrectBin}
                    className={`p-2 rounded-lg border-2 transition-all duration-200 text-sm ${
                      selectedWasteType === key
                        ? "border-cyan-400 bg-cyan-400/20"
                        : "border-gray-600 hover:border-gray-500 bg-gray-700/50"
                    } ${
                      isProcessing || isWasteOnIncorrectBin
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:scale-105"
                    }`}
                  >
                    <IconComponent className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs font-medium">{waste.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bin Selection */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-blue-400" />
              Select Target Bin
            </h3>
            <div className="space-y-3">
              {Object.entries(bins).map(([binId, binConfig]) => (
                <button
                  key={binId}
                  onClick={() => placeWasteOnBin(binId)}
                  disabled={
                    !selectedWasteType || isProcessing || isWasteOnIncorrectBin
                  }
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                    binId === "green"
                      ? "border-green-500 hover:bg-green-500/20"
                      : binId === "blue"
                      ? "border-blue-500 hover:bg-blue-500/20"
                      : "border-yellow-500 hover:bg-yellow-500/20"
                  } ${
                    !selectedWasteType || isProcessing || isWasteOnIncorrectBin
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-105"
                  }`}
                >
                  <div className="font-semibold">{binConfig.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Smart detection system
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Removed Controls and Instructions from here as they're now in the main panel */}
        </div>
      </div>
    </div>
  );
};

export default SmartWasteSystem;
