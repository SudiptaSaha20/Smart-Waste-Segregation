import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { 
  Magnet, 
  Recycle, 
  FileText, 
  Leaf, 
  AlertTriangle, 
  RotateCcw,
  Cpu,
  Camera,
  Droplets,
  Zap,
  Eye,
  ChevronRight,
  CheckCircle,
  Activity
} from 'lucide-react';

const SmartWasteSystem = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const binRef = useRef(null);
  const wasteItemRef = useRef(null);
  const animationIdRef = useRef(null);
  const isMountedRef = useRef(false);
  
  const [currentStep, setCurrentStep] = useState('idle');
  const [selectedWaste, setSelectedWaste] = useState(null);
  const [sensorStatus, setSensorStatus] = useState({});
  const [classification, setClassification] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const wasteTypes = {
    metal: { 
      name: 'Metal', 
      icon: Magnet, 
      color: 0x888888,
      sensor: 'inductive',
      compartment: 'metal'
    },
    plastic: { 
      name: 'Plastic', 
      icon: Recycle, 
      color: 0x00ff00,
      sensor: 'ai_ml',
      compartment: 'plastic'
    },
    paper: { 
      name: 'Paper/Cardboard', 
      icon: FileText, 
      color: 0xffa500,
      sensor: 'ir_reflection',
      compartment: 'paper'
    },
    wet: { 
      name: 'Wet/Biodegradable', 
      icon: Leaf, 
      color: 0x8fbc8f,
      sensor: 'moisture',
      compartment: 'biodegradable'
    },
    biomedical: { 
      name: 'Biomedical/Sanitary', 
      icon: AlertTriangle, 
      color: 0xff4444,
      sensor: 'gas',
      compartment: 'biomedical'
    }
  };

  const sensorInfo = {
    inductive: { name: 'Inductive Sensor', icon: Magnet, color: '#888888' },
    ir_reflection: { name: 'IR Reflection', icon: Eye, color: '#ff6600' },
    gas: { name: 'Gas Sensor', icon: AlertTriangle, color: '#ff4444' },
    moisture: { name: 'Moisture Sensor', icon: Droplets, color: '#4488ff' },
    ai_ml: { name: 'AI/ML Camera', icon: Camera, color: '#00ff00' }
  };

  useEffect(() => {
    isMountedRef.current = true;
    initThreeJS();
    
    return () => {
      isMountedRef.current = false;
      cleanupThreeJS();
    };
  }, []);

  const initThreeJS = () => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 600 / 400, 0.1, 1000);
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 400);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Create smart bin
    createSmartBin();

    // Animation loop
    const animate = () => {
      if (!isMountedRef.current) return;
      animationIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
  };

  const cleanupThreeJS = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose();
      
      if (mountRef.current && rendererRef.current.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    }
    
    // Clean up Three.js objects to prevent memory leaks
    if (sceneRef.current) {
      while(sceneRef.current.children.length > 0) {
        const object = sceneRef.current.children[0];
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
        sceneRef.current.remove(object);
      }
    }
  };

  const createSmartBin = () => {
    const binGroup = new THREE.Group();
    
    // Main bin body
    const binGeometry = new THREE.CylinderGeometry(2, 2.5, 4, 8);
    const binMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2a2a2a,
      transparent: true,
      opacity: 0.8
    });
    const binMesh = new THREE.Mesh(binGeometry, binMaterial);
    binMesh.position.y = 0;
    binMesh.castShadow = true;
    binMesh.receiveShadow = true;
    binGroup.add(binMesh);

    // Compartments (visual indicators)
    const compartmentColors = [0xff4444, 0x00ff00, 0xffa500, 0x8fbc8f, 0x888888];
    for (let i = 0; i < 5; i++) {
      const compartmentGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.3);
      const compartmentMaterial = new THREE.MeshLambertMaterial({ 
        color: compartmentColors[i],
        transparent: true,
        opacity: 0.6
      });
      const compartmentMesh = new THREE.Mesh(compartmentGeometry, compartmentMaterial);
      const angle = (i / 5) * Math.PI * 2;
      compartmentMesh.position.x = Math.cos(angle) * 2;
      compartmentMesh.position.z = Math.sin(angle) * 2;
      compartmentMesh.position.y = -1.5;
      binGroup.add(compartmentMesh);
    }

    // Sensor indicators
    const sensorGeometry = new THREE.RingGeometry(0.2, 0.3, 8);
    const sensorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3
    });
    
    for (let i = 0; i < 4; i++) {
      const sensorMesh = new THREE.Mesh(sensorGeometry, sensorMaterial.clone());
      const angle = (i / 4) * Math.PI * 2;
      sensorMesh.position.x = Math.cos(angle) * 2.2;
      sensorMesh.position.z = Math.sin(angle) * 2.2;
      sensorMesh.position.y = 1;
      sensorMesh.lookAt(0, 1, 0);
      binGroup.add(sensorMesh);
    }

    // Top opening
    const topGeometry = new THREE.RingGeometry(0.8, 1.2, 16);
    const topMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5
    });
    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.position.y = 2.5;
    topMesh.rotation.x = -Math.PI / 2;
    binGroup.add(topMesh);

    sceneRef.current.add(binGroup);
    binRef.current = binGroup;
  };

  const createWasteItem = (wasteType) => {
    // Remove any existing waste item
    if (wasteItemRef.current) {
      sceneRef.current.remove(wasteItemRef.current);
      wasteItemRef.current = null;
    }

    const waste = wasteTypes[wasteType];
    let geometry;
    
    switch(wasteType) {
      case 'metal':
        geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
        break;
      case 'plastic':
        geometry = new THREE.CylinderGeometry(0.15, 0.25, 1, 8);
        break;
      case 'paper':
        geometry = new THREE.BoxGeometry(0.6, 0.1, 0.8);
        break;
      case 'wet':
        geometry = new THREE.SphereGeometry(0.3, 8, 6);
        break;
      case 'biomedical':
        geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        break;
      default:
        geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    }

    const material = new THREE.MeshLambertMaterial({ color: waste.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 6, 0);
    mesh.castShadow = true;
    
    sceneRef.current.add(mesh);
    wasteItemRef.current = mesh;
  };

  const animateWasteProcessing = async (wasteType) => {
    if (isAnimating || !isMountedRef.current) return;
    
    setIsAnimating(true);
    setSelectedWaste(wasteType);
    setCurrentStep('dropping');
    setSensorStatus({});
    setClassification('');

    try {
      // Create waste item
      createWasteItem(wasteType);
      
      // Step 1: Drop waste into bin
      await animateDrop();
      if (!isMountedRef.current) return;
      
      // Step 2: Sensor detection
      setCurrentStep('sensor_detection');
      await animateSensorDetection(wasteType);
      if (!isMountedRef.current) return;
      
      // Step 3: AI/ML processing (for plastic only)
      if (wasteType === 'plastic') {
        setCurrentStep('ai_processing');
        await animateAIProcessing();
        if (!isMountedRef.current) return;
      }
      
      // Step 4: Final classification and disposal
      setCurrentStep('classification');
      await animateClassification(wasteType);
      if (!isMountedRef.current) return;
      
      // Cleanup
      if (wasteItemRef.current) {
        sceneRef.current.remove(wasteItemRef.current);
        wasteItemRef.current = null;
      }
      
      if (isMountedRef.current) {
        setCurrentStep('completed');
        setIsAnimating(false);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setIsAnimating(false);
      }
    }
  };

  const animateDrop = () => {
    return new Promise((resolve) => {
      const startY = 6;
      const endY = 2;
      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        if (!isMountedRef.current || !wasteItemRef.current) {
          resolve();
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        
        wasteItemRef.current.position.y = startY + (endY - startY) * easeProgress;
        wasteItemRef.current.rotation.x += 0.05;
        wasteItemRef.current.rotation.z += 0.03;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  };

  const animateSensorDetection = (wasteType) => {
    return new Promise((resolve) => {
      if (!isMountedRef.current) {
        resolve();
        return;
      }

      const waste = wasteTypes[wasteType];
      const sensorType = waste.sensor;
      
      setSensorStatus({ [sensorType]: 'active' });
      
      // Highlight sensor for 2 seconds
      setTimeout(() => {
        if (!isMountedRef.current) {
          resolve();
          return;
        }
        setSensorStatus({ [sensorType]: 'detected' });
        setTimeout(resolve, 500);
      }, 2000);
    });
  };

  const animateAIProcessing = () => {
    return new Promise((resolve) => {
      if (!isMountedRef.current) {
        resolve();
        return;
      }

      setSensorStatus(prev => ({ ...prev, ai_ml: 'processing' }));
      
      setTimeout(() => {
        if (!isMountedRef.current) {
          resolve();
          return;
        }
        setSensorStatus(prev => ({ ...prev, ai_ml: 'confirmed' }));
        setTimeout(resolve, 1000);
      }, 2000);
    });
  };

  const animateClassification = (wasteType) => {
    return new Promise((resolve) => {
      if (!isMountedRef.current || !wasteItemRef.current) {
        resolve();
        return;
      }

      const waste = wasteTypes[wasteType];
      setClassification(`Classified as: ${waste.name}`);
      
      // Animate waste moving to compartment
      const targetAngle = Object.keys(wasteTypes).indexOf(wasteType) / 5 * Math.PI * 2;
      const targetX = Math.cos(targetAngle) * 2;
      const targetZ = Math.sin(targetAngle) * 2;
      const targetY = -1;
      
      const startPos = wasteItemRef.current.position.clone();
      const duration = 1500;
      const startTime = Date.now();

      const animate = () => {
        if (!isMountedRef.current || !wasteItemRef.current) {
          resolve();
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 2); // Ease out
        
        wasteItemRef.current.position.x = startPos.x + (targetX - startPos.x) * easeProgress;
        wasteItemRef.current.position.y = startPos.y + (targetY - startPos.y) * easeProgress;
        wasteItemRef.current.position.z = startPos.z + (targetZ - startPos.z) * easeProgress;
        wasteItemRef.current.scale.setScalar(1 - progress * 0.7);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  };

  const resetSystem = () => {
    if (isAnimating) return;
    
    setCurrentStep('idle');
    setSelectedWaste(null);
    setSensorStatus({});
    setClassification('');
    
    if (wasteItemRef.current) {
      sceneRef.current.remove(wasteItemRef.current);
      wasteItemRef.current = null;
    }
  };

  const getStepDescription = () => {
    switch(currentStep) {
      case 'dropping':
        return 'Waste item dropping into smart bin...';
      case 'sensor_detection':
        return 'Layer 1: Running sensor checks...';
      case 'ai_processing':
        return 'Layer 2: AI/ML verification in progress...';
      case 'classification':
        return 'Routing to appropriate compartment...';
      case 'completed':
        return 'Classification complete!';
      default:
        return 'Select a waste type to begin simulation';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="text-center py-8 bg-gradient-to-r from-blue-800 to-purple-800 shadow-lg">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Smart Waste Segregation System
        </h1>
        <p className="text-gray-200 text-lg">
          Interactive 3D IoT + AI/ML Waste Classification Simulation
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
        {/* 3D Visualization */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-cyan-300 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              3D Visualization
            </h2>
            <div
              ref={mountRef}
              className="w-full flex justify-center rounded-lg overflow-hidden border border-gray-700"
            />

            {/* Status Display */}
            <div className="mt-6 p-5 bg-gray-750 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Cpu className="w-6 h-6 text-cyan-400" />
                <span className="font-semibold text-lg">System Status:</span>
              </div>
              <p className="text-cyan-300 text-md font-medium">
                {getStepDescription()}
              </p>
              {classification && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-green-900/30 rounded-lg border border-green-800/50">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-400 font-bold">{classification}</p>
                </div>
              )}
            </div>

            {/* Process Flow */}
            <div className="mt-6 bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
              <h3 className="text-xl font-semibold mb-5 text-blue-400">
                Process Flow
              </h3>
              <div className="space-y-3">
                {[
                  { step: "dropping", label: "Waste Drop Detection" },
                  {
                    step: "sensor_detection",
                    label: "Layer 1: Sensor Analysis",
                  },
                  {
                    step: "ai_processing",
                    label: "Layer 2: AI/ML Verification",
                  },
                  { step: "classification", label: "Classification & Routing" },
                  { step: "completed", label: "Disposal Complete" },
                ].map((item, index) => {
                  const isActive = currentStep === item.step;
                  const isCompleted =
                    [
                      "completed",
                      "classification",
                      "ai_processing",
                      "sensor_detection",
                      "dropping",
                    ].indexOf(currentStep) >
                    [
                      "completed",
                      "classification",
                      "ai_processing",
                      "sensor_detection",
                      "dropping",
                    ].indexOf(item.step);

                  return (
                    <div
                      key={index}
                      className={`flex items-center p-3 rounded-xl border-2 transition-all ${
                        isActive
                          ? "bg-blue-900/30 border-blue-600 text-blue-300"
                          : isCompleted
                          ? "bg-green-900/20 border-green-700/50 text-green-300"
                          : "bg-gray-750 border-gray-700 text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                          isActive
                            ? "bg-blue-600"
                            : isCompleted
                            ? "bg-green-600"
                            : "bg-gray-700"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-semibold">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto w-4 h-4 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="w-full lg:w-96 space-y-6">
          {/* Waste Selection */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
            <h3 className="text-xl font-semibold mb-5 text-green-400 flex items-center gap-2">
              <Recycle className="w-6 h-6" />
              Select Waste Type
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(wasteTypes).map(([key, waste]) => {
                const IconComponent = waste.icon;
                const isSelected = selectedWaste === key;

                return (
                  <button
                    key={key}
                    onClick={() => animateWasteProcessing(key)}
                    disabled={isAnimating}
                    className={`p-4 rounded-xl transition-all duration-200 flex flex-col items-center justify-center ${
                      isSelected
                        ? "bg-cyan-900/40 border-2 border-cyan-500 shadow-lg shadow-cyan-500/20"
                        : "bg-gray-750 border-2 border-gray-600 hover:border-gray-500"
                    } ${
                      isAnimating
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:scale-105"
                    }`}
                  >
                    <IconComponent
                      className={`w-8 h-8 mb-2 ${
                        isSelected ? "text-cyan-300" : "text-gray-300"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        isSelected ? "text-cyan-200" : "text-gray-300"
                      }`}
                    >
                      {waste.name}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={resetSystem}
              disabled={isAnimating}
              className="w-full mt-5 p-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Reset System
            </button>
          </div>

          {/* Sensor Status */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
            <h3 className="text-xl font-semibold mb-5 text-yellow-400 flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Sensor Status
            </h3>
            <div className="space-y-4">
              {Object.entries(sensorInfo).map(([key, sensor]) => {
                const IconComponent = sensor.icon;
                const status = sensorStatus[key];
                let statusColor = "text-gray-500";
                let bgColor = "bg-gray-750";
                let borderColor = "border-gray-700";

                if (status === "active") {
                  statusColor = "text-yellow-400";
                  bgColor = "bg-yellow-900/20";
                  borderColor = "border-yellow-700/50";
                } else if (status === "detected" || status === "confirmed") {
                  statusColor = "text-green-400";
                  bgColor = "bg-green-900/20";
                  borderColor = "border-green-700/50";
                } else if (status === "processing") {
                  statusColor = "text-blue-400";
                  bgColor = "bg-blue-900/20";
                  borderColor = "border-blue-700/50";
                }

                return (
                  <div
                    key={key}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${borderColor} ${bgColor}`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent
                        className={`w-6 h-6 ${statusColor} ${
                          status === "active" || status === "processing"
                            ? "animate-pulse"
                            : ""
                        }`}
                      />
                      <span className="font-medium text-gray-200">
                        {sensor.name}
                      </span>
                      {status && (
                        <div
                          className={`ml-auto w-3 h-3 rounded-full ${
                            status === "active" || status === "processing"
                              ? "bg-yellow-400 animate-pulse"
                              : "bg-green-400"
                          }`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartWasteSystem;