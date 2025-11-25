// Estado global
let currentLanguage = 'es';
let translations = {};
let projects = [];
let availableLanguages = [];

// Función para detectar idiomas disponibles
async function detectAvailableLanguages() {
    const Languages = ['es', 'en','cat'];
    const detectedLanguages = [];
    
    for (const lang of Languages) {
        try {
            const response = await fetch(`lang/${lang}.txt`);
            if (response.ok) {
                const text = await response.text();
                const lines = text.split('\n');
                let languageName = lang.toUpperCase();
                
                for (const line of lines) {
                    if (line.startsWith('language_name:')) {
                        languageName = line.split(':')[1].trim();
                        break;
                    }
                }
                
                detectedLanguages.push({ code: lang, name: languageName });
            }
        } catch (error) {
            console.log(`Idioma ${lang} no disponible`);
        }
    }
    
    if (detectedLanguages.length === 0) {
        detectedLanguages.push({ code: 'es', name: 'Español' });
    }
    
    return detectedLanguages;
}

// Función para cargar traducciones desde archivos externos
async function loadTranslations(lang) {
    try {
        const response = await fetch(`lang/${lang}.txt`);
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo de traducciones');
        }
        const text = await response.text();
        const lines = text.split('\n');
        const loadedTranslations = {};
        
        lines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length) {
                loadedTranslations[key.trim()] = valueParts.join(':').trim();
            }
        });
        
        return loadedTranslations;
    } catch (error) {
        console.error('Error cargando traducciones:', error);
        throw error;
    }
}

// Función para detectar proyectos disponibles
async function detectAvailableProjects() {
    const maxProjectsToCheck = 5;
    const detectedProjects = [];
    
    for (let i = 1; i <= maxProjectsToCheck; i++) {
        try {
            const response = await fetch(`projects/proyecto${i}.json`);
            if (response.ok) {
                detectedProjects.push(`proyecto${i}.json`);
            }
        } catch (error) {
            // Continuar con el siguiente proyecto
        }
    }
    
    return detectedProjects;
}

// Función para cargar proyectos
async function loadProjects() {
    try {
        // Intentar cargar proyectos desde archivos
        const projectFiles = await detectAvailableProjects();
        const loadedProjects = [];
        
        for (const file of projectFiles) {
            try {
                const response = await fetch(`projects/${file}`);
                if (response.ok) {
                    const project = await response.json();
                    loadedProjects.push(project);
                }
            } catch (error) {
                console.log(`No se pudo cargar el proyecto: ${file}`);
            }
        }
        
        // Si no se cargaron proyectos
        if (loadedProjects.length === 0) {
            console.log("Sin proyectos externos");
        }
        
        return loadedProjects;
    } catch (error) {
        console.error('Error cargando proyectos:');
    }
}

function renderProjects(projects) {
    const track = document.getElementById('carousel-track');
    track.innerHTML = '';
    
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
            <div class="project-img">
                <img src="${project.image}" alt="${project.title}">
            </div>
            <div class="project-info">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="project-tags">
                    ${project.tags.map(tag => `<span>${tag}</span>`).join('')}
                </div>
                <div class="project-links">
                    <a href="${project.demoLink}" target="_blank"><i class="fas fa-external-link-alt"></i> Demo</a>
                    <a href="${project.codeLink}" target="_blank"><i class="fab fa-github"></i> Código</a>
                </div>
            </div>
        `;
        track.appendChild(projectCard);
    });
    
    // Inicializar el carrusel después de renderizar los proyectos
    setTimeout(() => {
        initCarousel();
    }, 100);
}
// Función para actualizar el selector de idiomas
function updateLanguageSelector(languages) {
    const languageOptions = document.getElementById('language-options');
    languageOptions.innerHTML = '';
    
    languages.forEach(langInfo => {
        const option = document.createElement('div');
        option.className = 'language-option';
        option.setAttribute('data-lang', langInfo.code);
        option.textContent = langInfo.name;
        option.addEventListener('click', () => changeLanguage(langInfo.code));
        languageOptions.appendChild(option);
    });
}

// Función para cambiar el idioma
async function changeLanguage(lang) {
    try {
        currentLanguage = lang;
        
        translations = await loadTranslations(lang);
        
        const currentLanguageSpan = document.getElementById('current-language');
        const langInfo = availableLanguages.find(l => l.code === lang);
        if (langInfo) {
            currentLanguageSpan.textContent = langInfo.name;
        } else {
            currentLanguageSpan.textContent = lang.toUpperCase();
        }
        
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                if (key === 'hero-title') {
                    element.innerHTML = translations[key];
                } else {
                    element.textContent = translations[key];
                }
            }
        });
        
        document.getElementById('language-options').classList.remove('active');
    } catch (error) {
        console.error('Error cambiando idioma:', error);
        alert('Error al cargar las traducciones. Intente nuevamente.');
    }
}

// Carrusel de proyectos
// Carrusel de proyectos - VERSIÓN CORREGIDA
let currentSlide = 0;
let track, slides, dotsContainer, dots;

function initCarousel() {
    track = document.getElementById('carousel-track');
    slides = document.querySelectorAll('.project-card');
    dotsContainer = document.getElementById('carousel-dots');
    dotsContainer.innerHTML = '';
    
    // Crear puntos de navegación
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
        dotsContainer.appendChild(dot);
    });
    
    dots = document.querySelectorAll('.dot');
    
    // Inicializar en la primera diapositiva
    currentSlide = 0;
    updateCarousel();
}

function updateCarousel() {
    if (!track || !slides.length) return;
    
    // Usar transform en 3D para evitar interferencias con clip-path
    track.style.transform = `translate3d(-${currentSlide * 100}%, 0, 0)`;
    
    // Actualizar puntos activos
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
    
    // Actualizar clases activas para animaciones
    slides.forEach((slide, index) => {
        if (index === currentSlide) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });
}

function goToSlide(slideIndex) {
    if (!slides.length) return;
    
    currentSlide = slideIndex;
    updateCarousel();
}
function showPopup(title, message, callback = null) {
    const popup = document.getElementById("popup");
    const popupTitle = document.getElementById("popup-title");
    const popupMessage = document.getElementById("popup-message");
    const popupBtn = document.getElementById("popup-btn");

    popupTitle.textContent = title;
    popupMessage.textContent = message;

    popup.classList.add("show");

    popupBtn.onclick = () => {
        popup.classList.remove("show");
        if (callback) callback();
    };
}

document.getElementById("contact-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const form = e.target;
    const data = new FormData(form);

    const response = await fetch("https://formspree.io/f/xldzgewv", {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
    });

    if (response.ok) {
        showPopup(
            "¡Mensaje enviado!",
            "Tu mensaje se envió correctamente",
            //() => { window.location.href = ""; }
        );
        form.reset();
    } else {
        showPopup(
            "Error",
            "Hubo un problema enviando tu mensaje. Inténtalo más tarde."
        );
    }
});

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    // Header scroll effect
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Animaciones para elementos al hacer scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.about-img, .skill-card, .project-card, .contact-info, .contact-form');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                element.classList.add('animate');
            }
        });
    };
    
    // Ejecutar al cargar y al hacer scroll
    window.addEventListener('scroll', animateOnScroll);
    
    // Menú móvil - CORREGIDO
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });
    
    // Cerrar menú al hacer clic en un enlace
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Cerrar menú al hacer clic fuera de él
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-links') && !e.target.closest('.menu-toggle')) {
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Selector de idioma
    document.getElementById('language-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('language-options').classList.toggle('active');
    });
    
    // Cerrar selector de idioma al hacer clic fuera
    document.addEventListener('click', function() {
        document.getElementById('language-options').classList.remove('active');
    });
    
    // Enlace de CV
    document.getElementById('cv-link').addEventListener('click', function(e) {
        e.preventDefault();
        // Reemplaza con la URL real de tu CV
        window.open('https://ejemplo.com/tu-cv.pdf', '_blank');
    });
    
    // Cargar idiomas disponibles y actualizar el selector
    availableLanguages = await detectAvailableLanguages();
    updateLanguageSelector(availableLanguages);
    
    // Cargar proyectos
    try {
        projects = await loadProjects();
        renderProjects(projects);
    } catch (error) {
        console.error('No se pudieron cargar los proyectos:', error);
        document.getElementById('projects-title').textContent = 'Proyectos no disponibles';
        document.getElementById('projects-subtitle').textContent = 'Error al cargar los proyectos';
    }
    
    // Cargar traducciones iniciales
    try {
        await changeLanguage('es');
    } catch (error) {
        console.error('No se pudieron cargar las traducciones:', error);
        // Mantener los textos por defecto que ya están en el HTML
    }
    
    // Inicializar animaciones después de cargar todo
    animateOnScroll();
    
    // Controles del carrusel
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (slides && slides.length > 0) {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            goToSlide(currentSlide);
        }
    });
    
    document.getElementById('next-btn').addEventListener('click', () => {
        if (slides && slides.length > 0) {
            currentSlide = (currentSlide + 1) % slides.length;
            goToSlide(currentSlide);
        }
    });
    
    // Prevenir que el menú se abra/cierre accidentalmente al desplazarse
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992) {
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});