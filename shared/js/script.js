/* ===============================
   POPUP
================================ */

function showPopup(title, message) {
    const popup = document.getElementById("popup");
    document.getElementById("popup-title").textContent = title;
    document.getElementById("popup-message").textContent = message;

    popup.classList.add("show");

    document.getElementById("popup-btn").onclick = () => {
        popup.classList.remove("show");
    };
}

/* ===============================
   DOM READY
================================ */

document.addEventListener("DOMContentLoaded", async () => {

    /* HEADER SCROLL */
    const header = document.getElementById("header");
    window.addEventListener("scroll", () => {
        header.classList.toggle("scrolled", window.scrollY > 100);
    });

    /* ANIMACIONES SCROLL */
    const animateOnScroll = () => {
        document.querySelectorAll(
            ".about-img, .skill-card, .project-card, .contact-info, .contact-form"
        ).forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight / 1.2) {
                el.classList.add("animate");
            }
        });
    };

    window.addEventListener("scroll", animateOnScroll);
    animateOnScroll();

    /* MENÚ MÓVIL */
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    menuToggle.addEventListener("click", e => {
        e.stopPropagation();
        navLinks.classList.toggle("active");
        document.body.style.overflow = navLinks.classList.contains("active") ? "hidden" : "";
    });

    document.addEventListener("click", e => {
        if (!e.target.closest(".nav-links") && !e.target.closest(".menu-toggle")) {
            navLinks.classList.remove("active");
            document.body.style.overflow = "";
        }
    });

    /* FORMULARIO */
    document.getElementById("contact-form").addEventListener("submit", async e => {
        e.preventDefault();

        const form = e.target;
        const response = await fetch("https://formspree.io/f/xldzgewv", {
            method: "POST",
            body: new FormData(form),
            headers: { Accept: "application/json" }
        });

        if (response.ok) {
            showPopup("¡Mensaje enviado!", "Tu mensaje se envió correctamente");
            form.reset();
        } else {
            showPopup("Error", "No se pudo enviar el mensaje");
        }
    });

    /* CARGAR PROYECTOS */
    try {
        projects = await loadProjects();
        renderProjects(projects);
    } catch {
        document.getElementById("projects-title").textContent = "Proyectos no disponibles";
    }

    /* CONTROLES CARRUSEL */
    document.getElementById("prev-btn").addEventListener("click", () => {
        if (!slides.length) return;
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateCarousel();
    });

    document.getElementById("next-btn").addEventListener("click", () => {
        if (!slides.length) return;
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarousel();
    });

    /* RESIZE */
    window.addEventListener("resize", () => {
        if (window.innerWidth > 992) {
            navLinks.classList.remove("active");
            document.body.style.overflow = "";
        }
    });
    /*  SELECTOR DE IDIOMA */

    const languageBtn = document.querySelector(".language-btn");
    const languageOptions = document.querySelector(".language-options");

    if (languageBtn && languageOptions) {

        languageBtn.addEventListener("click", e => {
            e.stopPropagation();
            languageOptions.classList.toggle("active");
        });

        // Cerrar al hacer click fuera
        document.addEventListener("click", () => {
            languageOptions.classList.remove("active");
        });

        // Evitar que se cierre al clicar dentro
        languageOptions.addEventListener("click", e => {
            e.stopPropagation();
        });
    }

});
