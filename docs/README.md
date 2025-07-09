# 🚀 AffiliatePro - Advanced Affiliate Marketing Platform

> **Plataforma avanzada de marketing de afiliados con IA integrada para detectar productos ganadores, generar contenido viral y construir embudos de conversión.**

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Keys](#-api-keys)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## ✨ Características

### 🔍 **Detector de Productos con IA**
- Análisis inteligente de productos usando Gemini API
- Métricas clave: CVR, EPC, AOV, ROI, estacionalidad
- Filtros avanzados por categoría, comisión, gravedad
- Exportación de resultados en múltiples formatos

### ✅ **Validador de Ofertas**
- Soporte para ClickBank, Amazon Associates, JVZoo, ShareASale
- Análisis de métricas de conversión y reembolso
- Sistema de puntuación y recomendaciones
- Validación masiva de URLs

### 🎨 **Generador de Contenido Viral**
- Contenido optimizado para TikTok, Facebook, Instagram, Email, YouTube
- Generación de hashtags, hooks y CTAs
- Métricas estimadas de engagement
- Historial de contenido generado

### 🏗️ **Arquitecto de Embudos**
- Constructor visual de embudos de ventas
- Plantillas para diferentes nichos
- Integración con productos detectados
- Exportación de embudos

### 👤 **Generador de Avatares**
- Creación de avatares psicográficos detallados
- Modo automático y personalizado
- Análisis demográfico y de comportamiento
- Exportación de perfiles

### 💰 **Calculadora de Beneficios**
- Proyecciones a 3-12 meses
- Escenarios conservador, realista, optimista
- Análisis de ROI y punto de equilibrio
- Recomendaciones de escalado

### 👨‍💼 **Panel de Administración**
- Gestión de usuarios y roles
- Analytics y métricas de uso
- Configuración de API keys
- Sistema de facturación

## 🏗️ Arquitectura

### **Patrón MVC Modular**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      VIEW       │    │   CONTROLLER    │    │      MODEL      │
│  (HTML + CSS)   │◄──►│  (JS Modules)   │◄──►│   (Firebase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
    ┌─────────┐           ┌─────────────┐         ┌─────────────┐
    │   UI    │           │   ROUTER    │         │  AI APIs    │
    │Components│          │   SYSTEM    │         │  Services   │
    └─────────┘           └─────────────┘         └─────────────┘
```

### **Módulos Principales**
- **Product Detector**: Detección de productos ganadores
- **Offer Validator**: Validación de ofertas de afiliados
- **Content Generator**: Generación de contenido viral
- **Funnel Architect**: Constructor de embudos
- **Avatar Generator**: Generación de avatares
- **Profit Calculator**: Cálculo de beneficios
- **Admin Panel**: Gestión del sistema

## 🛠️ Tecnologías

### **Frontend**
- **HTML5**: Estructura semántica y accesible
- **CSS3**: Sistema de diseño moderno con variables CSS
- **JavaScript ES6+**: Vanilla JS sin frameworks
- **Responsive Design**: Mobile-first approach

### **Backend & Base de Datos**
- **Firebase Authentication**: Autenticación segura
- **Firestore**: Base de datos NoSQL en tiempo real
- **Firebase Hosting**: Despliegue y hosting
- **Firebase Storage**: Almacenamiento de archivos

### **APIs Externas**
- **Google Gemini API**: IA para detección de productos
- **OpenAI API**: Generación de contenido (fallback)
- **ClickBank API**: Datos de productos de afiliados
- **Amazon Product Advertising API**: Información de productos

### **Herramientas de Desarrollo**
- **Firebase CLI**: Herramientas de desarrollo
- **ESLint**: Linting de código
- **Prettier**: Formateo de código
- **Git**: Control de versiones

## 🚀 Instalación

### **Prerrequisitos**
- Node.js (v16 o superior)
- npm o yarn
- Cuenta de Firebase
- API keys para servicios externos

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/jaimepivet/affiliate-pro.git
cd affiliate-pro
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Firebase**
```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Iniciar sesión en Firebase
firebase login

# Inicializar proyecto Firebase
firebase init
```

### **4. Configurar Variables de Entorno**
Crear archivo `.env` en la raíz del proyecto:
```env
# Firebase Config
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# AI APIs
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Affiliate APIs
CLICKBANK_API_KEY=your_clickbank_api_key
AMAZON_API_KEY=your_amazon_api_key
```

### **5. Desplegar a Firebase**
```bash
# Construir el proyecto
npm run build

# Desplegar
npm run deploy
```

## ⚙️ Configuración

### **Configuración de Firebase**

1. **Crear Proyecto Firebase**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuevo proyecto
   - Habilita Authentication, Firestore y Storage

2. **Configurar Reglas de Seguridad**
   - Las reglas ya están configuradas en `firestore.rules`
   - Ajusta según tus necesidades de seguridad

3. **Configurar Autenticación**
   - Habilita Email/Password en Firebase Auth
   - Configura el dominio autorizado

### **Configuración de APIs**

1. **Google Gemini API**
   - Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Crea una nueva API key
   - Configura límites de uso

2. **OpenAI API** (Opcional)
   - Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
   - Crea una nueva API key
   - Configura límites de facturación

3. **ClickBank API**
   - Contacta con ClickBank para acceso a la API
   - Obtén credenciales de autenticación

4. **Amazon Product Advertising API**
   - Regístrate en [Amazon Associates](https://affiliate-program.amazon.com/)
   - Solicita acceso a la API

## 📖 Uso

### **Inicio Rápido**

1. **Acceder a la Aplicación**
   ```
   https://your-project.firebaseapp.com
   ```

2. **Crear Cuenta**
   - Regístrate con email y contraseña
   - Verifica tu email

3. **Configurar API Keys**
   - Ve a Configuración > API Keys
   - Agrega tus claves de API

4. **Detectar Productos**
   - Ve a Product Detector
   - Ingresa nicho o palabras clave
   - Analiza los resultados

### **Flujo de Trabajo Típico**

1. **Detección de Productos**
   - Usa el Product Detector para encontrar productos ganadores
   - Filtra por métricas importantes
   - Guarda productos favoritos

2. **Validación de Ofertas**
   - Valida URLs de productos específicos
   - Analiza métricas de conversión
   - Obtén recomendaciones

3. **Generación de Contenido**
   - Selecciona un producto validado
   - Elige plataforma de destino
   - Genera contenido optimizado

4. **Construcción de Embudos**
   - Crea embudos de ventas
   - Integra productos y contenido
   - Optimiza conversiones

5. **Análisis de Beneficios**
   - Calcula proyecciones de ganancias
   - Analiza diferentes escenarios
   - Planifica escalado

## 🔑 API Keys

### **Configuración de API Keys**

Las API keys se almacenan de forma segura en el navegador del usuario. Para configurarlas:

1. **En la Aplicación**
   - Ve a Perfil > API Keys
   - Agrega cada API key individualmente
   - Las claves se almacenan localmente

2. **Programáticamente**
   ```javascript
   // Configurar API keys
   localStorage.setItem('GEMINI_API_KEY', 'your_key_here');
   localStorage.setItem('OPENAI_API_KEY', 'your_key_here');
   ```

### **Límites de Uso**

- **Gemini API**: 60 requests/minuto (gratuito)
- **OpenAI API**: Según tu plan
- **ClickBank API**: Según tu cuenta
- **Amazon API**: Según tu cuenta de Associates

## 📁 Estructura del Proyecto

```
affiliate-pro/
├── 📁 public/                    # Archivos públicos
│   ├── index.html               # Página principal
│   ├── 📁 assets/               # Recursos estáticos
│   │   ├── 📁 css/              # Estilos
│   │   │   ├── main.css         # Estilos principales
│   │   │   ├── components.css   # Componentes UI
│   │   │   ├── themes.css       # Sistema de temas
│   │   │   └── responsive.css   # Diseño responsivo
│   │   ├── 📁 js/               # JavaScript
│   │   │   ├── 📁 core/         # Núcleo de la aplicación
│   │   │   ├── 📁 modules/      # Módulos principales
│   │   │   ├── 📁 components/   # Componentes UI
│   │   │   ├── 📁 utils/        # Utilidades
│   │   │   └── 📁 services/     # Servicios externos
│   │   ├── 📁 images/           # Imágenes
│   │   └── 📁 fonts/            # Fuentes
│   ├── 📁 pages/                # Páginas HTML
│   └── 📁 locales/              # Archivos de idioma
├── 📁 docs/                     # Documentación
├── firebase.json                # Configuración Firebase
├── .firebaserc                  # Proyecto Firebase
└── package.json                 # Dependencias
```

### **Archivos Principales**

- **`public/index.html`**: Página principal SPA
- **`public/assets/js/core/app.js`**: Aplicación principal
- **`public/assets/js/core/router.js`**: Sistema de rutas
- **`public/assets/js/core/auth.js`**: Autenticación
- **`public/assets/js/modules/`**: Módulos de funcionalidad
- **`public/assets/css/main.css`**: Estilos principales

## 🤝 Contribución

### **Cómo Contribuir**

1. **Fork el Proyecto**
   ```bash
   git clone https://github.com/your-username/affiliate-pro.git
   ```

2. **Crear Rama de Feature**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Commit Cambios**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

4. **Push a la Rama**
   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Abrir Pull Request**

### **Estándares de Código**

- **JavaScript**: ES6+ con módulos
- **CSS**: BEM methodology
- **HTML**: Semántico y accesible
- **Comentarios**: JSDoc para funciones
- **Formato**: Prettier + ESLint

### **Testing**

```bash
# Ejecutar tests
npm test

# Linting
npm run lint

# Formateo
npm run format
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: jaime.pivet@gmail.com
- **Documentación**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/jaimepivet/affiliate-pro/issues)

## 🙏 Agradecimientos

- **Google Gemini**: Por la API de IA gratuita
- **Firebase**: Por la infraestructura backend
- **Comunidad Open Source**: Por las herramientas y librerías

---

**Desarrollado con ❤️ por Jaime Pivet**