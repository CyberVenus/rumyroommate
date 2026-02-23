// Loads the navbar, determines login state, and returns the user (or null)
async function loadNavbar(activeRoute) {
  // -----------------------------------------------------------
  // 1) Inject navbar HTML into the page
  // WHY:
  // We keep navbar as a reusable partial so all pages share it.
  // This fetch grabs the HTML and mounts it into <div id="navbarMount">
  // -----------------------------------------------------------
  const res = await fetch("/partials/navbar.html", { cache: "no-store" });
  const html = await res.text();
  document.getElementById("navbarMount").innerHTML = html;

  // -----------------------------------------------------------
  // 2) Highlight the active link
  // WHY:
  // Each nav link has a data-route attribute.
  // We compare it to the current page route and visually mark it active.
  // -----------------------------------------------------------
  document.querySelectorAll("[data-route]").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("data-route") === activeRoute);
  });

  // -----------------------------------------------------------
  // 3) Determine if user is logged in
  // WHY:
  // We call the backend endpoint that checks the session.
  // If session exists → backend returns user.
  // If not → 401 or non-ok response.
  // -----------------------------------------------------------
  let user = null;

  try {
    const authRes = await fetch("/api/user-data", {
      credentials: "include", // important: sends cookies/session
    });

    if (authRes.ok) {
      user = await authRes.json();
    }
  } catch (_) {
    user = null;
  }

  const loggedIn = !!user;

  // -----------------------------------------------------------
  // 4) Show/Hide nav items based on login state
  // WHY:
  // Navbar HTML has:
  // data-auth="logged-in"
  // data-auth="logged-out"
  // We toggle visibility based on session status.
  // -----------------------------------------------------------
  document.querySelectorAll('[data-auth="logged-in"]').forEach((el) => {
    el.style.display = loggedIn ? "" : "none";
  });

  document.querySelectorAll('[data-auth="logged-out"]').forEach((el) => {
    el.style.display = loggedIn ? "none" : "";
  });

  // -----------------------------------------------------------
  // 5) Attach logout handler (only exists when logged in)
  // WHY:
  // The logout button only exists when logged in.
  // We safely check for its existence before binding.
  // This prevents the "null.addEventListener" crash you had.
  // -----------------------------------------------------------
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      // Invalidate session on backend
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      // Redirect to login page
      window.location.href = "/login";
    });
  }

  // -----------------------------------------------------------
  // 6) Sync profile picture from localStorage (optional feature)
  // WHY:
  // If you’re storing profile pics locally, this ensures navbar
  // always reflects the stored image.
  // -----------------------------------------------------------
  const savedProfilePic = localStorage.getItem("userProfilePic");

  if (savedProfilePic) {
    document.querySelectorAll('img[alt="Profile Picture"]').forEach((pic) => {
      pic.src = savedProfilePic;
    });
  }

  // -----------------------------------------------------------
  // 7) Return the authenticated user (or null)
  // WHY:
  // So pages don’t have to call /api/user-data AGAIN.
  // This prevents duplicate fetches and race conditions.
  // -----------------------------------------------------------
  return user;
}
