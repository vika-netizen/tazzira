console.log("JS WORKING");

// SWIPER
const swiper = new Swiper(".trainersSwiper", {

  slidesPerView: 3,
  spaceBetween: 30,

  navigation: {
    nextEl: ".slider-next",
    prevEl: ".slider-prev",
  },

  breakpoints: {

    0: {
      slidesPerView: 1,
    },

    768: {
      slidesPerView: 2,
    },

    1100: {
      slidesPerView: 3,
    }

  }

});


// FILTER
const buttons = document.querySelectorAll(".filter-btn");
const slides = document.querySelectorAll(".swiper-slide");

buttons.forEach(button => {

  button.addEventListener("click", () => {

    // ACTIVE
    buttons.forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    const filter = button.dataset.filter;

    slides.forEach(slide => {

      const category = slide.dataset.category;

      if (
        filter === "all" ||
        category === filter
      ) {

        slide.style.display = "block";

      } else {

        slide.style.display = "none";

      }

    });

    swiper.update();

  });

});

async function loadHomeTrainers() {

    const container =
        document.getElementById('homeTrainers');

    const res =
        await fetch('/api/trainers');

    const trainers =
        await res.json();

    container.innerHTML =
        trainers.map(t => `
            <div class="trainer-card">
                <img src="${t.image}">
                <h3>${t.name}</h3>
                <p>${t.specialty}</p>
            </div>
        `).join('');
}

loadHomeTrainers();


fetch('/api/trainers')
.then(res => res.json())
.then(trainers => {

    const container =
        document.getElementById('trainers-container');

    trainers.forEach(trainer => {

        container.innerHTML += `
            <div class="trainer-card">

                <img src="${trainer.image}">

                <h3>${trainer.name}</h3>

                <p>${trainer.specialty}</p>

                <p>Досвід: ${trainer.experience}</p>

                <p>⭐ ${trainer.rating}</p>

                <a href="/trainer/${trainer.id}">
                    Детальніше
                </a>

            </div>
        `;

    });

});app.get('/api/trainer/:id', (req, res) => {

    db.get(
        'SELECT * FROM trainers WHERE id = ?',
        [req.params.id],
        (err, trainer) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(trainer);

        }
    );

});