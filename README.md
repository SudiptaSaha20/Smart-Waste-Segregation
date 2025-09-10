# ♻️ Smart Waste Segregation System

An **interactive 3D simulation** of a smart IoT + AI/ML waste segregation system.  
Built using **React, Vite, Three.js, TailwindCSS, and Lucide icons**.  

This project simulates how sensors and an overhead AI/ML camera work together to classify waste and decide whether the bin should open. It also demonstrates real-time feedback, counters for user actions, and handling of wrong disposals in a gamified yet realistic way.

---

## 🚀 Features  

- 🗑 **3D Smart Bin Simulation** – Three clearly labeled bins:  
  - **Green** → Biodegradable Waste (kitchen, garden)  
  - **Blue** → Recyclable Waste (paper, plastic, glass, metal)  
  - **Yellow** → Clinical & Biohazardous Waste (bandages, fluids, infected waste)  
- 🔍 **Hybrid Waste Detection** – Edge-mounted sensors + overhead AI/ML camera. Lid opens **only when both confirm the waste type**.  
- ⚡ **Realistic Process Flow** – Waste placed on bin → Sensor + Camera check → Correct bin opens / Wrong disposal triggers red LED buzzer.  
- 🔊 **Interactive Feedback** – Green LED for correct disposal, red LED buzzer for wrong disposal, with a **Reset** and **Recollect Waste** option.  
- 📊 **Smart Dashboard** – Live counters track:  
  - ✅ Correct disposals  
  - ⚠️ Wrong attempts (**increment immediately when waste is placed on the wrong bin**)  
  - ❌ Wrong disposals (waste left/reset without correction)  
- 🛠 **Advanced Handling Logic** –  
  - Correct disposal at once → only correct counter updates  
  - Wrong attempts → counted right away, even if later corrected  
  - Reset after wrong placement → wrong disposal counter increments  
- 🎛 **User Interaction** – Choose waste type and bin manually to simulate real-world decisions.  
- 🌗 **Modern UI/UX** – TailwindCSS styling, Lucide icons, and 3D animations with smooth transitions.  

---

## 🛠️ Tech Stack

- [React](https://react.dev/) – Frontend framework  
- [Vite](https://vitejs.dev/) – Fast development & build tool  
- [Three.js](https://threejs.org/) – 3D rendering engine  
- [TailwindCSS](https://tailwindcss.com/) – Utility-first styling  
- [Lucide Icons](https://lucide.dev/) – Icon set for UI elements  

---

## 📦 Installation & Setup

Clone the repository:
```bash
git clone https://github.com/SudiptaSaha20/Smart-Waste-Segregation.git
cd Smart-Waste-Segregation
```

Install dependencies:
```bash
npm install
```

Start development server:
```bash
npm run dev
```

Open your browser at:
```bash
http://localhost:5173
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

---

## 📂 Project Structure
```csharp
smart-waste-system/
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   ├── assets/        # Images/icons
│   ├── App.jsx        # Main app
│   ├── main.jsx       # Entry point
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md

```
---
## Check out live simulation:
[Smart Waste Management System](https://smart-waste-segregation-lemon.vercel.app/)

## 📜 License

This project is licensed under the MIT License.
Feel free to fork and use it for educational purposes.
