/* Petlife — petlifeindia.co
 * Motion is deliberate and calm: scroll-in fade & lift, hover lifts, one slow
 * status pulse. Nothing loops continuously except that pulse.
 */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky nav ---------- */
  const nav = document.getElementById("nav");
  if (nav && !nav.classList.contains("is-solid")) {
    const onScrollNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
    onScrollNav();
    window.addEventListener("scroll", onScrollNav, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById("navBurger");
  const links = document.getElementById("navLinks");
  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      })
    );
  }

  /* ---------- Scroll reveals: opacity 0→1, translateY(12px)→0 ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- The Garden Walk: trail draws with scroll position ---------- */
  const trail = document.getElementById("pawTrail");
  const stage = document.querySelector(".walk__stage");
  const paws = document.querySelectorAll(".walk__paw");

  if (trail && stage && !prefersReducedMotion) {
    let ticking = false;

    const drawTrail = () => {
      ticking = false;
      const rect = stage.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.85;
      const end = vh * 0.45 - rect.height;
      const progress = Math.min(1, Math.max(0, (rect.top - start) / (end - start)));

      trail.style.clipPath = "inset(0 0 " + (100 - progress * 100) + "% 0)";
      paws.forEach((paw) => {
        const y = parseFloat(paw.style.getPropertyValue("--y")) / 100;
        paw.classList.toggle("is-stamped", progress >= y);
      });
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) { ticking = true; requestAnimationFrame(drawTrail); }
      },
      { passive: true }
    );
    drawTrail();
  } else {
    paws.forEach((paw) => paw.classList.add("is-stamped"));
  }

  /* ---------- Trust strip counters ---------- */
  const counters = document.querySelectorAll(".strip__num");
  const formatNum = (value, decimals) => {
    if (decimals > 0) return value.toFixed(decimals);
    if (value >= 1000) return new Intl.NumberFormat("en-IN").format(Math.round(value));
    return String(Math.round(value));
  };

  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimal || "0", 10);
    if (prefersReducedMotion) {
      el.textContent = formatNum(target, decimals);
      return;
    }
    const duration = 1400;
    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatNum(target * eased, decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ---------- Brand mark: keep the slot tidy if the asset is absent ----------
   * petlife/logo.png is the single authorised brand file, supplied by the brand
   * owner. It is never generated here. If it hasn't been added yet, hide the
   * slot rather than showing a broken-image box; the wordmark carries the lockup.
   */
  const hideIfBroken = (img) => { img.style.visibility = "hidden"; };
  document.querySelectorAll('img[src$="logo.png"]').forEach((img) => {
    img.addEventListener("error", () => hideIfBroken(img));
    if (img.complete && img.naturalWidth === 0) hideIfBroken(img);
  });

  /* ---------- Hide any pet photo that fails to load ---------- */
  document.querySelectorAll(".gallery img").forEach((img) => {
    img.addEventListener("error", () => {
      const fig = img.closest("figure");
      if (fig) fig.style.display = "none";
    });
  });

  /* ---------- Dual-role toggle: glides between modes while on screen ---------- */
  const roleToggle = document.getElementById("roleToggle");
  if (roleToggle) {
    const opts = roleToggle.querySelectorAll(".role-toggle__opt");
    let isBuddy = false;
    let timer = null;

    const setRole = (buddy) => {
      isBuddy = buddy;
      roleToggle.classList.toggle("is-buddy", buddy);
      opts.forEach((opt, i) => opt.classList.toggle("is-active", i === (buddy ? 1 : 0)));
    };

    const start = () => {
      if (timer || prefersReducedMotion) return;
      timer = window.setInterval(() => setRole(!isBuddy), 3200);
    };
    const stop = () => { window.clearInterval(timer); timer = null; };

    // Only animate while the card is actually in view.
    new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0.4 }
    ).observe(roleToggle);

    // Let people drive it themselves; pause the loop while they do.
    opts.forEach((opt, i) => {
      opt.addEventListener("mouseenter", () => { stop(); setRole(i === 1); });
    });
    roleToggle.addEventListener("mouseleave", start);
  }

  /* ---------- FAQ: close others when one opens ---------- */
  const faqItems = document.querySelectorAll(".faq__item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) {
        faqItems.forEach((other) => { if (other !== item) other.open = false; });
      }
    });
  });

  /* =======================================================================
     FORMS — contact, Pet Buddy application, job application
     ======================================================================= */
  const cfg = window.PETLIFE_CONFIG || {};
  const endpoint = cfg.SUPABASE_URL
    ? cfg.SUPABASE_URL.replace(/\/+$/, "") + "/functions/v1/submit-form"
    : "";

  const MAX_RESUME_BYTES = 4 * 1024 * 1024;
  const MAX_COVER_WORDS = 200;

  const isEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  const countWords = (v) => (v.trim() ? v.trim().split(/\s+/).length : 0);

  const setError = (input, message) => {
    const field = input.closest(".field");
    if (!field) return;
    field.classList.toggle("has-error", !!message);
    const slot = field.querySelector(".field__error");
    if (slot) slot.textContent = message || "";
  };

  const showStatus = (form, message, kind) => {
    const el = form.querySelector("[data-status]");
    if (!el) return;
    el.textContent = message;
    el.className = "form-card__status " + (kind === "ok" ? "is-ok" : "is-error");
  };

  const clearStatus = (form) => {
    const el = form.querySelector("[data-status]");
    if (el) { el.textContent = ""; el.className = "form-card__status"; }
  };

  const RULES = {
    name: (v) => (v.trim().length < 2 ? "Enter your full name." : ""),
    email: (v) => (!isEmail(v.trim()) ? "Enter a valid email address." : ""),
    phone: (v) => (v.replace(/\D/g, "").length < 6 ? "Enter a valid phone number." : ""),
    location: (v) => (v.trim().length < 2 ? "Enter your city or area." : ""),
    service: (v) => (!v ? "Choose the service you offer." : ""),
    position: (v) => (!v ? "Choose the role you're applying for." : ""),
    experience_level: (v) => (!v ? "Choose your experience level." : ""),
    experience_years: (v) => (v === "" ? "Choose your years of experience." : ""),
    message: (v) => (v.trim().length < 5 ? "Tell us a little more so we can help." : ""),
    cover_note: (v) => {
      if (v.trim().length < 10) return "Tell us a little about yourself.";
      if (countWords(v) > MAX_COVER_WORDS) return "Please keep this under " + MAX_COVER_WORDS + " words.";
      return "";
    },
  };

  // Read a File as a base64 string (no data: prefix).
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result);
        resolve(result.slice(result.indexOf(",") + 1));
      };
      reader.onerror = () => reject(new Error("Couldn't read that file."));
      reader.readAsDataURL(file);
    });

  const wireForm = (form, formKind) => {
    if (!form) return;
    const submit = form.querySelector('button[type="submit"]');
    const submitLabel = submit ? submit.textContent : "";

    form.querySelectorAll("input, select, textarea").forEach((input) => {
      const evt = input.tagName === "SELECT" || input.type === "file" ? "change" : "input";
      input.addEventListener(evt, () => setError(input, ""));
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearStatus(form);

      const payload = { form: formKind };
      let firstBad = null;
      let resumeFile = null;

      for (const input of form.querySelectorAll("input, select, textarea")) {
        const key = input.name;
        if (!key) continue;

        if (key === "company") { payload.company = input.value; continue; }

        if (input.type === "file") {
          const file = input.files && input.files[0];
          let problem = "";
          if (!file) {
            problem = input.required ? "Attach your resume (PDF or Word)." : "";
          } else if (!/\.(pdf|docx?)$/i.test(file.name)) {
            problem = "Upload a PDF or Word document.";
          } else if (file.size > MAX_RESUME_BYTES) {
            problem = "That file is over 4 MB. Please upload a smaller one.";
          } else {
            resumeFile = file;
          }
          setError(input, problem);
          if (problem && !firstBad) firstBad = input;
          continue;
        }

        const value = input.value;
        const rule = RULES[key];
        const mustCheck = rule && (input.required || value.trim() !== "");
        const problem = mustCheck ? rule(value) : "";

        setError(input, problem);
        if (problem && !firstBad) firstBad = input;

        payload[key] = key === "experience_years" && value !== "" ? Number(value) : value.trim();
      }

      if (firstBad) {
        firstBad.focus({ preventScroll: false });
        showStatus(form, "Please fix the highlighted fields and try again.", "error");
        return;
      }

      if (!endpoint || !cfg.SUPABASE_ANON_KEY) {
        const inbox = formKind === "contact" ? "info@petlifeindia.co" : "hr@petlifeindia.co";
        showStatus(
          form,
          "This form isn't connected yet. Please email " + inbox +
            " or call +91 84510 72388 — we'll reply the same day.",
          "error"
        );
        return;
      }

      if (submit) { submit.disabled = true; submit.textContent = "Sending…"; }

      try {
        if (resumeFile) {
          payload.resume_filename = resumeFile.name;
          payload.resume_base64 = await fileToBase64(resumeFile);
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: cfg.SUPABASE_ANON_KEY,
            Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Request failed");

        form.reset();
        resetFileDrop();
        updateWordCount();
        showStatus(
          form,
          formKind === "contact"
            ? "Message sent. We'll reply to your email shortly — usually the same day."
            : formKind === "career"
            ? "Application received. We read every one and reply within a week."
            : "Application received. Our team will get back to you within 2 working days.",
          "ok"
        );
      } catch (err) {
        console.error(err);
        showStatus(
          form,
          (err && err.message) ||
            "Something went wrong sending that. Please try again, or email hr@petlifeindia.co.",
          "error"
        );
      } finally {
        if (submit) { submit.disabled = false; submit.textContent = submitLabel; }
      }
    });
  };

  /* ---------- Careers: file picker label, word counter, role deep-link ---------- */
  const fileInput = document.getElementById("j-resume");
  const fileDrop = document.getElementById("fileDrop");
  const fileName = document.getElementById("fileName");
  const fileHint = document.getElementById("fileHint");

  function resetFileDrop() {
    if (!fileDrop) return;
    fileDrop.classList.remove("has-file");
    if (fileName) fileName.textContent = "Choose a file";
    if (fileHint) fileHint.textContent = "PDF or Word document, up to 4 MB";
  }

  if (fileInput && fileDrop) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return resetFileDrop();
      fileDrop.classList.add("has-file");
      if (fileName) fileName.textContent = file.name;
      if (fileHint) fileHint.textContent = (file.size / 1048576).toFixed(1) + " MB · tap to change";
    });
  }

  const coverField = document.getElementById("j-cover");
  const wordCountEl = document.getElementById("wordCount");

  function updateWordCount() {
    if (!coverField || !wordCountEl) return;
    const words = countWords(coverField.value);
    wordCountEl.textContent = words + " / " + MAX_COVER_WORDS + " words";
    wordCountEl.classList.toggle("is-over", words > MAX_COVER_WORDS);
  }

  if (coverField && wordCountEl) {
    coverField.addEventListener("input", updateWordCount);
    updateWordCount();
  }

  // "Apply for this role" buttons preselect the position and scroll to the form.
  document.querySelectorAll("[data-apply]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const select = document.getElementById("j-position");
      if (select) {
        select.value = btn.dataset.apply;
        setError(select, "");
      }
      const target = document.getElementById("apply");
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      window.setTimeout(() => {
        const nameField = document.getElementById("j-name");
        if (nameField) nameField.focus({ preventScroll: true });
      }, prefersReducedMotion ? 0 : 600);
    });
  });

  wireForm(document.getElementById("contactForm"), "contact");
  wireForm(document.getElementById("buddyForm"), "buddy");
  wireForm(document.getElementById("careerForm"), "career");
})();
