/**
 * FX1 Digital Hubs – Content Loader
 * ---------------------------------
 * Dynamically fetches and renders FX1 data from the JSON API
 * Integrates social media, token info, and game previews
 * 
 * Theme: Navy ✦ Gold ✦ White (Blockchain Glow)
 */

const FX1_API = "https://your-vercel-app.vercel.app/api/fx1"; 
// Or use: "https://your-vercel-app.vercel.app/data/fx1.json"

// Helper: Create glowing styled buttons
function createButton(label, url) {
  const btn = document.createElement("a");
  btn.href = url;
  btn.target = "_blank";
  btn.rel = "noopener";
  btn.textContent = label;
  btn.className = "fx1-button";
  return btn;
}

// Load FX1 Data
async function loadFX1() {
  try {
    const res = await fetch(FX1_API, { headers: { "Accept": "application/json" } });
    const fx1 = await res.json();

    // Hero Banner
    const hero = document.querySelector("[data-hero]");
    if (hero && fx1.site.bannerUrl) {
      hero.style.backgroundImage = `url('${fx1.site.bannerUrl}')`;
      hero.style.backgroundSize = "cover";
      hero.style.backgroundPosition = "center";
    }

    // Title + Tagline
    document.querySelector("[data-title]").textContent = fx1.site.title;
    document.querySelector("[data-tagline]").textContent = fx1.site.tagline;

    // Token Info
    const tokenBox = document.querySelector("[data-token]");
    if (tokenBox) {
      tokenBox.innerHTML = `
        <h3>$${fx1.token.symbol} Token</h3>
        <p><strong>Network:</strong> ${fx1.token.network}</p>
        <p><strong>Address:</strong> ${fx1.token.address}</p>
        <a href="${fx1.token.rainbow}" target="_blank" class="fx1-link">View on Rainbow</a>
      `;
    }

    // Socials
    const socials = document.querySelector("[data-socials]");
    socials.innerHTML = "";
    Object.entries(fx1.socials).forEach(([key, url]) => {
      socials.appendChild(createButton(key.toUpperCase(), url));
    });

    // Games
    const gameBox = document.querySelector("[data-games]");
    gameBox.innerHTML = "";
    fx1.games.forEach(game => {
      const card = document.createElement("div");
      card.className = "fx1-game-card";
      card.innerHTML = `
        <h4>${game.name}</h4>
        <p>Status: <span>${game.status}</span></p>
        <a href="${game.url}" target="_blank" class="fx1-link">Play</a>
      `;
      gameBox.appendChild(card);
    });

  } catch (err) {
    console.error("⚠️ FX1 Data Fetch Failed:", err);
    document.querySelector("[data-title]").textContent = "⚠️ Error loading FX1 data";
  }
}

// Run Loader
document.addEventListener("DOMContentLoaded", loadFX1);
