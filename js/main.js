/* ==========================================================================
   [Company Name] — site scripts
   No build step / framework: everything below is vanilla JS so the site
   stays a plain static export. Sections are marked for easy editing.
   ========================================================================== */

(function () {
  'use strict';

  /* -------------------------------------------------------------
     Config placeholders — swap these for the client's real values
     ------------------------------------------------------------- */
  var CONFIG = {
    // Replace with the client's live Stripe Payment Link.
    // Configure the Payment Link's "After payment" redirect in the Stripe
    // Dashboard to point at this site's /success.html.
    stripePaymentLink: 'https://buy.stripe.com/REPLACE_WITH_PAYMENT_LINK'
  };

  /* -------------------------------------------------------------
     Footer year
     ------------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* -------------------------------------------------------------
     Mobile nav toggle
     ------------------------------------------------------------- */
  var navToggle = document.querySelector('.nav-toggle');
  var navbar = document.querySelector('.navbar');

  if (navToggle && navbar) {
    navToggle.addEventListener('click', function () {
      var isOpen = navbar.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navbar.querySelectorAll('.nav-links a, .nav-utility-links a, .nav-mobile-utility a, .nav-mobile-cta').forEach(function (link) {
      link.addEventListener('click', function () {
        navbar.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* -------------------------------------------------------------
     Highlight current nav link
     ------------------------------------------------------------- */
  var currentPage = (window.location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a[href], .nav-utility-links a[href], .nav-mobile-utility a[href]').forEach(function (link) {
    var rawHref = link.getAttribute('href');
    if (rawHref.indexOf('#') !== -1) return; // anchors are handled by scroll position, not marked active
    var href = rawHref || 'index.html';
    if (href === currentPage || (href === 'index.html' && currentPage === '')) {
      link.classList.add('active');
    }
  });

  /* -------------------------------------------------------------
     FAQ accordion
     ------------------------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', function () {
      var wasOpen = item.classList.contains('is-open');
      item.closest('.faq-list').querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('is-open');
        var q = i.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('is-open');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* -------------------------------------------------------------
     Scroll-reveal animation
     ------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* -------------------------------------------------------------
     Hero background slideshow — full-bleed photos auto-advance
     one at a time behind the hero copy.
     ------------------------------------------------------------- */
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var heroSlides = document.querySelectorAll('.hero-bg-slide');

  if (!prefersReducedMotion && heroSlides.length > 1) {
    var currentSlide = 0;
    setInterval(function () {
      var next = (currentSlide + 1) % heroSlides.length;
      heroSlides[currentSlide].classList.remove('is-active');
      heroSlides[next].classList.add('is-active');
      currentSlide = next;
    }, 4000);
  }

  /* -------------------------------------------------------------
     Generic form validation helper
     ------------------------------------------------------------- */
  function validateForm(form) {
    var isValid = true;
    var firstInvalid = null;

    form.querySelectorAll('[required]').forEach(function (field) {
      var group = field.closest('.form-group') || field.parentElement;
      var errorEl = group ? group.querySelector('.field-error') : null;
      var value = (field.value || '').trim();
      var fieldValid = true;

      if (!value) {
        fieldValid = false;
      } else if (field.type === 'email') {
        fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      } else if (field.type === 'tel') {
        fieldValid = /^[0-9+\-()\s]{7,}$/.test(value);
      } else if (field.type === 'date') {
        var chosen = new Date(value + 'T00:00:00');
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        fieldValid = !isNaN(chosen.getTime()) && chosen >= today;
      }

      if (!fieldValid) {
        isValid = false;
        if (group) group.classList.add('has-error');
        if (errorEl && !errorEl.textContent) {
          errorEl.textContent = 'Please provide a valid value.';
        }
        if (!firstInvalid) firstInvalid = field;
      } else if (group) {
        group.classList.remove('has-error');
      }
    });

    if (firstInvalid) firstInvalid.focus();
    return isValid;
  }

  document.querySelectorAll('input[required], textarea[required], select[required]').forEach(function (field) {
    field.addEventListener('input', function () {
      var group = field.closest('.form-group');
      if (group) group.classList.remove('has-error');
    });
  });

  /* -------------------------------------------------------------
     Contact form (index.html) — placeholder submit handler
     ------------------------------------------------------------- */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = contactForm.querySelector('.form-status');
      if (!validateForm(contactForm)) {
        if (status) {
          status.textContent = 'Please complete all required fields correctly.';
          status.className = 'form-status error';
        }
        return;
      }
      // TODO: connect to a backend / email service (e.g. Formspree, a serverless
      // function, or the client's CRM) to actually deliver this submission.
      if (status) {
        status.textContent = 'Thank you — your message has been received. We will be in touch within one business day.';
        status.className = 'form-status success';
      }
      contactForm.reset();
    });
  }

  /* -------------------------------------------------------------
     Request a Quote form (quote.html) — placeholder submit handler
     ------------------------------------------------------------- */
  var quoteForm = document.getElementById('quote-form');
  if (quoteForm) {
    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = quoteForm.querySelector('.form-status');
      if (!validateForm(quoteForm)) {
        if (status) {
          status.textContent = 'Please complete all required fields correctly.';
          status.className = 'form-status error';
        }
        return;
      }
      // TODO: connect to a backend / email service to deliver quote requests.
      if (status) {
        status.textContent = 'Thank you — your quote request has been received. Our team will respond within one business day.';
        status.className = 'form-status success';
      }
      quoteForm.reset();
    });
  }

  /* -------------------------------------------------------------
     Book a Consultation form (booking.html) — validate, then hand
     off to Stripe Checkout via a Payment Link.
     ------------------------------------------------------------- */
  var bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = bookingForm.querySelector('.form-status');

      if (!validateForm(bookingForm)) {
        if (status) {
          status.textContent = 'Please complete all required fields correctly before continuing to payment.';
          status.className = 'form-status error';
        }
        return;
      }

      var formData = new FormData(bookingForm);
      var details = {};
      formData.forEach(function (value, key) { details[key] = value; });

      // Persist the booking details locally so they can be reconciled with
      // the Stripe payment on the success page (or picked up by a backend).
      try {
        sessionStorage.setItem('consultationBooking', JSON.stringify(details));
      } catch (err) { /* sessionStorage unavailable — non-blocking */ }

      if (status) {
        status.textContent = 'Details confirmed — redirecting you to secure payment...';
        status.className = 'form-status success';
      }

      var submitBtn = bookingForm.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Redirecting to payment...'; }

      setTimeout(function () {
        window.location.href = CONFIG.stripePaymentLink;
      }, 900);
    });
  }
}());
