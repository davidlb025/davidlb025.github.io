/* ===============================
   PROYECTOS (JSON)
================================ */

let projects = [];
let currentSlide = 0;
let track, slides, dotsContainer, dots;

// Detectar proyectos disponibles
async function detectAvailableProjects() {
    const maxProjectsToCheck = 5;
    const detectedProjects = [];

    for (let i = 1; i <= maxProjectsToCheck; i++) {
        try {
            const response = await fetch(`/en/projects/proyecto${i}.json`);
            if (response.ok) {
                detectedProjects.push(`proyecto${i}.json`);
            }
        } catch (error) {}
    }

    return detectedProjects;
}

// Cargar proyectos
async function loadProjects() {
    const files = await detectAvailableProjects();
    const loadedProjects = [];

    for (const file of files) {
        try {
            const response = await fetch(`/en/projects/${file}`);
            if (response.ok) {
                loadedProjects.push(await response.json());
            }
        } catch (error) {}
    }

    return loadedProjects;
}

// Renderizar proyectos
function renderProjects(projects) {
    track = document.getElementById("carousel-track");
    track.innerHTML = "";

    projects.forEach(project => {
        const card = document.createElement("div");
        card.className = "project-card";

        card.innerHTML = `
            <div class="project-img">
                <img src="${project.image}" alt="${project.title}">
            </div>
            <div class="project-info">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="project-tags">
                    ${project.tags.map(tag => `<span>${tag}</span>`).join("")}
                </div>
                <div class="project-links">
                    <a href="${project.demoLink}" target="_blank">
                        <i class="fas fa-external-link-alt"></i> Demo
                    </a>
                    <a href="${project.codeLink}" target="_blank">
                        <i class="fab fa-github"></i> Code
                    </a>
                </div>
            </div>
        `;

        track.appendChild(card);
    });

    setTimeout(initCarousel, 100);
}

/* ===============================
   CARRUSEL
================================ */

function initCarousel() {
    slides = document.querySelectorAll(".project-card");
    dotsContainer = document.getElementById("carousel-dots");
    dotsContainer.innerHTML = "";

    slides.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.className = "dot";
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", () => goToSlide(i));
        dotsContainer.appendChild(dot);
    });

    dots = document.querySelectorAll(".dot");
    currentSlide = 0;
    updateCarousel();
}

function updateCarousel() {
    if (!slides.length) return;

    track.style.transform = `translate3d(-${currentSlide * 100}%, 0, 0)`;

    dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === currentSlide);
    });
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}